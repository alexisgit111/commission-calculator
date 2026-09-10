import { snapshotAgent } from "../agents";
import type { CommissionInput } from "./types";

export const sampleCommission: CommissionInput = {
  id: "CC-2026-0001",
  status: "DRAFT",
  propertyAddress: "42 Example Road, Auckland",
  salePriceCents: 125000000,
  settlementDate: "2026-10-15",
  calculationDate: "2026-09-01",
  listingPercentage: "0.5",
  sellingPercentage: "0.5",
  preparedBy: "Admin Team",
  reviewedBy: "Manager",
  approvedBy: "",
  grossItems: [
    { id: "gross-1", description: "First $500,000", baseAmountCents: 50000000, percentage: "0.04" },
    { id: "gross-2", description: "Balance", baseAmountCents: 75000000, percentage: "0.02" }
  ],
  plusItems: [
    { id: "plus-admin-fee", description: "Admin Fee", amountCents: 75000 },
    { id: "plus-marketing-fee", description: "Marketing Fee", amountCents: 0 },
    { id: "plus-marketing-fee-refund", description: "Refund Marketing Fee to Agent", amountCents: 0 }
  ],
  discounts: [{ id: "discount-1", description: "Commission Discount", baseAmountCents: 0, percentage: "0" }],
  minusItems: [{ id: "minus-marketing-fee-refund", description: "Refund Marketing Fee to Vendor", amountCents: 0 }],
  officeDeductions: [
    { id: "office-admin-fee", description: "Admin Fee", amountCents: 75000 },
    { id: "office-marketing-fee", description: "Marketing Fee", amountCents: 0 },
    { id: "office-marketing-fee-refund", description: "Refund Marketing Fee to Agent", amountCents: 0 }
  ],
  otherPayments: [],
  referrals: [{ id: "referral-1", recipient: "Referral Fee", percentage: "0" }],
  hasConjunctionOffice: true,
  conjunctionOfficeName: "",
  conjunctionPercentage: "0",
  ourOfficePercentage: "1",
  conjunctionPlusItems: [],
  conjunctionMinusItems: [{ id: "conjunction-operational-fee", description: "Operational Fee", amountCents: 100000 }],
  ourOfficePlusItems: [],
  ourOfficeMinusItems: [],
  internalReferralFeeRate: "0",
  franchiseFeeRate: "0.08",
  participants: [
    {
      id: "listing-1",
      role: "LISTING",
      agent: snapshotAgent("miro-wang"),
      teamSharePercentage: "1",
      deductions: [],
      refunds: []
    },
    {
      id: "selling-1",
      role: "SELLING",
      agent: snapshotAgent("alana-sun"),
      teamSharePercentage: "1",
      deductions: [],
      refunds: []
    }
  ],
  evidence: []
};

export function createBlankCommission(): CommissionInput {
  return {
    ...sampleCommission,
    propertyAddress: "",
    salePriceCents: 0,
    settlementDate: "",
    calculationDate: "",
    listingPercentage: "0",
    sellingPercentage: "1",
    grossItems: sampleCommission.grossItems.map((item) => ({ ...item, baseAmountCents: 0 })),
    plusItems: sampleCommission.plusItems.map((item) => ({ ...item })),
    discounts: sampleCommission.discounts.map((item) => ({ ...item, baseAmountCents: 0, percentage: "0" })),
    minusItems: sampleCommission.minusItems.map((item) => ({ ...item, amountCents: 0 })),
    officeDeductions: sampleCommission.officeDeductions.map((item) => ({ ...item })),
    otherPayments: [],
    referrals: sampleCommission.referrals.map((item) => ({ ...item, percentage: "0" })),
    conjunctionPlusItems: [],
    conjunctionMinusItems: sampleCommission.conjunctionMinusItems.map((item) => ({ ...item })),
    ourOfficePlusItems: [],
    ourOfficeMinusItems: [],
    participants: [],
    evidence: []
  };
}
