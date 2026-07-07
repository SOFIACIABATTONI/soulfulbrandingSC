import { buildBrandKitHtmlSection, type BrandKit } from "@/lib/brand-kit";

const PHASE_DOC_STYLES = `
body {
  margin: 0;
  padding: 48px 32px;
  background: #f9f3db;
  font-family: Helvetica, Arial, sans-serif;
}
.doc-header {
  max-width: 720px;
  margin: 0 auto 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(19, 25, 69, 0.12);
}
.doc-header h1 {
  margin: 0 0 8px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.75rem;
  font-style: italic;
  font-weight: 400;
  color: #131945;
}
.doc-header p {
  margin: 0;
  font-size: 13px;
  color: rgba(19, 25, 69, 0.55);
}
.doc-body {
  max-width: 720px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid rgba(19, 25, 69, 0.1);
  border-radius: 12px;
  padding: 32px;
}
.phase-doc-html {
  font-size: 15px;
  line-height: 1.65;
  color: #131945;
}
.phase-doc-html > * + * { margin-top: 0.65em; }
.phase-doc-html h1 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.75rem;
  font-style: italic;
  font-weight: 400;
  margin: 0 0 0.75rem;
  color: #131945;
}
.phase-doc-html h2 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.35rem;
  font-style: italic;
  font-weight: 400;
  margin: 1.25rem 0 0.5rem;
  color: #131945;
}
.phase-doc-html h3 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.15rem;
  font-style: italic;
  font-weight: 400;
  margin: 1rem 0 0.4rem;
  color: #131945;
}
.phase-doc-html p {
  margin: 0.35rem 0;
  color: rgba(19, 25, 69, 0.78);
}
.phase-doc-html strong { color: #131945; font-weight: 600; }
.phase-doc-html em { font-style: italic; }
.phase-doc-html ul:not([data-type="taskList"]),
.phase-doc-html ol {
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}
.phase-doc-html ul:not([data-type="taskList"]) { list-style-type: disc; }
.phase-doc-html ol { list-style-type: decimal; }
.phase-doc-html li { margin: 0.25rem 0; }
.phase-doc-html li > p { margin: 0; }
.phase-doc-html table {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
  font-size: 14px;
}
.phase-doc-html th,
.phase-doc-html td {
  border: 1px solid rgba(19, 25, 69, 0.12);
  padding: 0.5rem 0.65rem;
  vertical-align: top;
}
.phase-doc-html th {
  background: rgba(19, 25, 69, 0.05);
  font-weight: 600;
  color: #131945;
}
.brand-kit { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(19, 25, 69, 0.12); }
.brand-kit h2 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.35rem;
  font-style: italic;
  font-weight: 400;
  margin: 0 0 1rem;
  color: #131945;
}
.brand-kit h3 {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.05rem;
  font-style: italic;
  font-weight: 400;
  margin: 1rem 0 0.5rem;
  color: #131945;
}
.brand-kit code { font-family: ui-monospace, monospace; font-size: 13px; }
.brand-kit a { color: #323FF6; }
@media print {
  body { background: #fff; padding: 0; }
  .doc-body { border: none; border-radius: 0; padding: 0; }
}
`;

function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "documento"
  );
}

export function phaseDocDownloadFilename(portalTitle: string, projectTitle: string): string {
  return `${slugify(portalTitle)}-${slugify(projectTitle)}-soulful-branding.html`;
}

export function buildPhaseDocDownloadHtml(opts: {
  portalTitle: string;
  projectTitle: string;
  clientName: string;
  htmlBody: string;
  brandKit?: BrandKit;
}): string {
  const title = `${opts.portalTitle} — ${opts.projectTitle}`;
  const subtitle = `${opts.clientName} · Soulful Branding®`;
  const brandKitHtml = opts.brandKit ? buildBrandKitHtmlSection(opts.brandKit) : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title.replace(/</g, "&lt;")}</title>
  <style>${PHASE_DOC_STYLES}</style>
</head>
<body>
  <header class="doc-header">
    <h1>${opts.portalTitle.replace(/</g, "&lt;")}</h1>
    <p>${subtitle.replace(/</g, "&lt;")}</p>
  </header>
  <main class="doc-body">
    ${brandKitHtml}
    ${opts.htmlBody.trim() ? `<div class="phase-doc-html">${opts.htmlBody}</div>` : ""}
  </main>
</body>
</html>`;
}
