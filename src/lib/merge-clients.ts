import { prisma } from "@/lib/prisma";

export class MergeClientsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MergeClientsError";
  }
}

/**
 * Fusiona `sourceClientId` en `targetClientId` (proyectos, facturas, tokens, contratos).
 * El cliente fuente se elimina. El destino conserva su email principal.
 */
export async function mergeClients(
  targetClientId: string,
  sourceClientId: string,
): Promise<{ targetId: string; moved: { projects: number; invoices: number; tokens: number } }> {
  if (targetClientId === sourceClientId) {
    throw new MergeClientsError("Elegí un cliente distinto para fusionar.");
  }

  const [target, source] = await Promise.all([
    prisma.client.findUnique({ where: { id: targetClientId } }),
    prisma.client.findUnique({ where: { id: sourceClientId } }),
  ]);

  if (!target || !source) {
    throw new MergeClientsError("Cliente no encontrado.");
  }

  const moved = { projects: 0, invoices: 0, tokens: 0 };

  await prisma.$transaction(async (tx) => {
    const projects = await tx.clientProject.updateMany({
      where: { clientId: sourceClientId },
      data: { clientId: targetClientId },
    });
    moved.projects = projects.count;

    const invoices = await tx.invoice.updateMany({
      where: { clientId: sourceClientId },
      data: { clientId: targetClientId },
    });
    moved.invoices = invoices.count;

    const tokens = await tx.clientAccessToken.updateMany({
      where: { clientId: sourceClientId },
      data: { clientId: targetClientId },
    });
    moved.tokens = tokens.count;

    await tx.contractAcceptance.updateMany({
      where: { clientId: sourceClientId },
      data: { clientId: targetClientId },
    });

    const noteLines: string[] = [];
    const sourceEmail = source.email.trim();
    const targetEmail = target.email.trim();
    if (sourceEmail && sourceEmail.toLowerCase() !== targetEmail.toLowerCase()) {
      noteLines.push(`Email alternativo (fusionado): ${sourceEmail}`);
    }
    if (source.phone.trim() && !target.phone.trim()) {
      noteLines.push(`Teléfono (fusionado): ${source.phone.trim()}`);
    }
    if (source.company.trim() && !target.company.trim()) {
      noteLines.push(`Empresa (fusionada): ${source.company.trim()}`);
    }
    if (source.leadId && target.leadId && source.leadId !== target.leadId) {
      noteLines.push(`Lead del registro fusionado: ${source.leadId}`);
    }

    let leadId = target.leadId;
    if (!leadId && source.leadId) {
      leadId = source.leadId;
      await tx.client.update({ where: { id: sourceClientId }, data: { leadId: null } });
    } else if (source.leadId) {
      await tx.client.update({ where: { id: sourceClientId }, data: { leadId: null } });
    }

    const mergeBlock = noteLines.length
      ? `[Fusión ${new Date().toISOString().slice(0, 10)}] ${noteLines.join(" · ")}`
      : "";
    const notes = [target.notes.trim(), mergeBlock].filter(Boolean).join("\n\n");

    await tx.client.update({
      where: { id: targetClientId },
      data: {
        leadId,
        notes,
        phone: target.phone.trim() || source.phone.trim(),
        company: target.company.trim() || source.company.trim(),
      },
    });

    await tx.client.delete({ where: { id: sourceClientId } });
  });

  return { targetId: targetClientId, moved };
}
