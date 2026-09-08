export type CommissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PDF_GENERATED";

export type AgentSettingsSnapshot = {
  agentId: string;
  agentName: string;
  withholdingTaxRate: string;
  gstRate: string;
  agentSplit: string;
  companySplit: string;
};

export type MoneyItem = {
  id: string;
  description: string;
  amountCents: number;
};

export type PercentageItem = {
  id: string;
  description: string;
  baseAmountCents: number;
  percentage: string;
  fixedAmountCents?: number;
};

export type ParticipantInput = {
  id: string;
  role: "LISTING" | "SELLING";
  agent: AgentSettingsSnapshot;
  teamSharePercentage: string;
  deductions: MoneyItem[];
  refunds: MoneyItem[];
};

export type ReferralInput = {
  id: string;
  recipient: string;
  baseAmountCents?: number;
  percentage: string;
};

export type EvidenceRecord = {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: "image/jpeg" | "image/png" | "image/webp";
  displayOrder: number;
  evidenceType:
    | "Vault Screenshot"
    | "Commission Agreement"
    | "Email Confirmation"
    | "Referral Agreement"
    | "Marketing Invoice"
    | "Other";
};

export type CommissionInput = {
  id: string;
  status: CommissionStatus;
  propertyAddress: string;
  salePriceCents: number;
  settlementDate: string;
  calculationDate: string;
  listingPercentage: string;
  sellingPercentage: string;
  preparedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  grossItems: PercentageItem[];
  plusItems: MoneyItem[];
  discounts: PercentageItem[];
  minusItems: MoneyItem[];
  officeDeductions: MoneyItem[];
  otherPayments: MoneyItem[];
  referrals: ReferralInput[];
  hasConjunctionOffice: boolean;
  conjunctionOfficeName?: string;
  conjunctionPercentage: string;
  ourOfficePercentage: string;
  conjunctionPlusItems: MoneyItem[];
  conjunctionMinusItems: MoneyItem[];
  ourOfficePlusItems: MoneyItem[];
  ourOfficeMinusItems: MoneyItem[];
  internalReferralFeeRate: string;
  franchiseFeeRate: string;
  participants: ParticipantInput[];
  evidence: EvidenceRecord[];
};

export type ValidationResult = {
  key: string;
  label: string;
  critical: boolean;
  balanced: boolean;
  differenceCents: number;
  message: string;
};

export type AgentPaymentResult = {
  participantId: string;
  agentName: string;
  role: "LISTING" | "SELLING";
  commissionBeforeTaxCents: number;
  gstCents: number;
  withholdingTaxCents: number;
  paymentIncludingGstCents: number;
  deductionsCents: number;
  payrollPaymentCents: number;
  refundsCents: number;
  netPaymentCents: number;
  companyCommissionCents: number;
};

export type CommissionResult = {
  grossCommissionCents: number;
  plusTotalCents: number;
  discountTotalCents: number;
  totalReceivedCommissionCents: number;
  officeDeductionsTotalCents: number;
  otherPaymentsTotalCents: number;
  netCommissionCents: number;
  referralFeeTotalCents: number;
  conjunctionGrossCommissionCents: number;
  netConjunctionCommissionCents: number;
  commissionIntoOurOfficeCents: number;
  ourOfficePlusTotalCents: number;
  netCommissionIntoOurOfficeCents: number;
  internalOfficeFeesTotalCents: number;
  franchiseFeeCents: number;
  internalReferralFeeCents: number;
  commissionAvailableForSplitCents: number;
  listingCommissionPoolCents: number;
  sellingCommissionPoolCents: number;
  totalAgentCommissionCents: number;
  totalCompanyCommissionCents: number;
  agentPayments: AgentPaymentResult[];
  totalDistributionToAgentsAndOthersCents: number;
  totalDistributionToCompanyCents: number;
  finalDifferenceCents: number;
  validations: ValidationResult[];
};
