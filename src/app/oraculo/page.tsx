import Link from "next/link";
import { getOraculoPublicPageData } from "@/lib/oraculo-content-store";
import { OraculoNotionReplica } from "@/components/oraculo/OraculoNotionReplica";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata = buildPageMetadata({
  title: "Oráculo Raíz | Soulful Branding®",
  description:
    "Oráculo Raíz: tu marca empieza donde empezás vos. Experiencia digital con 23 cartas imprimibles, instructivo y profundización simbólica.",
  path: "/oraculo",
});

export default async function OraculoPage() {
  const { blocks, videoUrl, media, payment } = await getOraculoPublicPageData();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[708px] items-center justify-between gap-4 font-sans text-sm text-brand-navy">
          <Link href="/" className="hover:opacity-70">
            ← Inicio
          </Link>
          <Link href="/creative-studio" className="hover:opacity-70">
            Creative Studio →
          </Link>
        </div>
      </header>
      <OraculoNotionReplica
        blocks={blocks}
        videoUrl={videoUrl}
        payment={payment}
        media={media}
      />
    </>
  );
}
