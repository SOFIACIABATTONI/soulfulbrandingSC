import { ContentAdminNav } from "@/components/admin/ContentAdminNav";

export default function AdminContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <ContentAdminNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
