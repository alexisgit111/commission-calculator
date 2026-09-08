"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download, MonitorUp, Plus, ShieldCheck, Trash2, Upload } from "lucide-react";
import { agents, snapshotAgent } from "@/lib/agents";
import { calculateCommission } from "@/lib/commission/calculate";
import { formatMoney, formatPercent, percent } from "@/lib/commission/money";
import { sampleCommission } from "@/lib/commission/sample";
import type { CommissionInput, EvidenceRecord, MoneyItem, ParticipantInput, PercentageItem } from "@/lib/commission/types";
import { ValidationRow } from "@/components/ui";

function dollarsToCents(value: string) {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  return Math.round((Number(cleaned) || 0) * 100);
}

function centsToInput(value: number) {
  return value ? (value / 100).toFixed(2) : "";
}

function rateToInput(value: string) {
  return percent(value).mul(100).toDecimalPlaces(2).toString();
}

function inputToRate(value: string) {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  return String((Number(cleaned) || 0) / 100);
}

function replaceItem<T extends { id: string }>(items: T[], id: string, patch: Partial<T>) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

type CropPoint = { x: number; y: number };
type CropSelection = { x: number; y: number; width: number; height: number };

function MoneyReadout({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-3 text-sm last:border-0">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="text-base font-bold tabular-nums text-slate-950">{formatMoney(value)}</span>
    </div>
  );
}

function BreakdownRow({ label, formula, value }: { label: string; formula: string; value: number }) {
  return (
    <div className="grid gap-2 border-b border-slate-200 py-3.5 last:border-0 md:grid-cols-[1.1fr_1.6fr_0.8fr]">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="text-sm text-slate-500">{formula}</span>
      <span className="text-right text-sm font-semibold text-slate-950">{formatMoney(value)}</span>
    </div>
  );
}

function TableInput({
  value,
  onChange,
  inputMode = "text",
  prefix,
  suffix,
  invalid = false
}: {
  value: string;
  onChange: (value: string) => void;
  inputMode?: "text" | "decimal";
  prefix?: string;
  suffix?: string;
  invalid?: boolean;
}) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-sm text-slate-500">{prefix}</span>}
      <input
        className={`h-10 w-full rounded-md border py-1 text-sm shadow-none focus:ring-1 ${invalid ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-slate-200 bg-white"} ${prefix ? "pl-6" : "px-2"} ${suffix ? "pr-7" : ""}`}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-sm text-slate-500">{suffix}</span>}
    </div>
  );
}

function DraftTableInput({
  initialValue,
  onChange,
  inputMode = "text",
  prefix,
  suffix,
  invalid = false
}: {
  initialValue: string;
  onChange: (value: string) => void;
  inputMode?: "text" | "decimal";
  prefix?: string;
  suffix?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState(initialValue);

  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-sm text-slate-500">{prefix}</span>}
      <input
        className={`h-10 w-full rounded-md border py-1 text-sm shadow-none focus:ring-1 ${invalid ? "border-red-500 bg-red-50 ring-1 ring-red-500" : "border-slate-200 bg-white"} ${prefix ? "pl-6" : "px-2"} ${suffix ? "pr-7" : ""}`}
        inputMode={inputMode}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(event.target.value);
        }}
      />
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-sm text-slate-500">{suffix}</span>}
    </div>
  );
}

function ExcelSection({ title }: { title: string }) {
  return (
    <tr>
      <td className="border-y border-slate-300 bg-slate-200 px-3 py-2.5 text-xs font-bold uppercase text-slate-700" colSpan={4}>
        {title}
      </td>
    </tr>
  );
}

function PercentageTableRow({
  label,
  item,
  onChange,
  result,
  baseAmountCents = item.baseAmountCents,
  baseAmountReadOnly = false
}: {
  label?: string;
  item: PercentageItem;
  onChange: (patch: Partial<PercentageItem>) => void;
  result: number;
  baseAmountCents?: number;
  baseAmountReadOnly?: boolean;
}) {
  return (
    <tr className="border-b border-slate-200 bg-white">
      <td className="px-3 py-1.5 text-sm font-medium text-slate-800">{label ? `${label} - ${item.description}` : item.description}</td>
      <td className="px-2 py-1.5">
        {baseAmountReadOnly ? (
          <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-100 px-2 text-sm text-slate-700">{formatMoney(baseAmountCents)}</div>
        ) : (
          <DraftTableInput initialValue={centsToInput(baseAmountCents)} inputMode="decimal" prefix="$" onChange={(value) => onChange({ baseAmountCents: dollarsToCents(value) })} />
        )}
      </td>
      <td className="px-2 py-1.5">
        <DraftTableInput initialValue={rateToInput(item.percentage)} inputMode="decimal" suffix="%" onChange={(value) => onChange({ percentage: inputToRate(value) })} />
      </td>
      <td className="px-3 py-1.5 text-right text-sm font-semibold text-slate-900">{formatMoney(result)}</td>
    </tr>
  );
}

function MoneyTableRow({
  label,
  item,
  onChange,
  amountReadOnly = false
}: {
  label?: string;
  item: MoneyItem;
  onChange: (patch: Partial<MoneyItem>) => void;
  amountReadOnly?: boolean;
}) {
  return (
    <tr className="border-b border-slate-200 bg-white">
      <td className="px-3 py-1.5 text-sm font-medium text-slate-800">{label || item.description}</td>
      <td className="px-2 py-1.5">
        {amountReadOnly ? (
          <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-100 px-2 text-sm text-slate-700">{formatMoney(item.amountCents)}</div>
        ) : (
          <DraftTableInput initialValue={centsToInput(item.amountCents)} inputMode="decimal" prefix="$" onChange={(value) => onChange({ amountCents: dollarsToCents(value) })} />
        )}
      </td>
      <td className="px-2 py-1.5" />
      <td className="px-3 py-1.5 text-right text-sm font-semibold text-slate-900">{formatMoney(item.amountCents)}</td>
    </tr>
  );
}

function TotalTableRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <tr className={strong ? "border-y-2 border-harcourts-navy bg-harcourts-navy" : "border-y border-slate-300 bg-slate-100"}>
      <td className={`px-3 py-3 text-sm font-bold ${strong ? "text-white" : "text-slate-800"}`} colSpan={3}>
        {label}
      </td>
      <td className={`px-3 py-3 text-right text-base font-bold tabular-nums ${strong ? "text-white" : "text-harcourts-navy"}`}>{formatMoney(value)}</td>
    </tr>
  );
}

function SheetSection({ children }: { children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">{children}</section>;
}

export default function NewCommissionPage() {
  const [input, setInput] = useState<CommissionInput>(sampleCommission);
  const [listingHeaderTeam, setListingHeaderTeam] = useState("");
  const [sellingHeaderTeam, setSellingHeaderTeam] = useState("");
  const [evidenceError, setEvidenceError] = useState("");
  const [capturePreview, setCapturePreview] = useState<string | null>(null);
  const [cropStart, setCropStart] = useState<CropPoint | null>(null);
  const [cropSelection, setCropSelection] = useState<CropSelection | null>(null);
  const cropPreviewRef = useRef<HTMLDivElement>(null);
  const result = useMemo(() => calculateCommission(input), [input]);
  const paymentByParticipantId = new Map(result.agentPayments.map((payment) => [payment.participantId, payment]));
  const validationByKey = new Map(result.validations.map((validation) => [validation.key, validation]));
  const transactionSplitInvalid = !validationByKey.get("transaction-split")?.balanced;
  const listingTeamInvalid = !validationByKey.get("listing-team")?.balanced;
  const sellingTeamInvalid = !validationByKey.get("selling-team")?.balanced;
  const propertyAddressInvalid = !input.propertyAddress.trim();
  const salePriceInvalid = input.salePriceCents <= 0;
  const ourOfficePlusItems: MoneyItem[] = [
    { id: "our-office-operational-fee", description: "Operational Fee", amountCents: input.conjunctionMinusItems.find((item) => item.description === "Operational Fee")?.amountCents ?? 0 },
    { id: "our-office-marketing-fee", description: "Marketing Fee", amountCents: input.plusItems.find((item) => item.description === "Marketing Fee")?.amountCents ?? 0 },
    { id: "our-office-marketing-fee-refund", description: "Refund Marketing Fee to Agent", amountCents: input.plusItems.find((item) => item.description === "Refund Marketing Fee to Agent")?.amountCents ?? 0 },
    { id: "our-office-admin-fee", description: "Admin Fee", amountCents: input.plusItems.find((item) => item.description === "Admin Fee")?.amountCents ?? 0 }
  ];
  const internalOfficeFeeItems: MoneyItem[] = [
    { id: "internal-office-admin-fee", description: "Admin Fee", amountCents: input.plusItems.find((item) => item.description === "Admin Fee")?.amountCents ?? 0 },
    { id: "internal-office-marketing-fee", description: "Marketing Fee", amountCents: input.plusItems.find((item) => item.description === "Marketing Fee")?.amountCents ?? 0 },
    { id: "internal-office-marketing-fee-refund", description: "Refund Marketing Fee to Agent", amountCents: input.plusItems.find((item) => item.description === "Refund Marketing Fee to Agent")?.amountCents ?? 0 }
  ];
  const canApprove = result.validations.filter((v) => v.critical).every((v) => v.balanced);

  function updateInput(patch: Partial<CommissionInput>) {
    setInput((current) => ({ ...current, ...patch }));
  }

  function updateParticipant(id: string, patch: Partial<ParticipantInput>) {
    setInput((current) => ({
      ...current,
      participants: current.participants.map((participant) => (participant.id === id ? { ...participant, ...patch } : participant))
    }));
  }

  function addParticipant(role: ParticipantInput["role"]) {
    const roleParticipants = input.participants.filter((participant) => participant.role === role);
    updateInput({
      participants: [
        ...input.participants,
        {
          id: `${role.toLowerCase()}-${roleParticipants.length + 1}`,
          role,
          agent: snapshotAgent(agents[0].id),
          teamSharePercentage: "0",
          deductions: [],
          refunds: []
        }
      ]
    });
  }

  function removeParticipant(id: string) {
    updateInput({ participants: input.participants.filter((participant) => participant.id !== id) });
  }

  function clearCalculator() {
    if (!window.confirm("Clear all entered calculator details?")) return;

    input.evidence.forEach((evidence) => URL.revokeObjectURL(evidence.fileUrl));

    setInput({
      ...sampleCommission,
      propertyAddress: "",
      salePriceCents: 0,
      settlementDate: "",
      calculationDate: "",
      listingPercentage: "0",
      sellingPercentage: "0",
      grossItems: sampleCommission.grossItems.map((item, index) => ({ ...item, baseAmountCents: index === 0 ? item.baseAmountCents : 0 })),
      discounts: sampleCommission.discounts.map((item) => ({ ...item, baseAmountCents: 0, percentage: "0" })),
      minusItems: sampleCommission.minusItems.map((item) => ({ ...item, amountCents: 0 })),
      referrals: sampleCommission.referrals.map((item) => ({ ...item, percentage: "0" })),
      conjunctionPercentage: "0",
      ourOfficePercentage: "0",
      internalReferralFeeRate: "0",
      participants: []
    });
    setListingHeaderTeam("");
    setSellingHeaderTeam("");
    setEvidenceError("");
  }

  function addEvidenceFiles(files: File[]) {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const selectedFiles = files.filter((file) => allowedTypes.has(file.type));
    const availableSlots = 10 - input.evidence.length;
    const filesToAdd = selectedFiles.slice(0, Math.max(availableSlots, 0));

    if (filesToAdd.length !== selectedFiles.length) {
      setEvidenceError("A maximum of 10 evidence screenshots can be attached.");
    } else if (selectedFiles.length !== files.length) {
      setEvidenceError("Only JPG, PNG, and WebP screenshots can be attached.");
    } else {
      setEvidenceError("");
    }

    const additions: EvidenceRecord[] = filesToAdd.map((file, index) => ({
      id: `evidence-${Date.now()}-${index}`,
      fileUrl: URL.createObjectURL(file),
      fileName: file.name,
      fileType: file.type as EvidenceRecord["fileType"],
      displayOrder: input.evidence.length + index,
      evidenceType: "Other"
    }));
    updateInput({ evidence: [...input.evidence, ...additions] });
  }

  function uploadEvidence(files: FileList | null) {
    if (files) addEvidenceFiles(Array.from(files));
  }

  async function captureScreenshot() {
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      setCapturePreview(canvas.toDataURL("image/png"));
      setCropSelection(null);
      setCropStart(null);
    } catch {
      setEvidenceError("Screen capture was cancelled or unavailable.");
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
    }
  }

  function cropPointFromEvent(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100))
    };
  }

  function beginCrop(event: React.PointerEvent<HTMLDivElement>) {
    const point = cropPointFromEvent(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    setCropStart(point);
    setCropSelection({ x: point.x, y: point.y, width: 0, height: 0 });
  }

  function updateCrop(event: React.PointerEvent<HTMLDivElement>) {
    if (!cropStart) return;
    const point = cropPointFromEvent(event);
    setCropSelection({
      x: Math.min(cropStart.x, point.x),
      y: Math.min(cropStart.y, point.y),
      width: Math.abs(point.x - cropStart.x),
      height: Math.abs(point.y - cropStart.y)
    });
  }

  async function saveCapturedCrop() {
    if (!capturePreview) return;
    const image = new Image();
    image.src = capturePreview;
    await image.decode();

    const selection = cropSelection && cropSelection.width > 1 && cropSelection.height > 1
      ? cropSelection
      : { x: 0, y: 0, width: 100, height: 100 };
    const canvas = document.createElement("canvas");
    canvas.width = Math.round((selection.width / 100) * image.naturalWidth);
    canvas.height = Math.round((selection.height / 100) * image.naturalHeight);
    canvas.getContext("2d")?.drawImage(
      image,
      (selection.x / 100) * image.naturalWidth,
      (selection.y / 100) * image.naturalHeight,
      (selection.width / 100) * image.naturalWidth,
      (selection.height / 100) * image.naturalHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (blob) addEvidenceFiles([new File([blob], `evidence-${Date.now()}.png`, { type: "image/png" })]);
    setCapturePreview(null);
    setCropSelection(null);
    setCropStart(null);
  }

  function removeEvidence(id: string) {
    const evidence = input.evidence.find((item) => item.id === id);
    if (evidence) URL.revokeObjectURL(evidence.fileUrl);
    updateInput({ evidence: input.evidence.filter((item) => item.id !== id) });
    setEvidenceError("");
  }

  function updatePlusItem(id: string, patch: Partial<MoneyItem>) {
    setInput((current) => {
      const plusItems = replaceItem(current.plusItems, id, patch);
      const officeDeductions = current.officeDeductions.map((item) => {
        const matchingPlusItem = plusItems.find((plusItem) => plusItem.description === item.description);
        return matchingPlusItem ? { ...item, amountCents: matchingPlusItem.amountCents } : item;
      });
      return { ...current, plusItems, officeDeductions };
    });
  }

  async function generatePdf() {
    const [{ pdf }, { CommissionStatementPdf }] = await Promise.all([import("@react-pdf/renderer"), import("@/lib/pdf/statement")]);
    const blob = await pdf(<CommissionStatementPdf input={{ ...input, status: "PDF_GENERATED" }} result={result} />).toBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const safeAddress = input.propertyAddress.trim().replace(/[<>:"/\\|?*]+/g, "-").replace(/\s+/g, " ") || "commission";
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(new Date());
    anchor.download = `${safeAddress} - commission statement - ${date}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-6 py-4">
          <div>
            <Link className="text-sm font-semibold text-harcourts-blue" href="/">
              Commission Calculator
            </Link>
            <h1 className="text-xl font-semibold text-harcourts-navy">New Commission</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700" onClick={clearCalculator}>
              <Trash2 className="h-4 w-4" /> Clear Calculator
            </button>
          </div>
        </div>
      </header>

      {capturePreview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-6">
          <div className="w-full max-w-5xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-harcourts-navy">Crop Screenshot</h2>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700" onClick={() => setCropSelection(null)}>Reset</button>
                <button className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700" onClick={() => setCapturePreview(null)}>Cancel</button>
                <button className="rounded-md bg-harcourts-navy px-3 py-2 text-sm font-semibold text-white" onClick={saveCapturedCrop}>Add Evidence</button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-auto text-center">
              <div
                className="relative inline-block touch-none cursor-crosshair select-none"
                ref={cropPreviewRef}
                onPointerDown={beginCrop}
                onPointerMove={updateCrop}
                onPointerUp={() => setCropStart(null)}
              >
                <img alt="Captured screen" className="block max-h-[68vh] max-w-full" draggable={false} src={capturePreview} />
                {cropSelection && (
                  <div
                    className="pointer-events-none absolute border-2 border-harcourts-blue bg-harcourts-blue/10"
                    style={{ left: `${cropSelection.x}%`, top: `${cropSelection.y}%`, width: `${cropSelection.width}%`, height: `${cropSelection.height}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid w-full gap-0 lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)]">
        <div className="grid gap-5 bg-slate-50 px-5 py-6 lg:min-h-[calc(100vh-73px)] lg:px-8">
          <SheetSection>
            <div>
              <table className="w-full table-fixed border-collapse text-left">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <th className="w-[22%] bg-harcourts-navy px-3 py-2 text-sm font-semibold text-white">ADDRESS</th>
                    <td className="px-2 py-1.5">
                      <TableInput value={input.propertyAddress} invalid={propertyAddressInvalid} onChange={(value) => updateInput({ propertyAddress: value })} />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-100 text-xs uppercase text-slate-600">
                    <th className="w-[30%] px-3 py-2">Items</th>
                    <th className="w-[32%] px-3 py-2">Percentage %</th>
                    <th className="w-[38%] px-3 py-2">Team</th>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1.5 text-sm font-semibold text-slate-800">Listing Agent</td>
                    <td className="px-2 py-1.5">
                      <DraftTableInput initialValue={rateToInput(input.listingPercentage)} inputMode="decimal" suffix="%" invalid={transactionSplitInvalid} onChange={(value) => updateInput({ listingPercentage: inputToRate(value) })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <TableInput value={listingHeaderTeam} onChange={setListingHeaderTeam} />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 text-sm font-semibold text-slate-800">Selling Agent</td>
                    <td className="px-2 py-1.5">
                      <DraftTableInput initialValue={rateToInput(input.sellingPercentage)} inputMode="decimal" suffix="%" invalid={transactionSplitInvalid} onChange={(value) => updateInput({ sellingPercentage: inputToRate(value) })} />
                    </td>
                    <td className="px-2 py-1.5">
                      <TableInput value={sellingHeaderTeam} onChange={setSellingHeaderTeam} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SheetSection>

          <SheetSection>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-harcourts-navy">Table 1 - Calculation of Commission</h2>
            </div>
            <div>
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-300 bg-harcourts-navy text-xs uppercase text-white">
                    <th className="w-[38%] px-3 py-2">Items</th>
                    <th className="w-[25%] px-3 py-2">Base Amount</th>
                    <th className="w-[17%] px-3 py-2">Percentage %</th>
                    <th className="w-[20%] px-3 py-2 text-right">Final Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1.5 text-sm font-medium text-slate-800">Sales Price</td>
                    <td className="px-2 py-1.5">
                      <DraftTableInput initialValue={centsToInput(input.salePriceCents)} inputMode="decimal" prefix="$" invalid={salePriceInvalid} onChange={(value) => updateInput({ salePriceCents: dollarsToCents(value) })} />
                    </td>
                    <td />
                    <td className="px-3 py-1.5 text-right text-sm font-semibold text-slate-900">{formatMoney(input.salePriceCents)}</td>
                  </tr>
                  {input.grossItems.map((item) => (
                    <PercentageTableRow
                      key={item.id}
                      label="Gross Commission"
                      item={item}
                      baseAmountCents={item.id === input.grossItems[1]?.id ? Math.max(input.salePriceCents - (input.grossItems[0]?.baseAmountCents ?? 0), 0) : item.baseAmountCents}
                      baseAmountReadOnly={item.id === input.grossItems[1]?.id}
                      result={Math.round(
                        (item.id === input.grossItems[1]?.id
                          ? Math.max(input.salePriceCents - (input.grossItems[0]?.baseAmountCents ?? 0), 0)
                          : item.baseAmountCents) * Number(item.percentage)
                      )}
                      onChange={(patch) => updateInput({ grossItems: replaceItem(input.grossItems, item.id, patch) })}
                    />
                  ))}
                  <TotalTableRow label="Total Gross Commission" value={result.grossCommissionCents} strong />
                  <ExcelSection title="Plus" />
                  {input.plusItems.map((item) => (
                    <MoneyTableRow
                      key={item.id}
                      item={item}
                      onChange={(patch) => updatePlusItem(item.id, patch)}
                    />
                  ))}
                  <TotalTableRow label="Subtotal" value={result.plusTotalCents} />
                  <ExcelSection title="Minus" />
                  {input.discounts.map((item) => (
                    <PercentageTableRow
                      key={item.id}
                      label="Commission Discount"
                      item={item}
                      baseAmountCents={item.baseAmountCents || result.grossCommissionCents}
                      baseAmountReadOnly={item.baseAmountCents === 0}
                      result={Math.round((item.baseAmountCents || result.grossCommissionCents) * Number(item.percentage))}
                      onChange={(patch) => updateInput({ discounts: replaceItem(input.discounts, item.id, patch) })}
                    />
                  ))}
                  {input.minusItems.map((item) => (
                    <MoneyTableRow
                      key={item.id}
                      item={item}
                      onChange={(patch) => updateInput({ minusItems: replaceItem(input.minusItems, item.id, patch) })}
                    />
                  ))}
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-2" colSpan={4}>
                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        onClick={() =>
                          updateInput({
                            discounts: [
                              ...input.discounts,
                              {
                                id: `discount-${input.discounts.length + 1}`,
                                description: "Commission Discount",
                                baseAmountCents: 0,
                                percentage: "0"
                              }
                            ]
                          })
                        }
                      >
                        <Plus className="h-4 w-4" /> Add Commission Discount
                      </button>
                    </td>
                  </tr>
                  <TotalTableRow label="Total Received Commission" value={result.totalReceivedCommissionCents} strong />
                  <ExcelSection title="Minus - To Office" />
                  {input.officeDeductions.map((item) => (
                    <MoneyTableRow
                      key={item.id}
                      item={item}
                      amountReadOnly
                      onChange={() => undefined}
                    />
                  ))}
                  <TotalTableRow label="To Office Subtotal" value={result.officeDeductionsTotalCents} />
                  <TotalTableRow label="Net Commission" value={result.netCommissionCents} strong />
                  <ExcelSection title="Minus - Referral Fee" />
                  {input.referrals.map((referral) => (
                    <tr className="border-b border-slate-200" key={referral.id}>
                      <td className="px-2 py-1.5">
                        <TableInput value={referral.recipient} onChange={(value) => updateInput({ referrals: replaceItem(input.referrals, referral.id, { recipient: value }) })} />
                      </td>
                      <td className="px-3 py-1.5 text-right text-sm text-slate-600">{formatMoney(referral.baseAmountCents ?? result.netCommissionCents)}</td>
                      <td className="px-2 py-1.5">
                        <TableInput value={rateToInput(referral.percentage)} inputMode="decimal" suffix="%" onChange={(value) => updateInput({ referrals: replaceItem(input.referrals, referral.id, { percentage: inputToRate(value) }) })} />
                      </td>
                      <td className="px-3 py-1.5 text-right text-sm font-semibold text-slate-900">
                        {formatMoney(Math.round((referral.baseAmountCents ?? result.netCommissionCents) * Number(referral.percentage)))}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-2" colSpan={4}>
                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        onClick={() =>
                          updateInput({
                            referrals: [...input.referrals, { id: `referral-${input.referrals.length + 1}`, recipient: "Referral Partner", percentage: "0" }]
                          })
                        }
                      >
                        <Plus className="h-4 w-4" /> Add Referral
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300 bg-slate-50">
                    <td className="px-3 py-2 text-sm font-semibold text-harcourts-navy">Commission to Conjunction Office</td>
                    <td className="px-3 py-2 text-right text-sm text-slate-600">{formatMoney(result.netCommissionCents - result.referralFeeTotalCents)}</td>
                    <td className="px-2 py-1.5">
                      <TableInput
                        value={rateToInput(input.conjunctionPercentage)}
                        inputMode="decimal"
                        suffix="%"
                        onChange={(value) => updateInput({ hasConjunctionOffice: true, conjunctionPercentage: inputToRate(value) })}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-harcourts-navy">{formatMoney(result.conjunctionGrossCommissionCents)}</td>
                  </tr>
                  <ExcelSection title="Minus - Conjunction Office" />
                  {input.conjunctionMinusItems.map((item) => (
                    <MoneyTableRow
                      key={item.id}
                      item={item}
                      onChange={(patch) => updateInput({ conjunctionMinusItems: replaceItem(input.conjunctionMinusItems, item.id, patch) })}
                    />
                  ))}
                  <TotalTableRow label="Net Commission to Conjunction Office" value={result.netConjunctionCommissionCents} strong />
                  <tr className="border-b border-slate-300 bg-sky-50">
                    <td className="px-3 py-2 text-sm font-semibold text-harcourts-navy">Commission Into Our Office</td>
                    <td className="px-3 py-2 text-right text-sm text-slate-600">{formatMoney(result.netCommissionCents - result.referralFeeTotalCents)}</td>
                    <td className="px-2 py-1.5">
                      <TableInput
                        value={rateToInput(input.ourOfficePercentage)}
                        inputMode="decimal"
                        suffix="%"
                        onChange={(value) => updateInput({ ourOfficePercentage: inputToRate(value) })}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-harcourts-navy">{formatMoney(result.commissionIntoOurOfficeCents)}</td>
                  </tr>
                  <ExcelSection title="Plus - Our Office" />
                  {ourOfficePlusItems.map((item) => (
                    <MoneyTableRow key={item.id} item={item} amountReadOnly onChange={() => undefined} />
                  ))}
                  <TotalTableRow label="Net Commission Into Our Office" value={result.netCommissionIntoOurOfficeCents} strong />
                  <ExcelSection title="Minus - Internal Office Fees" />
                  {internalOfficeFeeItems.map((item) => (
                    <MoneyTableRow key={item.id} item={item} amountReadOnly onChange={() => undefined} />
                  ))}
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1.5 text-sm font-medium text-slate-800">Franchise Fee</td>
                    <td className="px-3 py-1.5 text-right text-sm text-slate-600">{formatMoney(result.netCommissionIntoOurOfficeCents - result.internalOfficeFeesTotalCents)}</td>
                    <td className="px-2 py-1.5">
                      <DraftTableInput initialValue={rateToInput(input.franchiseFeeRate)} inputMode="decimal" suffix="%" onChange={(value) => updateInput({ franchiseFeeRate: inputToRate(value) })} />
                    </td>
                    <td className="px-3 py-1.5 text-right text-sm font-semibold text-slate-900">{formatMoney(result.franchiseFeeCents)}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1.5 text-sm font-medium text-slate-800">Referral Fee</td>
                    <td className="px-3 py-1.5 text-right text-sm text-slate-600">{formatMoney(result.netCommissionIntoOurOfficeCents - result.internalOfficeFeesTotalCents - result.franchiseFeeCents)}</td>
                    <td className="px-2 py-1.5">
                      <DraftTableInput initialValue={rateToInput(input.internalReferralFeeRate)} inputMode="decimal" suffix="%" onChange={(value) => updateInput({ internalReferralFeeRate: inputToRate(value) })} />
                    </td>
                    <td className="px-3 py-1.5 text-right text-sm font-semibold text-slate-900">{formatMoney(result.internalReferralFeeCents)}</td>
                  </tr>
                  <TotalTableRow label="Commission Available for Split" value={result.commissionAvailableForSplitCents} strong />
                </tbody>
              </table>
            </div>
          </SheetSection>

          <SheetSection>
            <div className="p-5">
              <h2 className="mb-4 text-lg font-semibold text-harcourts-navy">Commission Split Between Parties</h2>
              {(["LISTING", "SELLING"] as const).map((role) => {
                const roleParticipants = input.participants.filter((participant) => participant.role === role);
                const roleLabel = role === "LISTING" ? "Listing" : "Selling";
                const roleTeamInvalid = role === "LISTING" ? listingTeamInvalid : sellingTeamInvalid;

                return (
                  <div className="mb-6 last:mb-0" key={role}>
                    <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
                      <h3 className={`text-base font-semibold ${roleTeamInvalid ? "text-red-700" : "text-harcourts-navy"}`}>{roleLabel}</h3>
                      <button
                        className={`inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm font-semibold ${roleParticipants.length === 0 ? "border border-red-500 text-red-700" : "border border-slate-300 text-slate-700"}`}
                        onClick={() => addParticipant(role)}
                      >
                        <Plus className="h-4 w-4" /> Add {roleLabel} Agent
                      </button>
                    </div>
                    <table className="mb-3 w-full table-fixed border-collapse text-left">
                      <thead>
                        <tr className="bg-harcourts-navy text-xs uppercase text-white">
                          <th className="w-[40%] px-3 py-2">Items</th>
                          <th className="w-[25%] px-3 py-2">Base Amount</th>
                          <th className="w-[17%] px-3 py-2">Percentage %</th>
                          <th className="w-[18%] px-3 py-2 text-right">Final Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-300 bg-sky-50">
                          <td className="px-3 py-2 text-sm font-semibold text-harcourts-navy">{roleLabel} Commission</td>
                          <td className="px-3 py-2 text-right text-sm text-slate-700">{formatMoney(result.commissionAvailableForSplitCents)}</td>
                          <td className="px-2 py-1.5">
                            <TableInput
                              value={rateToInput(role === "LISTING" ? input.listingPercentage : input.sellingPercentage)}
                              inputMode="decimal"
                              suffix="%"
                              invalid={transactionSplitInvalid}
                              onChange={(value) => updateInput(role === "LISTING" ? { listingPercentage: inputToRate(value) } : { sellingPercentage: inputToRate(value) })}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-bold text-harcourts-navy">{formatMoney(role === "LISTING" ? result.listingCommissionPoolCents : result.sellingCommissionPoolCents)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <table className="w-full table-fixed border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-100 text-xs uppercase text-slate-600">
                          <th className="w-[40%] px-3 py-2">Party</th>
                          <th className="w-[18%] px-3 py-2">Team Share</th>
                          <th className="w-[17%] px-3 py-2">Split %</th>
                          <th className="w-[25%] px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roleParticipants.map((participant) => {
                          const payment = paymentByParticipantId.get(participant.id);
                          return (
                            <Fragment key={participant.id}>
                              <tr className="border-b border-slate-200" key={`${participant.id}-agent`}>
                                <td className="px-3 py-1.5">
                                  <div className="flex items-center gap-2">
                                    <select className="h-9 min-w-0 flex-1" value={participant.agent.agentId} onChange={(event) => updateParticipant(participant.id, { agent: snapshotAgent(event.target.value) })}>
                                      {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
                                    </select>
                                    <button className="grid h-9 w-9 shrink-0 place-items-center border border-slate-300 text-slate-600" title={`Remove ${participant.agent.agentName}`} onClick={() => removeParticipant(participant.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-2 py-1.5"><TableInput value={rateToInput(participant.teamSharePercentage)} inputMode="decimal" suffix="%" invalid={roleTeamInvalid} onChange={(value) => updateParticipant(participant.id, { teamSharePercentage: inputToRate(value) })} /></td>
                                <td className="px-3 py-1.5 text-sm text-slate-700">{formatPercent(participant.agent.agentSplit)}</td>
                                <td className="px-3 py-1.5 text-right text-sm font-semibold text-slate-900">{formatMoney(payment?.commissionBeforeTaxCents ?? 0)}</td>
                              </tr>
                              <tr className="border-b border-slate-300 bg-slate-50" key={`${participant.id}-office`}>
                                <td className="px-3 py-1.5 pl-8 text-sm font-medium text-slate-700">Office</td>
                                <td />
                                <td className="px-3 py-1.5 text-sm text-slate-700">{formatPercent(participant.agent.companySplit)}</td>
                                <td className="px-3 py-1.5 text-right text-sm font-semibold text-slate-900">{formatMoney(payment?.companyCommissionCents ?? 0)}</td>
                              </tr>
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </SheetSection>

          <SheetSection>
            <div className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-harcourts-navy">Evidence</h2>
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700" onClick={captureScreenshot}>
                    <MonitorUp className="h-4 w-4" /> Capture Screen
                  </button>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                    <Upload className="h-4 w-4" /> Upload Screenshots
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(event) => {
                        uploadEvidence(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
              {evidenceError && <p className="mb-3 text-sm text-red-700">{evidenceError}</p>}
              {input.evidence.length === 0 ? (
                <p className="text-sm text-slate-500">No screenshots attached.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {input.evidence.map((evidence) => (
                    <div className="relative border border-slate-200" key={evidence.id}>
                      <img alt={evidence.fileName} className="h-32 w-full object-contain bg-slate-50" src={evidence.fileUrl} />
                      <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-2 py-2">
                        <span className="min-w-0 truncate text-xs text-slate-600">{evidence.fileName}</span>
                        <button className="grid h-7 w-7 shrink-0 place-items-center text-slate-600" title={`Remove ${evidence.fileName}`} onClick={() => removeEvidence(evidence.id)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-slate-500">{input.evidence.length}/10 screenshots attached</p>
            </div>
          </SheetSection>

          <SheetSection>
            <div className="p-5">
            <h2 className="mb-4 text-lg font-semibold text-harcourts-navy">Agent Payment Breakdown</h2>
            <div>
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Agent</th>
                    <th>Role</th>
                    <th>Before Tax</th>
                    <th>GST</th>
                    <th>WHT</th>
                    <th>Net Payment</th>
                    <th>Company</th>
                  </tr>
                </thead>
                <tbody>
                  {result.agentPayments.map((payment) => (
                    <tr className="border-b border-slate-100" key={payment.participantId}>
                      <td className="py-3 font-semibold">{payment.agentName}</td>
                      <td>{payment.role}</td>
                      <td>{formatMoney(payment.commissionBeforeTaxCents)}</td>
                      <td>{formatMoney(payment.gstCents)}</td>
                      <td>{formatMoney(payment.withholdingTaxCents)}</td>
                      <td className="font-semibold">{formatMoney(payment.netPaymentCents)}</td>
                      <td>{formatMoney(payment.companyCommissionCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </SheetSection>

          <SheetSection>
            <div className="p-5">
            <h2 className="mb-4 text-lg font-semibold text-harcourts-navy">System Validation</h2>
            {result.validations.map((validation) => (
              <ValidationRow key={validation.key} label={validation.label} balanced={validation.balanced} difference={formatMoney(validation.differenceCents)} />
            ))}
            </div>
          </SheetSection>
        </div>

        <aside className="grid h-fit gap-5 bg-slate-200/80 px-5 py-6 lg:sticky lg:top-[73px] lg:px-7">
          <SheetSection>
            <div className="p-5">
              <h2 className="mb-4 text-lg font-semibold text-harcourts-navy">Live Summary</h2>
              <MoneyReadout label="Gross Commission" value={result.grossCommissionCents} />
              <MoneyReadout label="Total Received" value={result.totalReceivedCommissionCents} />
              <MoneyReadout label="Net Commission" value={result.netCommissionCents} />
              <MoneyReadout label="Franchise Fee" value={result.franchiseFeeCents} />
              <MoneyReadout label="Agent Distribution" value={result.totalAgentCommissionCents} />
              <MoneyReadout label="Company Distribution" value={result.totalCompanyCommissionCents} />
              <div className="mt-4 bg-slate-50 p-3">
                <MoneyReadout label="Final Difference" value={result.finalDifferenceCents} />
                <div className={`mt-2 flex items-center gap-2 text-sm font-semibold ${canApprove ? "text-emerald-700" : "text-red-700"}`}>
                  <ShieldCheck className="h-4 w-4" />
                  {canApprove ? "Calculation Balanced" : "Needs Review"}
                </div>
              </div>
              <button
                disabled={!canApprove}
                onClick={generatePdf}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-harcourts-navy px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Download className="h-4 w-4" /> Generate PDF
              </button>
            </div>
          </SheetSection>
          <SheetSection>
            <div className="p-5">
              <h2 className="mb-4 text-lg font-semibold text-harcourts-navy">Calculation Breakdown</h2>
              <BreakdownRow label="Gross Commission" formula="Sum of each commission base x rate" value={result.grossCommissionCents} />
              <BreakdownRow label="Total Received" formula="Gross Commission + Plus Items - Minus Items" value={result.totalReceivedCommissionCents} />
              <BreakdownRow label="Net Commission" formula="Total Received - Admin Fee - Marketing Fee - Refund Marketing Fee to Agent" value={result.netCommissionCents} />
              <BreakdownRow label="Referral Fee" formula="Net Commission x referral percentage" value={result.referralFeeTotalCents} />
              <BreakdownRow label="Commission Into Our Office" formula="(Net Commission - Referral Fee) x office percentage" value={result.commissionIntoOurOfficeCents} />
              <BreakdownRow label="Net Commission Into Our Office" formula="Commission Into Our Office + linked plus items" value={result.netCommissionIntoOurOfficeCents} />
              <BreakdownRow label="Franchise Fee" formula="(Net Commission Into Our Office - linked office fees) x franchise rate" value={result.franchiseFeeCents} />
              <BreakdownRow label="Internal Referral Fee" formula="(Franchise Fee base - Franchise Fee) x referral percentage" value={result.internalReferralFeeCents} />
              <BreakdownRow label="Available for Split" formula="Net Commission Into Our Office - linked office fees - Franchise Fee - Referral Fee" value={result.commissionAvailableForSplitCents} />
              <BreakdownRow label="Agent Distribution" formula="Listing/Selling pool x team share x fixed agent split" value={result.totalAgentCommissionCents} />
              <BreakdownRow label="Company Distribution" formula="Company side of each agent split" value={result.totalCompanyCommissionCents} />
            </div>
          </SheetSection>
        </aside>
      </div>
    </main>
  );
}
