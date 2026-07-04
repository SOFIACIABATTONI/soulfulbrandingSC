import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/session";
import { InvoicesManager } from "@/components/admin/InvoicesManager";

export default async function AdminFacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; projectId?: string }>;
}) {
  const jar = await cookies();
  if (!(await verifyAdminToken(jar.get(ADMIN_COOKIE_NAME)?.value))) {
    redirect("/admin/login?next=/admin/facturas");
  }

  const sp = await searchParams;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-[9px] font-medium uppercase tracking-widest mb-1"
          style={{ color: "rgba(19,25,69,0.42)" }}>
          ERP
        </p>
        <h1 className="font-serif text-3xl italic" style={{ color: "#131945" }}>
          Facturas
        </h1>
      </div>
      <InvoicesManager
        initialClientId={sp.clientId}
        initialProjectId={sp.projectId}
      />
    </div>
  );
}
