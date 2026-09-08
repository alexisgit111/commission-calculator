import Decimal from "decimal.js";
import { multiplyCents, percent, sumCents } from "./money";
import type { CommissionInput, CommissionResult, ValidationResult } from "./types";

const TOLERANCE_CENTS = 1;

function differenceValidation(
  key: string,
  label: string,
  actualCents: number,
  expectedCents: number,
  critical = true
): ValidationResult {
  const differenceCents = actualCents - expectedCents;
  const balanced = Math.abs(differenceCents) <= TOLERANCE_CENTS;
  return {
    key,
    label,
    critical,
    balanced,
    differenceCents,
    message: balanced ? "Balanced" : `Difference: ${differenceCents}`
  };
}

function rateSumValidation(key: string, label: string, rates: string[], critical = true): ValidationResult {
  const actual = rates.reduce((sum, rate) => sum.plus(percent(rate)), new Decimal(0));
  const difference = actual.minus(1);
  const differenceCents = difference.mul(10000).toDecimalPlaces(0).toNumber();
  return {
    key,
    label,
    critical,
    balanced: difference.abs().lessThanOrEqualTo(0.000001),
    differenceCents,
    message: difference.abs().lessThanOrEqualTo(0.000001) ? "Balanced" : `Difference: ${difference.mul(100).toFixed(2)}%`
  };
}

function calculatedPercentageItemAmount(item: { baseAmountCents: number; percentage: string; fixedAmountCents?: number }) {
  return item.fixedAmountCents ?? multiplyCents(item.baseAmountCents, item.percentage);
}

function itemAmountByDescription(items: { description: string; amountCents: number }[], description: string) {
  return items.find((item) => item.description === description)?.amountCents ?? 0;
}

export function calculateCommission(input: CommissionInput): CommissionResult {
  const grossCommissionCents = sumCents(
    input.grossItems.map((item, index) => {
      const baseAmountCents = index === 1 ? Math.max(input.salePriceCents - (input.grossItems[0]?.baseAmountCents ?? 0), 0) : item.baseAmountCents;
      return calculatedPercentageItemAmount({ ...item, baseAmountCents });
    })
  );
  const plusTotalCents = sumCents(input.plusItems.map((item) => item.amountCents));
  const discounts = input.discounts.map((item) =>
    calculatedPercentageItemAmount({ ...item, baseAmountCents: item.baseAmountCents || grossCommissionCents })
  );
  const discountTotalCents = sumCents([...discounts, ...input.minusItems.map((item) => item.amountCents)]);
  const totalReceivedCommissionCents = grossCommissionCents + plusTotalCents - discountTotalCents;
  const officeDeductionsTotalCents = sumCents(input.officeDeductions.map((item) => item.amountCents));
  const otherPaymentsTotalCents = sumCents(input.otherPayments.map((item) => item.amountCents));
  const netCommissionCents = totalReceivedCommissionCents - officeDeductionsTotalCents;
  const referralFeeTotalCents = sumCents(
    input.referrals.map((referral) => multiplyCents(referral.baseAmountCents ?? netCommissionCents, referral.percentage))
  );
  const conjunctionBaseCents = netCommissionCents - referralFeeTotalCents;
  const conjunctionGrossCommissionCents = input.hasConjunctionOffice
    ? multiplyCents(conjunctionBaseCents, input.conjunctionPercentage)
    : 0;
  const conjunctionPlusTotalCents = sumCents(input.conjunctionPlusItems.map((item) => item.amountCents));
  const conjunctionMinusTotalCents = sumCents(input.conjunctionMinusItems.map((item) => item.amountCents));
  const netConjunctionCommissionCents =
    conjunctionGrossCommissionCents + conjunctionPlusTotalCents - conjunctionMinusTotalCents;
  const commissionIntoOurOfficeCents = multiplyCents(conjunctionBaseCents, input.ourOfficePercentage);
  const ourOfficePlusTotalCents = sumCents([
    itemAmountByDescription(input.conjunctionMinusItems, "Operational Fee"),
    itemAmountByDescription(input.plusItems, "Marketing Fee"),
    itemAmountByDescription(input.plusItems, "Refund Marketing Fee to Agent"),
    itemAmountByDescription(input.plusItems, "Admin Fee")
  ]);
  const netCommissionIntoOurOfficeCents = commissionIntoOurOfficeCents + ourOfficePlusTotalCents;
  const internalOfficeFeesTotalCents = sumCents([
    itemAmountByDescription(input.plusItems, "Admin Fee"),
    itemAmountByDescription(input.plusItems, "Marketing Fee"),
    itemAmountByDescription(input.plusItems, "Refund Marketing Fee to Agent")
  ]);
  const franchiseFeeBaseCents = netCommissionIntoOurOfficeCents - internalOfficeFeesTotalCents;
  const franchiseFeeCents = multiplyCents(franchiseFeeBaseCents, input.franchiseFeeRate);
  const internalReferralFeeBaseCents = franchiseFeeBaseCents - franchiseFeeCents;
  const internalReferralFeeCents = multiplyCents(internalReferralFeeBaseCents, input.internalReferralFeeRate);
  const commissionAvailableForSplitCents = internalReferralFeeBaseCents - internalReferralFeeCents;
  const listingCommissionPoolCents = multiplyCents(commissionAvailableForSplitCents, input.listingPercentage);
  const sellingCommissionPoolCents = multiplyCents(commissionAvailableForSplitCents, input.sellingPercentage);

  const baseByParticipant = new Map<string, number>();
  for (const role of ["LISTING", "SELLING"] as const) {
    const roleParticipants = input.participants.filter((participant) => participant.role === role);
    const pool = role === "LISTING" ? listingCommissionPoolCents : sellingCommissionPoolCents;
    let allocated = 0;
    roleParticipants.forEach((participant, index) => {
      const isLast = index === roleParticipants.length - 1;
      const base = isLast ? pool - allocated : multiplyCents(pool, participant.teamSharePercentage);
      allocated += base;
      baseByParticipant.set(participant.id, base);
    });
  }

  const agentPayments = input.participants.map((participant) => {
    const pool = participant.role === "LISTING" ? listingCommissionPoolCents : sellingCommissionPoolCents;
    const agentBaseCommissionCents = baseByParticipant.get(participant.id) ?? multiplyCents(pool, participant.teamSharePercentage);
    const commissionBeforeTaxCents = multiplyCents(agentBaseCommissionCents, participant.agent.agentSplit);
    const companyCommissionCents = agentBaseCommissionCents - commissionBeforeTaxCents;
    const gstCents = multiplyCents(commissionBeforeTaxCents, participant.agent.gstRate);
    const withholdingTaxCents = multiplyCents(commissionBeforeTaxCents, participant.agent.withholdingTaxRate);
    const paymentIncludingGstCents = commissionBeforeTaxCents + gstCents - withholdingTaxCents;
    const deductionsCents = sumCents(participant.deductions.map((item) => item.amountCents));
    const refundsCents = sumCents(participant.refunds.map((item) => item.amountCents));
    const payrollPaymentCents = paymentIncludingGstCents - deductionsCents;
    return {
      participantId: participant.id,
      agentName: participant.agent.agentName,
      role: participant.role,
      commissionBeforeTaxCents,
      gstCents,
      withholdingTaxCents,
      paymentIncludingGstCents,
      deductionsCents,
      payrollPaymentCents,
      refundsCents,
      netPaymentCents: payrollPaymentCents + refundsCents,
      companyCommissionCents
    };
  });

  const totalAgentCommissionCents = sumCents(agentPayments.map((payment) => payment.commissionBeforeTaxCents));
  const totalCompanyCommissionCents = sumCents(agentPayments.map((payment) => payment.companyCommissionCents));
  const totalDistributionToAgentsAndOthersCents =
    netConjunctionCommissionCents + internalReferralFeeCents + referralFeeTotalCents + totalAgentCommissionCents;
  const totalDistributionToCompanyCents = internalOfficeFeesTotalCents + totalCompanyCommissionCents;
  const finalDifferenceCents =
    totalDistributionToAgentsAndOthersCents + totalDistributionToCompanyCents + franchiseFeeCents - totalReceivedCommissionCents;

  const listingParticipants = input.participants.filter((participant) => participant.role === "LISTING");
  const sellingParticipants = input.participants.filter((participant) => participant.role === "SELLING");
  const validations: ValidationResult[] = [
    rateSumValidation("transaction-split", "Listing + selling percentage", [input.listingPercentage, input.sellingPercentage]),
    rateSumValidation("listing-team", "Listing team allocation", listingParticipants.map((p) => p.teamSharePercentage), listingParticipants.length > 0),
    rateSumValidation("selling-team", "Selling team allocation", sellingParticipants.map((p) => p.teamSharePercentage), sellingParticipants.length > 0),
    ...input.participants.map((participant) =>
      rateSumValidation(`${participant.id}-split`, `${participant.agent.agentName} split`, [
        participant.agent.agentSplit,
        participant.agent.companySplit
      ])
    ),
    differenceValidation(
      "net-commission",
      "Net commission reconciliation",
      netCommissionCents,
      totalReceivedCommissionCents - officeDeductionsTotalCents
    ),
    differenceValidation(
      "conjunction",
      "Conjunction office reconciliation",
      commissionIntoOurOfficeCents + netConjunctionCommissionCents + conjunctionMinusTotalCents + referralFeeTotalCents,
      netCommissionCents
    ),
    differenceValidation(
      "agent-distribution",
      "Agent distribution reconciliation",
      totalAgentCommissionCents + totalCompanyCommissionCents,
      listingCommissionPoolCents + sellingCommissionPoolCents
    ),
    differenceValidation(
      "received-distribution",
      "Total received commission reconciles",
      totalDistributionToAgentsAndOthersCents + totalDistributionToCompanyCents + franchiseFeeCents,
      totalReceivedCommissionCents
    )
  ];

  return {
    grossCommissionCents,
    plusTotalCents,
    discountTotalCents,
    totalReceivedCommissionCents,
    officeDeductionsTotalCents,
    otherPaymentsTotalCents,
    netCommissionCents,
    referralFeeTotalCents,
    conjunctionGrossCommissionCents,
    netConjunctionCommissionCents,
    commissionIntoOurOfficeCents,
    ourOfficePlusTotalCents,
    netCommissionIntoOurOfficeCents,
    internalOfficeFeesTotalCents,
    franchiseFeeCents,
    internalReferralFeeCents,
    commissionAvailableForSplitCents,
    listingCommissionPoolCents,
    sellingCommissionPoolCents,
    totalAgentCommissionCents,
    totalCompanyCommissionCents,
    agentPayments,
    totalDistributionToAgentsAndOthersCents,
    totalDistributionToCompanyCents,
    finalDifferenceCents,
    validations
  };
}
