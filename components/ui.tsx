import { CheckCircle2, XCircle } from "lucide-react";
import { clsx } from "clsx";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx("rounded-lg border border-slate-200 bg-white p-5 shadow-soft", className)}>{children}</section>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className="rounded-full bg-harcourts-blue/10 px-3 py-1 text-xs font-semibold text-harcourts-navy">{status}</span>;
}

export function ValidationRow({ label, balanced, difference }: { label: string; balanced: boolean; difference: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <div className="flex items-center gap-2 text-sm">
        {balanced ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
        <span>{label}</span>
      </div>
      <span className={clsx("text-sm font-semibold", balanced ? "text-emerald-700" : "text-red-700")}>
        {balanced ? "Balanced" : difference}
      </span>
    </div>
  );
}
