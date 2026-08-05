import { redirect } from "next/navigation";
import { ProjectWorkspace } from "@/components/admin/ProjectWorkspace";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export default async function AdminProjectWorkspacePage({ params }: Props) {
  const { slug } = await params;

  const erpProject = await prisma.clientProject.findFirst({
    where: { portfolioSlug: slug },
    select: { id: true },
  });

  if (erpProject) {
    redirect(`/admin/proyectos/${erpProject.id}#fase-identidad`);
  }

  return <ProjectWorkspace slug={slug} />;
}
