import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ERPProjectWorkspace } from "@/components/admin/ERPProjectWorkspace";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminProyectoDetailPage({ params }: PageProps) {
  const jar = await cookies();
  if (!(await verifyAdminToken(jar.get(ADMIN_COOKIE_NAME)?.value))) {
    redirect("/admin/login?next=/admin/proyectos");
  }

  const { id } = await params;

  const project = await prisma.clientProject.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true } },
      invoices: {
        orderBy: { createdAt: "desc" },
        select: { id: true, number: true, type: true, total: true, status: true, issuedAt: true },
      },
      _count: { select: { invoices: true } },
    },
  });

  if (!project) notFound();

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/proyectos" className="text-[9px] font-medium uppercase tracking-widest hover:underline"
            style={{ color: "rgba(13,13,13,0.35)" }}>
            Proyectos
          </Link>
          <span className="text-[9px]" style={{ color: "rgba(13,13,13,0.25)" }}>›</span>
          <Link href={`/admin/clientes/${project.client.id}`}
            className="text-[9px] font-medium uppercase tracking-widest hover:underline"
            style={{ color: "rgba(13,13,13,0.35)" }}>
            {project.client.name}
          </Link>
        </div>
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ERPProjectWorkspace project={project as any} />
    </div>
  );
}
