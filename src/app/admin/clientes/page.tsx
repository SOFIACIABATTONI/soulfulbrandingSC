import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/session";
import { ClientsManager } from "@/components/admin/ClientsManager";

export default async function AdminClientesPage() {
  const jar = await cookies();
  if (!(await verifyAdminToken(jar.get(ADMIN_COOKIE_NAME)?.value))) {
    redirect("/admin/login?next=/admin/clientes");
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-[9px] font-medium uppercase tracking-widest mb-1"
          style={{ color: "rgba(13,13,13,0.42)" }}>
          CRM
        </p>
        <h1 className="font-serif text-3xl italic" style={{ color: "#0D0D0D" }}>
          Clientes
        </h1>
      </div>
      <ClientsManager />
    </div>
  );
}
