import type { AgentSettingsSnapshot } from "./commission/types";
import agentSplitData from "./data/agent-splits.json";

type AgentSeed = {
  id: string;
  name: string;
  active: boolean;
  withholdingTaxRate: string;
  gstRate: string;
  residentialAgentSplit: string;
  residentialCompanySplit: string;
  commercialLeaseAgentSplit: string;
  commercialLeaseCompanySplit: string;
};

function normalizeRate(value: string | number | null): string {
  if (value === null) return "0";
  if (typeof value === "string" && value.includes("%")) {
    return (Number(value.replace("%", "")) / 100).toString();
  }
  return String(value);
}

export const agents: AgentSeed[] = agentSplitData.map((agent) => ({
  ...agent,
  withholdingTaxRate: normalizeRate(agent.withholdingTaxRate),
  gstRate: normalizeRate(agent.gstRate),
  residentialAgentSplit: normalizeRate(agent.residentialAgentSplit),
  residentialCompanySplit: normalizeRate(agent.residentialCompanySplit),
  commercialLeaseAgentSplit: normalizeRate(agent.commercialLeaseAgentSplit),
  commercialLeaseCompanySplit: normalizeRate(agent.commercialLeaseCompanySplit)
}));

export function snapshotAgent(agentId: string): AgentSettingsSnapshot {
  const agent = agents.find((item) => item.id === agentId) ?? agents[0];
  return {
    agentId: agent.id,
    agentName: agent.name,
    withholdingTaxRate: agent.withholdingTaxRate,
    gstRate: agent.gstRate,
    agentSplit: agent.residentialAgentSplit,
    companySplit: agent.residentialCompanySplit
  };
}
