import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { LeadsPageContent } from "@/components/admin/LeadsPageContent";

export default async function AdminLeadsPage() {
  const jar = await cookies();
  if (!(await verifyAdminToken(jar.get(ADMIN_COOKIE_NAME)?.value))) {
    redirect("/admin/login?next=/admin/leads");
  }

  const newMsgCount = await prisma.contactMessage.count({
    where: { status: "nuevo" },
  });

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="text-[9px] font-medium uppercase tracking-widest mb-1"
          style={{ color: "rgba(19,25,69,0.42)" }}>
          CRM
        </p>
        <h1 className="font-serif text-3xl italic" style={{ color: "#131945" }}>
          Leads
        </h1>
      </div>
      <LeadsPageContent newMsgCount={newMsgCount} />
    </div>
  );
}
