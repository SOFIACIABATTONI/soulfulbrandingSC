import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { getContentSection, isContentSectionId } from "@/lib/admin-content-sections";

type PageProps = { params: Promise<{ section: string }> };

export default async function AdminContentSectionPage(ctx: PageProps) {
  const { section } = await ctx.params;
  if (!isContentSectionId(section)) notFound();
  const meta = getContentSection(section)!;

  return (
    <ContentEditor
      activeSection={section}
      sectionLabel={meta.label}
      sectionDescription={meta.description}
      sectionScope={meta.scope}
    />
  );
}
