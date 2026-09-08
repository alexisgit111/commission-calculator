import Link from "next/link";
import { Download, Eye, Search } from "lucide-react";
import { formatMoney } from "@/lib/commission/money";
import { sampleCommission } from "@/lib/commission/sample";
import { Card, Field, StatusBadge } from "@/components/ui";

export default function HistoryPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <Link className="text-sm font-semibold text-harcourts-blue" href="/">Commission Calculator</Link>
          <h1 className="text-2xl font-semibold text-harcourts-navy">Commission History</h1>
        </div>
      </div>
      <Card>
        <div className="grid gap-4 md:grid-cols-5">
          <Field label="Property Address"><input placeholder="Search address" /></Field>
          <Field label="Calculation ID"><input placeholder="CC-2026" /></Field>
          <Field label="Agent"><input placeholder="Agent name" /></Field>
          <Field label="Date"><input type="date" /></Field>
          <Field label="Status"><select defaultValue=""><option value="">All statuses</option><option>APPROVED</option><option>DRAFT</option><option>SUBMITTED</option></select></Field>
        </div>
      </Card>
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-harcourts-blue" />
          <h2 className="text-lg font-semibold text-harcourts-navy">Results</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr><th className="py-3">Calculation ID</th><th>Property</th><th>Sale Price</th><th>Status</th><th>Agent</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4 font-semibold">{sampleCommission.id}</td>
                <td>{sampleCommission.propertyAddress}</td>
                <td>{formatMoney(sampleCommission.salePriceCents)}</td>
                <td><StatusBadge status={sampleCommission.status} /></td>
                <td>Miro Wang, Alana Sun</td>
                <td className="flex gap-2 py-3">
                  <Link className="rounded-md border border-slate-300 p-2 text-slate-700" title="View" href="/commission/new"><Eye className="h-4 w-4" /></Link>
                  <button className="rounded-md border border-slate-300 p-2 text-slate-700" title="Download PDF"><Download className="h-4 w-4" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
