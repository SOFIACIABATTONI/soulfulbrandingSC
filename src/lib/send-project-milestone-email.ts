import { sendAdminNotificationEmail } from "@/lib/send-admin-notification";

type ProjectClientPayload = {
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  projectId: string;
};

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

export async function notifyAdminContractSigned(
  payload: ProjectClientPayload & {
    typedName: string;
    acceptedAt: Date;
    contentHash: string;
  },
): Promise<boolean> {
  const name = firstName(payload.clientName);
  const acceptedLabel = payload.acceptedAt.toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  return sendAdminNotificationEmail({
    logTag: "milestone-contract",
    subject: `${name} firmó el contrato — Soulful Branding®`,
    headline: `${name} firmó el contrato`,
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    projectTitle: payload.projectTitle,
    projectId: payload.projectId,
    adminHash: "#fase-contrato",
    extraLines: [
      `Nombre declarado: ${payload.typedName}`,
      `Aceptado: ${acceptedLabel}`,
      `Huella SHA-256: ${payload.contentHash}`,
    ],
  });
}

export async function notifyAdminPrebriefSubmitted(
  payload: ProjectClientPayload,
): Promise<boolean> {
  const name = firstName(payload.clientName);
  return sendAdminNotificationEmail({
    logTag: "milestone-prebrief",
    subject: `${name} completó Brand Soul — Soulful Branding®`,
    headline: `${name} completó el formulario Brand Soul`,
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    projectTitle: payload.projectTitle,
    projectId: payload.projectId,
    adminHash: "#fase-prebrief",
  });
}

export async function notifyAdminNarrativaReceived(
  payload: ProjectClientPayload,
): Promise<boolean> {
  const name = firstName(payload.clientName);
  return sendAdminNotificationEmail({
    logTag: "milestone-narrativa",
    subject: `${name} confirmó la narrativa — Soulful Branding®`,
    headline: `${name} confirmó la narrativa de marca`,
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    projectTitle: payload.projectTitle,
    projectId: payload.projectId,
    adminHash: "#fase-narrativa",
  });
}

export async function notifyAdminDeepDiveScheduled(
  payload: ProjectClientPayload,
): Promise<boolean> {
  const name = firstName(payload.clientName);
  return sendAdminNotificationEmail({
    logTag: "milestone-deep-dive",
    subject: `${name} agendó la llamada Deep Dive — Soulful Branding®`,
    headline: `${name} agendó su llamada de profundización`,
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    projectTitle: payload.projectTitle,
    projectId: payload.projectId,
    adminHash: "#fase-narrativa",
  });
}

export async function notifyAdminPhaseReceived(payload: {
  phaseLabel: string;
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  projectId: string;
  adminHash: string;
}): Promise<boolean> {
  const name = firstName(payload.clientName);
  return sendAdminNotificationEmail({
    logTag: "milestone-phase",
    subject: `${name} confirmó ${payload.phaseLabel} — Soulful Branding®`,
    headline: `${name} confirmó la recepción de ${payload.phaseLabel}`,
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    projectTitle: payload.projectTitle,
    projectId: payload.projectId,
    adminHash: payload.adminHash,
  });
}

const QUOTE_RESPONSE_LABELS: Record<string, string> = {
  aprobado: "aprobó",
  rechazado: "rechazó",
  consultar: "consultó cambios en",
};

export async function notifyAdminQuoteResponse(payload: {
  leadName: string;
  leadEmail: string;
  response: string;
  comment: string;
  leadId: string;
}): Promise<boolean> {
  const name = firstName(payload.leadName);
  const verb = QUOTE_RESPONSE_LABELS[payload.response] ?? "respondió";
  const headline =
    payload.response === "consultar"
      ? `${name} consultó cambios en el presupuesto`
      : `${name} ${verb} el presupuesto`;

  return sendAdminNotificationEmail({
    logTag: "milestone-quote",
    subject: `${headline} — Soulful Branding®`,
    headline,
    clientName: payload.leadName,
    clientEmail: payload.leadEmail,
    adminPath: `/admin/leads/${payload.leadId}`,
    extraLines: payload.comment ? [`Comentario: ${payload.comment}`] : [],
    extraHtml: payload.comment
      ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:rgba(19,25,69,0.65);"><strong style="color:#131945;">Comentario:</strong> ${payload.comment.replace(/</g, "&lt;")}</p>`
      : undefined,
  });
}
