import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ClientDetail } from "@/components/admin/ClientDetail";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminClienteDetailPage({ params }: PageProps) {
  const jar = await cookies();
  if (!(await verifyAdminToken(jar.get(ADMIN_COOKIE_NAME)?.value))) {
    redirect("/admin/login?next=/admin/clientes");
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, service: true, estimatedValue: true } },
      projects: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, service: true, status: true, value: true, startDate: true, deliveryDate: true },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        select: { id: true, number: true, type: true, total: true, status: true, issuedAt: true },
      },
      _count: { select: { projects: true, invoices: true } },
    },
  });

  if (!client) notFound();

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/clientes" className="text-[9px] font-medium uppercase tracking-widest hover:underline"
            style={{ color: "rgba(13,13,13,0.35)" }}>
            Clientes
          </Link>
          <span className="text-[9px]" style={{ color: "rgba(13,13,13,0.25)" }}>›</span>
          <span className="text-[9px] font-medium uppercase tracking-widest"
            style={{ color: "rgba(13,13,13,0.42)" }}>
            Ficha
          </span>
        </div>
        <h1 className="font-serif text-3xl italic" style={{ color: "#0D0D0D" }}>
          {client.name}
        </h1>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ClientDetail client={client as any} />
    </div>
  );
}
