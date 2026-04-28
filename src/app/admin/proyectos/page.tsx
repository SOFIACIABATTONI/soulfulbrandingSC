import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const SERVICE_LABELS: Record<string, string> = {
  "identidad-de-marca": "Identidad de marca",
  "estrategia-visual": "Estrategia visual",
  "diseno-editorial": "Diseño editorial",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  onboarding: { bg: "rgba(50,63,246,0.08)", color: "#323FF6" },
  diseno: { bg: "rgba(240,49,114,0.1)", color: "#F03172" },
  implementacion: { bg: "rgba(255,160,0,0.12)", color: "#b45000" },
  entregado: { bg: "#e3f2e3", color: "#1a6b1a" },
};

const STATUS_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  diseno: "Diseño",
  implementacion: "Implementación",
  entregado: "Entregado",
};

export default async function AdminProyectosPage() {
  const jar = await cookies();
  if (!(await verifyAdminToken(jar.get(ADMIN_COOKIE_NAME)?.value))) {
    redirect("/admin/login?next=/admin/proyectos");
  }

  const projects = await prisma.clientProject.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count: { select: { invoices: true } },
    },
  });

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-[9px] font-medium uppercase tracking-widest mb-1"
          style={{ color: "rgba(13,13,13,0.42)" }}>
          ERP
        </p>
        <h1 className="font-serif text-3xl italic" style={{ color: "#0D0D0D" }}>
          Proyectos
        </h1>
      </div>

      <div className="overflow-x-auto rounded border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-[11px] font-medium uppercase tracking-widest"
            style={{ background: "#F9F3DB", color: "rgba(13,13,13,0.42)" }}>
            <tr>
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Facturas</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const sc = STATUS_COLORS[p.status] ?? STATUS_COLORS.onboarding;
              return (
                <tr key={p.id} className="border-b border-neutral-100 hover:bg-[#F9F3DB]/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#0D0D0D]">{p.title}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/clientes/${p.client.id}`} className="hover:underline"
                      style={{ color: "#0D0D0D" }}>
                      {p.client.name}
                    </Link>
                    {p.client.company && (
                      <div className="text-xs text-neutral-400">{p.client.company}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {SERVICE_LABELS[p.service] ?? p.service}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ${p.value.toLocaleString("es-AR")} USD
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                      style={{ background: sc.bg, color: sc.color }}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-neutral-500">
                    {p._count.invoices}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/proyectos/${p.id}`}
                      className="text-xs font-medium hover:underline" style={{ color: "#F03172" }}>
                      Ver →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {projects.length === 0 && (
          <p className="py-10 text-center text-sm text-neutral-400">
            Todavía no hay proyectos. Creá el primero desde la ficha de un cliente.
          </p>
        )}
      </div>
    </div>
  );
}
