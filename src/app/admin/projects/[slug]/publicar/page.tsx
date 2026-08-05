import { PortfolioCaseEditor } from "@/components/admin/PortfolioCaseEditor";
import { AdminPanelErrorBoundary } from "@/components/admin/AdminPanelErrorBoundary";

type Props = { params: Promise<{ slug: string }> };

export default async function AdminPortfolioCasePage({ params }: Props) {
  const { slug } = await params;
  return (
    <AdminPanelErrorBoundary label="Editor Brand's">
      <PortfolioCaseEditor slug={decodeURIComponent(slug)} />
    </AdminPanelErrorBoundary>
  );
}
