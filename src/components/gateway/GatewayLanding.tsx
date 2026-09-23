import Link from "next/link";
import Image from "next/image";

const oraculoPreviewInDev = process.env.NODE_ENV === "development";

export function GatewayLanding() {
  const oraculoPanelClass = `relative flex min-h-[50vh] flex-1 overflow-hidden md:min-h-screen ${
    oraculoPreviewInDev ? "transition hover:brightness-[1.02]" : "cursor-default"
  }`;

  const oraculoImage = (
    <Image
      src="/gateway/oraculo-raiz.gif"
      alt="Oráculo Raíz — Soulful Branding"
      fill
      unoptimized
      className="object-cover object-center"
      sizes="(max-width: 768px) 100vw, 50vw"
      priority
    />
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {oraculoPreviewInDev ? (
        <Link href="/oraculo" className={oraculoPanelClass} aria-label="Ir a Oráculo Raíz (preview local)">
          {oraculoImage}
        </Link>
      ) : (
        <div className={oraculoPanelClass} aria-label="Oráculo Raíz — próximamente">
          {oraculoImage}
        </div>
      )}

      <Link
        href="/creative-studio"
        className="group relative flex min-h-[50vh] flex-1 overflow-hidden transition hover:brightness-[1.02] md:min-h-screen"
        aria-label="Ir a Creative Studio"
      >
        <Image
          src="/gateway/creative-studio.png"
          alt="Creative Studio — Soulful Branding"
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </Link>
    </div>
  );
}
