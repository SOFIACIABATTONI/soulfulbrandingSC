import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const jar = await cookies();
  if (!(await verifyAdminToken(jar.get(ADMIN_COOKIE_NAME)?.value))) {
    redirect("/admin/login");
  }

  const [leadsCount, clientsCount, projectsCount, invoicesPending] = await Promise.all([
    prisma.lead.count({ where: { status: "negociacion" } }),
    prisma.client.count(),
    prisma.clientProject.count({ where: { status: { not: "entregado" } } }),
    prisma.invoice.aggregate({ where: { status: "pendiente" }, _sum: { total: true } }),
  ]);

  const porCobrar = invoicesPending._sum.total ?? 0;

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-[9px] font-medium uppercase tracking-widest mb-1"
          style={{ color: "rgba(13,13,13,0.42)" }}>
          Panel
        </p>
        <h1 className="font-serif text-3xl italic" style={{ color: "#0D0D0D" }}>
          Dashboard
        </h1>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <MetricCard label="Leads activos" value={leadsCount} href="/admin/leads" />
        <MetricCard label="Clientes" value={clientsCount} href="/admin/clientes" />
        <MetricCard label="Proyectos en curso" value={projectsCount} href="/admin/proyectos" />
        <MetricCard
          label="Por cobrar"
          value={`$${porCobrar.toLocaleString("es-AR")}`}
          href="/admin/facturas"
          warn={porCobrar > 0}
        />
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NavCard
          href="/admin/leads"
          label="Leads & Mensajes"
          desc="Pipeline comercial y formularios recibidos del sitio."
        />
        <NavCard
          href="/admin/clientes"
          label="Clientes"
          desc="Base de datos de clientas activas e historial."
        />
        <NavCard
          href="/admin/proyectos"
          label="Proyectos"
          desc="Workspace de proyectos con fases y seguimiento."
        />
        <NavCard
          href="/admin/facturas"
          label="Facturas"
          desc="Registro de señas y facturas finales."
        />
        <NavCard
          href="/admin/projects"
          label="Portfolio"
          desc="Proyectos públicos del sitio."
        />
        <NavCard
          href="/admin/content"
          label="Contenido del sitio"
          desc="Hero, servicios y textos del sitio público."
        />
      </div>
    </div>
  );
}

function MetricCard({
  label, value, href, warn,
}: {
  label: string;
  value: string | number;
  href: string;
  warn?: boolean;
}) {
  return (
    <Link href={href}
      className="rounded border bg-white px-4 py-4 hover:shadow-sm transition-shadow"
      style={{ borderColor: "rgba(13,13,13,0.1)" }}>
      <p className="text-[9px] font-medium uppercase tracking-widest mb-2"
        style={{ color: "rgba(13,13,13,0.42)" }}>
        {label}
      </p>
      <p className="font-serif text-3xl" style={{ color: warn ? "#b45000" : "#0D0D0D" }}>
        {value}
      </p>
    </Link>
  );
}

function NavCard({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href}
      className="rounded border bg-white px-5 py-4 hover:shadow-sm transition-shadow"
      style={{ borderColor: "rgba(13,13,13,0.1)" }}>
      <p className="font-medium text-sm mb-1" style={{ color: "#0D0D0D" }}>{label}</p>
      <p className="text-xs" style={{ color: "rgba(13,13,13,0.42)" }}>{desc}</p>
    </Link>
  );
}
