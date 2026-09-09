import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CommissionInput, CommissionResult } from "@/lib/commission/types";
import { formatMoney, formatPercent, multiplyCents, percent } from "@/lib/commission/money";

const styles = StyleSheet.create({
  page: { padding: 34, fontSize: 10, color: "#001D4A", fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  headerCopy: { flex: 1, paddingRight: 16 },
  logo: { width: 128, height: 67, objectFit: "contain" },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 5 },
  property: { color: "#334155" },
  propertyLine: { marginBottom: 3 },
  section: { marginTop: 12 },
  sectionTitle: { borderBottom: "2 solid #001D4A", fontSize: 18, fontWeight: 700, marginBottom: 6, paddingBottom: 4 },
  groupTitle: { color: "#475569", fontSize: 11, fontWeight: 700, marginTop: 5, paddingBottom: 2 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 24, paddingHorizontal: 5 },
  alternateRow: { backgroundColor: "#E0F4FC" },
  label: { flex: 1.25, fontSize: 11 },
  subLabel: { flex: 1.25, fontSize: 10, paddingLeft: 14 },
  detail: { flex: 1, color: "#475569", fontSize: 9, textAlign: "right" },
  amount: { width: 110, fontSize: 11, fontWeight: 700, textAlign: "right" },
  totalRow: { borderTop: "2 solid #001D4A", marginTop: 3, paddingTop: 4 },
  footnote: { backgroundColor: "#E0F4FC", fontSize: 10, fontWeight: 700, marginTop: 7, padding: 6, textAlign: "right" },
  evidenceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  evidenceCard: { border: "1 solid #CBD5E1", padding: 5, width: "48%" },
  evidenceImage: { height: 105, objectFit: "contain", width: "100%" },
  evidenceCaption: { color: "#475569", fontSize: 8, marginTop: 3 },
  signatureRow: { flexDirection: "row", gap: 20, marginTop: 24 },
  signatureBox: { flex: 1 },
  signatureLine: { borderBottom: "1 solid #64748B", height: 28, marginBottom: 5 },
  signatureLabel: { color: "#475569", fontSize: 9, fontWeight: 700 }
});

function labelWithPercentage(label: string, rate: string) {
  return percent(rate).isZero() ? label : `${label} (${formatPercent(rate)})`;
}

function StatementRow({ label, detail, value, valueText, alternate = false, total = false, indent = false }: { label: string; detail?: string; value: number; valueText?: string; alternate?: boolean; total?: boolean; indent?: boolean }) {
  return (
    <View style={[styles.row, alternate ? styles.alternateRow : undefined, total ? styles.totalRow : undefined]}>
      <Text style={indent ? styles.subLabel : styles.label}>{label}</Text>
      <Text style={styles.detail}>{detail || ""}</Text>
      <Text style={styles.amount}>{valueText ?? formatMoney(value)}</Text>
    </View>
  );
}

export function CommissionStatementPdf({ input, result }: { input: CommissionInput; result: CommissionResult }) {
  const firstGrossBaseCents = input.grossItems[0]?.baseAmountCents ?? 0;
  const adminFeeCents = input.plusItems.find((item) => item.description === "Admin Fee")?.amountCents ?? 0;
  const companyDistributionCents = result.totalCompanyCommissionCents + adminFeeCents;
  const contributionRatio = result.totalReceivedCommissionCents > 0 ? companyDistributionCents / result.totalReceivedCommissionCents : 0;
  const combinedAgentCommissions = Array.from(
    result.agentPayments.reduce((totals, payment) => {
      const participant = input.participants.find((item) => item.id === payment.participantId);
      const key = participant?.agent.agentId ?? payment.agentName;
      const existing = totals.get(key) ?? { agentName: payment.agentName, roles: [] as string[], commissionCents: 0 };
      if (!existing.roles.includes(payment.role)) existing.roles.push(payment.role);
      existing.commissionCents += payment.commissionBeforeTaxCents;
      totals.set(key, existing);
      return totals;
    }, new Map<string, { agentName: string; roles: string[]; commissionCents: number }>()).values()
  ).filter((agent) => agent.roles.includes("LISTING") && agent.roles.includes("SELLING"));
  const logoSource = typeof window === "undefined" ? "/brand/harcourts-golden-links.png" : new URL("/brand/harcourts-golden-links.png", window.location.origin).toString();

  return (
    <Document title={`Commission-${input.propertyAddress}-${input.id}.pdf`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Commission Calculation</Text>
            <View style={styles.property}>
              <Text style={styles.propertyLine}>Address: {input.propertyAddress}</Text>
              <Text>Sale Price: {formatMoney(input.salePriceCents)}</Text>
            </View>
          </View>
          <Image src={logoSource} style={styles.logo} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          {input.grossItems.map((item, index) => {
            if (!item.description.trim()) return null;
            const baseAmountCents = index === 1 ? Math.max(input.salePriceCents - firstGrossBaseCents, 0) : item.baseAmountCents;
            const value = multiplyCents(baseAmountCents, item.percentage);
            return value === 0 ? null : <StatementRow key={item.id} label={labelWithPercentage(`Gross Commission - ${item.description}`, item.percentage)} value={value} />;
          })}
          <StatementRow label="Total Gross Commission" value={result.grossCommissionCents} alternate total />
          {input.plusItems.filter((item) => item.description.trim() && item.amountCents !== 0).map((item, index) => <StatementRow key={item.id} label={`Plus - ${item.description}`} value={item.amountCents} indent alternate={index % 2 === 0} />)}
          {input.discounts.filter((item) => item.description.trim() && multiplyCents(item.baseAmountCents || result.grossCommissionCents, item.percentage) !== 0).map((item) => <StatementRow key={item.id} label={labelWithPercentage(`Minus - ${item.description}`, item.percentage)} value={-multiplyCents(item.baseAmountCents || result.grossCommissionCents, item.percentage)} indent />)}
          {input.minusItems.filter((item) => item.description.trim() && item.amountCents !== 0).map((item) => <StatementRow key={item.id} label={`Minus - ${item.description}`} value={-item.amountCents} indent />)}
          <StatementRow label="Total Received Commission" value={result.totalReceivedCommissionCents} alternate total />
          {input.referrals.filter((item) => item.recipient.trim() && multiplyCents(item.baseAmountCents ?? result.netCommissionCents, item.percentage) !== 0).map((item) => <StatementRow key={item.id} label={labelWithPercentage(`Referral Fee - ${item.recipient}`, item.percentage)} value={-multiplyCents(item.baseAmountCents ?? result.netCommissionCents, item.percentage)} indent />)}
          {result.conjunctionGrossCommissionCents !== 0 && <StatementRow label={labelWithPercentage("Commission to Conjunction Office", input.conjunctionPercentage)} value={-result.conjunctionGrossCommissionCents} />}
          {input.conjunctionMinusItems.filter((item) => item.description.trim() && item.amountCents !== 0).map((item) => <StatementRow key={item.id} label={`Conjunction Office Minus - ${item.description}`} value={-item.amountCents} indent />)}
          {input.plusItems.filter((item) => ["Admin Fee", "Marketing Fee", "Refund Marketing Fee to Agent"].includes(item.description) && item.amountCents !== 0).map((item) => <StatementRow key={`internal-${item.id}`} label={`Internal Office Fee - ${item.description}`} value={-item.amountCents} indent />)}
          {result.franchiseFeeCents !== 0 && <StatementRow label={labelWithPercentage("Internal Office Fee - Franchise Fee", input.franchiseFeeRate)} value={-result.franchiseFeeCents} />}
          {result.internalReferralFeeCents !== 0 && <StatementRow label={labelWithPercentage("Internal Office Fee - Referral Fee", input.internalReferralFeeRate)} value={-result.internalReferralFeeCents} />}
          <StatementRow label="Commission Available for Split" value={result.commissionAvailableForSplitCents} alternate total />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agent Splits</Text>
          {(["LISTING", "SELLING"] as const).map((role) => {
            const payments = result.agentPayments.filter((payment) => payment.role === role);
            return (
              <View key={role}>
                <Text style={styles.groupTitle}>{role === "LISTING" ? "Listing" : "Selling"}</Text>
                {payments.map((payment, index) => {
                  const participant = input.participants.find((item) => item.id === payment.participantId);
                  const detail = participant ? `Team ${formatPercent(participant.teamSharePercentage)} / Agent ${formatPercent(participant.agent.agentSplit)}` : "";
                  return <StatementRow key={payment.participantId} label={payment.agentName} detail={detail} value={payment.commissionBeforeTaxCents} alternate={index % 2 === 1} />;
                })}
              </View>
            );
          })}
          <StatementRow label="Agent Total Distribution" value={result.totalAgentCommissionCents} alternate total />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agent Commission Breakdown</Text>
          {result.agentPayments.map((payment, index) => (
            <StatementRow
              key={`breakdown-${payment.participantId}`}
              label={`${payment.agentName} (${payment.role === "LISTING" ? "Listing" : "Selling"})`}
              detail={`Commission ${formatMoney(payment.commissionBeforeTaxCents)} | GST ${formatMoney(payment.gstCents)} | WHT -${formatMoney(payment.withholdingTaxCents)}`}
              value={payment.netPaymentCents}
              alternate={index % 2 === 1}
            />
          ))}
          {combinedAgentCommissions.map((agent) => (
            <StatementRow key={`combined-${agent.agentName}`} label={`${agent.agentName} Total Commission`} detail="Listing + Selling" value={agent.commissionCents} total />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Office Split</Text>
          <StatementRow label="Office Share" value={result.totalCompanyCommissionCents} />
          {adminFeeCents !== 0 && <StatementRow label="Admin Fee" value={adminFeeCents} indent alternate />}
          <StatementRow label="Company Distribution" detail="Office share + Admin Fee" value={companyDistributionCents} alternate total />
          <StatementRow label="Contribution Ratio" detail="Company Distribution / Total Received Commission" value={0} valueText={formatPercent(String(contributionRatio))} />
          <Text style={styles.footnote}>100.00% of {formatMoney(result.commissionAvailableForSplitCents)} Commission Available for Split</Text>
        </View>

        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Admin Team Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Manager Signature</Text>
          </View>
        </View>
      </Page>
      {input.evidence.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Evidence</Text>
          <View style={styles.evidenceGrid}>
            {input.evidence.slice(0, 10).map((evidence, index) => (
              <View style={styles.evidenceCard} key={evidence.id}>
                <Image src={evidence.fileUrl} style={styles.evidenceImage} />
                <Text style={styles.evidenceCaption}>{String(index + 1).padStart(2, "0")}. {evidence.fileName}</Text>
              </View>
            ))}
          </View>
        </Page>
      )}
    </Document>
  );
}
