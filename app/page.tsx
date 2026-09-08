import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileText, History, Settings } from "lucide-react";
import { calculateCommission } from "@/lib/commission/calculate";
import { formatMoney } from "@/lib/commission/money";
import { sampleCommission } from "@/lib/commission/sample";
import { Card, StatusBadge } from "@/components/ui";

const result = calculateCommission(sampleCommission);

export default function DashboardPage() {
  const cards = [
    ["Draft", "1"],
    ["Awaiting Review", "0"],
    ["Approved This Month", "0"],
    ["Total Calculations This Month", "1"]
  ];

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-harcourts-blue">Harcourts Golden Links</p>
            <h1 className="text-2xl font-semibold text-harcourts-navy">Commission Calculator</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/history"><History className="mr-2 inline h-4 w-4" />History</Link>
            <Link className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" href="/settings"><Settings className="mr-2 inline h-4 w-4" />Settings</Link>
            <Link className="rounded-md bg-harcourts-blue px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600" href="/commission/new">New Commission</Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-4">
          {cards.map(([label, value]) => (
            <Card key={label}>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-harcourts-navy">{value}</p>
            </Card>
          ))}
        </div>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-harcourts-navy">Recent Calculations</h2>
            <ClipboardCheck className="h-5 w-5 text-harcourts-blue" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3">Calculation ID</th>
                  <th>Property</th>
                  <th>Sale Price</th>
                  <th>Prepared By</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Approved</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-4 font-semibold">{sampleCommission.id}</td>
                  <td>{sampleCommission.propertyAddress}</td>
                  <td>{formatMoney(sampleCommission.salePriceCents)}</td>
                  <td>{sampleCommission.preparedBy}</td>
                  <td><StatusBadge status={sampleCommission.status} /></td>
                  <td>2026-09-01</td>
                  <td>-</td>
                  <td>
                    <Link className="inline-flex items-center gap-1 font-semibold text-harcourts-blue" href="/commission/new">
                      Open <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="grid gap-3 md:grid-cols-3">
          <div><p className="text-sm text-slate-500">Total Received</p><p className="text-xl font-semibold">{formatMoney(result.totalReceivedCommissionCents)}</p></div>
          <div><p className="text-sm text-slate-500">Agent Distribution</p><p className="text-xl font-semibold">{formatMoney(result.totalAgentCommissionCents)}</p></div>
          <div><p className="text-sm text-slate-500">Final Difference</p><p className="text-xl font-semibold">{formatMoney(result.finalDifferenceCents)}</p></div>
        </Card>
      </div>
    </main>
  );
}
