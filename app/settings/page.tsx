import Link from "next/link";
import { Settings2, Users } from "lucide-react";
import { agents } from "@/lib/agents";
import { formatPercent } from "@/lib/commission/money";
import { Card, Field } from "@/components/ui";

export default function SettingsPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 px-6 py-6">
      <div>
        <Link className="text-sm font-semibold text-harcourts-blue" href="/">Commission Calculator</Link>
        <h1 className="text-2xl font-semibold text-harcourts-navy">Settings</h1>
      </div>
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-harcourts-blue" />
          <h2 className="text-lg font-semibold text-harcourts-navy">System Configuration</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Franchise Fee Rate"><input defaultValue="8%" /></Field>
          <Field label="Default GST"><input defaultValue="15%" /></Field>
          <Field label="Storage Bucket"><input defaultValue="commission-evidence" /></Field>
        </div>
      </Card>
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-harcourts-blue" />
          <h2 className="text-lg font-semibold text-harcourts-navy">Agents</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr><th className="py-3">Name</th><th>WHT</th><th>GST</th><th>Residential Agent</th><th>Residential Company</th><th>Commercial Agent</th><th>Commercial Company</th><th>Active</th></tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr className="border-b border-slate-100" key={agent.id}>
                  <td className="py-3 font-semibold">{agent.name}</td>
                  <td>{formatPercent(agent.withholdingTaxRate)}</td>
                  <td>{formatPercent(agent.gstRate)}</td>
                  <td>{formatPercent(agent.residentialAgentSplit)}</td>
                  <td>{formatPercent(agent.residentialCompanySplit)}</td>
                  <td>{formatPercent(agent.commercialLeaseAgentSplit)}</td>
                  <td>{formatPercent(agent.commercialLeaseCompanySplit)}</td>
                  <td>{agent.active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
