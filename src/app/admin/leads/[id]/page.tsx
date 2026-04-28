import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LeadDetail } from "@/components/admin/LeadDetail";

type Props = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: Props) {
  const jar = await cookies();
  if (!(await verifyAdminToken(jar.get(ADMIN_COOKIE_NAME)?.value))) {
    redirect("/admin/login?next=/admin/leads");
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/leads"
            className="text-[9px] font-medium uppercase tracking-widest hover:underline"
            style={{ color: "rgba(13,13,13,0.35)" }}>
            Leads
          </Link>
          <span className="text-[9px]" style={{ color: "rgba(13,13,13,0.25)" }}>›</span>
          <span className="text-[9px] font-medium uppercase tracking-widest"
            style={{ color: "rgba(13,13,13,0.42)" }}>
            Ficha
          </span>
        </div>
        <h1 className="font-serif text-3xl italic" style={{ color: "#0D0D0D" }}>
          {lead.name}
        </h1>
      </div>
      <LeadDetail lead={lead} />
    </div>
  );
}
