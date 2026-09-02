import Link from "next/link";
import Image from "next/image";

export function GatewayLanding() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Link
        href="/oraculo"
        className="group relative flex min-h-[50vh] flex-1 flex-col items-center justify-between overflow-hidden bg-[#f2f2f2] px-6 py-8 transition hover:brightness-[0.98] md:min-h-screen"
        aria-label="Ir a Oráculo Raíz"
      >
        <p className="relative z-10 font-serif text-2xl text-black md:text-3xl">Oráculo Raíz</p>
        <div className="relative z-10 flex flex-1 items-center justify-center py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gateway/oraculo-raiz.gif"
            alt=""
            className="max-h-[min(52vh,420px)] w-auto max-w-full object-contain"
          />
        </div>
        <div className="relative z-10 pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/sc-so-logo.svg" alt="SO" className="mx-auto h-5 w-auto opacity-90" />
        </div>
      </Link>

      <Link
        href="/creative-studio"
        className="group relative flex min-h-[50vh] flex-1 flex-col items-center justify-center overflow-hidden transition hover:brightness-[1.02] md:min-h-screen"
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
