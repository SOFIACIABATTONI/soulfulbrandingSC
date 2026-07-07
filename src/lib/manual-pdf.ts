export type ManualPdfMeta = {
  url: string;
  fileName: string;
  mime: string;
};

export function getManualPdfFromPhase(phaseData: Record<string, string> | undefined): ManualPdfMeta | null {
  const d = phaseData ?? {};
  const url = (d.manualPdfUrl ?? "").trim();
  if (!url) return null;
  return {
    url,
    fileName: (d.manualPdfFileName ?? "manual-de-marca.pdf").trim() || "manual-de-marca.pdf",
    mime: (d.manualPdfMime ?? "application/pdf").trim() || "application/pdf",
  };
}

export function hasManualPdf(phaseData: Record<string, string> | undefined): boolean {
  return Boolean(getManualPdfFromPhase(phaseData)?.url);
}
