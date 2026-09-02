import Link from "next/link";
import { getOraculoPageLayout } from "@/lib/oraculo-page-layout";
import { OraculoNotionReplica } from "@/components/oraculo/OraculoNotionReplica";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata = buildPageMetadata({
  title: "Oráculo Raíz | Soulful Branding®",
  description:
    "Oráculo Raíz: tu marca empieza donde empezás vos. Experiencia digital con 23 cartas imprimibles, instructivo y profundización simbólica.",
  path: "/oraculo",
});

export default function OraculoPage() {
  const videoUrl =
    process.env.NEXT_PUBLIC_ORACULO_PRESENTATION_VIDEO_URL?.trim() ||
    process.env.ORACULO_PRESENTATION_VIDEO_URL?.trim() ||
    "";

  const paymentLink = process.env.NEXT_PUBLIC_ORACULO_ES_PAYMENT_URL?.trim() || "";

  const blocks = getOraculoPageLayout(paymentLink);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[708px] items-center justify-between gap-4 text-sm text-[rgb(55,53,47)]">
          <Link href="/" className="hover:opacity-70">
            ← Inicio
          </Link>
          <Link href="/creative-studio" className="hover:opacity-70">
            Creative Studio →
          </Link>
        </div>
      </header>
      <OraculoNotionReplica blocks={blocks} videoUrl={videoUrl} />
    </>
  );
}
