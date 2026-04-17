import { ProjectWorkspace } from "@/components/admin/ProjectWorkspace";

type Props = { params: Promise<{ slug: string }> };

export default async function AdminProjectWorkspacePage({ params }: Props) {
  const { slug } = await params;
  return <ProjectWorkspace slug={slug} />;
}
