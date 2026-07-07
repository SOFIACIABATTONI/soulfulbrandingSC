import type { Client } from "@prisma/client";
import { normalizeContractContent, type ContractContent } from "@/lib/contract-types";
import { getContractHtmlTemplate } from "@/lib/contract-html-templates";

export type ContractProjectInput = {
  title: string;
  service: string;
  value: number;
  contractContent?: unknown;
  client: Pick<Client, "name" | "company" | "email">;
};

export function buildDefaultContractContent(project: ContractProjectInput): ContractContent {
  return {
    body: getContractHtmlTemplate(project),
    format: "html",
  };
}

export function resolveContractContent(
  project: ContractProjectInput,
): ContractContent {
  const stored = normalizeContractContent(project.contractContent);
  if (stored.body.trim()) return stored;
  return buildDefaultContractContent(project);
}
