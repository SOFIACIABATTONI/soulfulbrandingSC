import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureClientForLead } from "@/lib/client-provision";
import { LeadDetail } from "@/components/admin/LeadDetail";

type Props = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: Props) {
  const jar = await cookies();
  if (!(await verifyAdminToken(jar.get(ADMIN_COOKIE_NAME)?.value))) {
    redirect("/admin/login?next=/admin/leads");
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      quotes: {
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, sentAt: true, respondedAt: true, createdAt: true },
      },
      client: {
        include: {
          projects: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
              status: true,
              contractStatus: true,
              phases: true,
              contractAcceptedAt: true,
              createdAt: true,
            },
          },
          invoices: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              number: true,
              type: true,
              total: true,
              status: true,
              paidAt: true,
              issuedAt: true,
              projectId: true,
              project: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });
  if (!lead) notFound();

  let linkedClientRecord = lead.client;
  const hasApprovedQuote = lead.quotes.some((q) => q.status === "aprobado");
  if (!linkedClientRecord && (hasApprovedQuote || lead.status === "ganado")) {
    const ensuredId = await ensureClientForLead(id);
    if (ensuredId) {
      linkedClientRecord = await prisma.client.findUnique({
        where: { id: ensuredId },
        include: {
          projects: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
              status: true,
              contractStatus: true,
              phases: true,
              contractAcceptedAt: true,
              createdAt: true,
            },
          },
          invoices: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              number: true,
              type: true,
              total: true,
              status: true,
              paidAt: true,
              issuedAt: true,
              projectId: true,
              project: { select: { id: true, title: true } },
            },
          },
        },
      });
    }
  }

  const pipelineContext = {
    quotes: lead.quotes,
    projects: linkedClientRecord?.projects ?? [],
    invoices: linkedClientRecord?.invoices ?? [],
  };

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/leads"
            className="text-[9px] font-medium uppercase tracking-widest hover:underline"
            style={{ color: "rgba(19,25,69,0.35)" }}>
            Leads
          </Link>
          <span className="text-[9px]" style={{ color: "rgba(19,25,69,0.25)" }}>›</span>
          <span className="text-[9px] font-medium uppercase tracking-widest"
            style={{ color: "rgba(19,25,69,0.42)" }}>
            Ficha
          </span>
        </div>
        <h1 className="font-serif text-3xl italic" style={{ color: "#131945" }}>
          {lead.name}
        </h1>
      </div>
      <LeadDetail
        lead={lead}
        pipelineContext={pipelineContext}
        linkedClient={
          linkedClientRecord
            ? {
                id: linkedClientRecord.id,
                projects: linkedClientRecord.projects.map((p) => ({
                  ...p,
                  phases: (p.phases ?? {}) as Record<string, { state?: string }>,
                })),
                invoices: linkedClientRecord.invoices,
              }
            : null
        }
      />
    </div>
  );
}
