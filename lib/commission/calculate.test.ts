import { describe, expect, it } from "vitest";
import { snapshotAgent } from "../agents";
import { calculateCommission } from "./calculate";
import { sampleCommission } from "./sample";

function expectBalanced(input = sampleCommission) {
  const result = calculateCommission(input);
  expect(result.finalDifferenceCents).toBe(0);
  expect(result.validations.filter((v) => v.critical).every((v) => v.balanced)).toBe(true);
  return result;
}

describe("calculateCommission", () => {
  it("reconciles a 50/50 listing and selling calculation", () => {
    const result = expectBalanced();
    expect(result.totalReceivedCommissionCents).toBe(3575000);
  });

  it("derives the second gross commission base from the sales price", () => {
    const result = calculateCommission({ ...sampleCommission, salePriceCents: 100000000 });
    expect(result.grossCommissionCents).toBe(3000000);
  });

  it("deducts a marketing fee refund to vendor from the total received", () => {
    const result = calculateCommission({
      ...sampleCommission,
      minusItems: [{ id: "marketing-refund", description: "Refund Marketing Fee to Vendor", amountCents: 12500 }]
    });
    expect(result.totalReceivedCommissionCents).toBe(3562500);
  });

  it("reconciles a 100% listing transaction", () => {
    expectBalanced({ ...sampleCommission, listingPercentage: "1", sellingPercentage: "0", participants: sampleCommission.participants.slice(0, 1) });
  });

  it("supports multiple listing and selling agents", () => {
    expectBalanced({
      ...sampleCommission,
      participants: [
        { ...sampleCommission.participants[0], id: "l1", teamSharePercentage: "0.6" },
        { ...sampleCommission.participants[0], id: "l2", agent: snapshotAgent("alan-cai"), teamSharePercentage: "0.4" },
        { ...sampleCommission.participants[1], id: "s1", teamSharePercentage: "0.75" },
        { ...sampleCommission.participants[1], id: "s2", agent: snapshotAgent("nigel-shi"), teamSharePercentage: "0.25" }
      ]
    });
  });

  it("supports conjunction office and referral commission", () => {
    expectBalanced({
      ...sampleCommission,
      hasConjunctionOffice: true,
      conjunctionOfficeName: "Partner Realty",
      conjunctionPercentage: "0.25",
      ourOfficePercentage: "0.75",
      referrals: [{ id: "ref-1", recipient: "Referral Partner", percentage: "0.1" }]
    });
  });

  it("handles GST registered, non-GST, 20% WHT, and 0% WHT agents", () => {
    const result = expectBalanced({
      ...sampleCommission,
      participants: [
        { ...sampleCommission.participants[0], agent: snapshotAgent("miro-wang") },
        { ...sampleCommission.participants[1], agent: snapshotAgent("swapnil-gaonkar") }
      ]
    });
    expect(result.agentPayments[0].gstCents).toBeGreaterThan(0);
    expect(result.agentPayments[1].gstCents).toBe(0);
  });

  it("supports discounts, deductions, refunds, and rounding to cents", () => {
    const result = expectBalanced({
      ...sampleCommission,
      discounts: [{ id: "disc-1", description: "Commission discount", baseAmountCents: 3569500, percentage: "0.015" }],
      participants: [
        { ...sampleCommission.participants[0], deductions: [{ id: "ded-1", description: "Marketing Fee", amountCents: 12345 }] },
        { ...sampleCommission.participants[1], refunds: [{ id: "ref-1", description: "Marketing Fee Refund", amountCents: 6789 }] }
      ]
    });
    expect(result.discountTotalCents).toBe(53543);
  });

  it("detects validation differences", () => {
    const result = calculateCommission({ ...sampleCommission, sellingPercentage: "0.4" });
    expect(result.validations.find((v) => v.key === "transaction-split")?.balanced).toBe(false);
  });

  it("keeps submitted snapshots independent from live agent settings", () => {
    const original = snapshotAgent("miro-wang");
    const input = { ...sampleCommission, participants: [{ ...sampleCommission.participants[0], agent: original }] };
    const result = calculateCommission(input);
    const changed = { ...original, agentSplit: "0.75", companySplit: "0.25" };
    const changedResult = calculateCommission({ ...input, participants: [{ ...input.participants[0], agent: changed }] });
    expect(result.agentPayments[0].commissionBeforeTaxCents).not.toBe(changedResult.agentPayments[0].commissionBeforeTaxCents);
    expect(input.participants[0].agent.agentSplit).toBe("0.7");
  });
});
