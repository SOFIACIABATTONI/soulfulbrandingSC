import Link from "next/link";
import {
  ORACULO_EDITION_INCLUDES,
  ORACULO_MEDIA,
  ORACULO_PAYMENT,
  ORACULO_TAROT_NOTE,
} from "@/lib/oraculo-content";
import { OraculoOrderForm, OraculoPresentation } from "@/components/oraculo/OraculoPageClient";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata = buildPageMetadata({
  title: "Oráculo Raíz | Soulful Branding®",
  description:
    "Oráculo Raíz: tu marca empieza donde empezás vos. Experiencia digital con 23 cartas imprimibles, instructivo y profundización simbólica.",
  path: "/oraculo",
});

export default function OraculoPage() {
  return (
    <div className="min-h-screen bg-brand-page font-sans text-brand-navy">
      <header className="border-b border-brand-navy/10 bg-white/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="text-sm text-brand-navy/70 transition hover:text-brand-navy">
            ← Inicio
          </Link>
          <h1 className="font-serif text-xl font-medium md:text-2xl">Oráculo Raíz</h1>
          <Link
            href="/creative-studio"
            className="text-sm text-brand-navy/70 transition hover:text-brand-navy"
          >
            Creative Studio →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <section className="space-y-6 text-center">
          <p className="font-serif text-lg leading-relaxed italic md:text-xl">
            Tu marca empieza donde empezás vos.
            <br />
            Lo que construís, nace de lo que ya sos.
            <br />
            Y para eso, hay que volver al origen.
          </p>
          <p className="text-sm text-brand-navy/60">cuando todo se mueve — ella sostiene.</p>
          <p className="font-sans font-medium">
            Tu intervención es la activación.
            <br />
            Esto empieza ahora.
          </p>
        </section>

        <section className="mt-12">
          <OraculoPresentation
            videoUrl={
              process.env.NEXT_PUBLIC_ORACULO_PRESENTATION_VIDEO_URL?.trim() ||
              process.env.ORACULO_PRESENTATION_VIDEO_URL?.trim() ||
              ""
            }
          />
        </section>

        <section className="mt-14 space-y-4 text-center">
          <h2 className="font-serif text-2xl font-medium">Welcome, Enjoy.</h2>
          <p className="text-sm text-brand-navy/60">Soulful experience. 2026, Valencia. España.</p>
        </section>

        <section className="mt-14 space-y-4 font-sans leading-relaxed">
          <p>Oráculo Raíz se entrega en formato digital.</p>
          <p className="font-semibold">Fue creados para que lo materialices con tus propias manos.</p>
          <p className="font-serif text-lg italic">Creado para co-crear</p>
          <h3 className="font-serif text-xl font-medium">La edición incluye:</h3>
          <ul className="list-disc space-y-2 pl-5">
            {ORACULO_EDITION_INCLUDES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-sm text-brand-navy/75">{ORACULO_TAROT_NOTE}</p>
        </section>

        <section className="mt-14 grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-brand-navy/15 bg-white p-6">
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.2em]">{ORACULO_PAYMENT.ar.label}</h3>
            <p className="mt-2 font-serif text-2xl">{ORACULO_PAYMENT.ar.price}</p>
            <p className="mt-4 text-sm">
              {ORACULO_PAYMENT.ar.cvuLabel}: <br />
              <span className="font-mono text-xs">{ORACULO_PAYMENT.ar.cvu}</span>
            </p>
          </div>
          <div className="rounded-xl border border-brand-navy/15 bg-white p-6">
            <h3 className="font-sans text-xs font-bold uppercase tracking-[0.2em]">{ORACULO_PAYMENT.es.label}</h3>
            <p className="mt-2 font-serif text-2xl">{ORACULO_PAYMENT.es.price}</p>
            <p className="mt-4 text-sm">
              {ORACULO_PAYMENT.es.phone}
              <br />
              Transferencia
              {ORACULO_PAYMENT.es.paymentLink ? (
                <>
                  {" · "}
                  <a
                    href={ORACULO_PAYMENT.es.paymentLink}
                    className="text-brand-blue underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    link de pago
                  </a>
                </>
              ) : null}
            </p>
          </div>
        </section>

        <section className="mt-10 space-y-3 rounded-xl border border-brand-navy/15 bg-brand-cream p-5 text-sm">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em]">Importante (!!!)</p>
          <p>Una vez realizado el pago, completá el formulario a continuación.</p>
          <p>
            Recibirás el acceso en las <strong>próximas 24 horas</strong>, directamente en tu correo.
          </p>
          <p>Adjuntá el comprobante — ese es el único paso que nos separa de que esto sea tuyo.</p>
        </section>

        <section className="mt-10" id="comprar">
          <OraculoOrderForm />
        </section>

        <section className="mt-16 space-y-4 border-t border-brand-navy/10 pt-12 text-sm leading-relaxed text-brand-navy/85">
          <p>
            Tu marca empieza donde empezás vos. Lo que construís, nace de lo que ya sos. Y para eso, hay que volver
            al origen.
          </p>
          <p>Este oráculo es el primer paso.</p>
          <p>
            Si en algún momento sentís que es momento de ir más profundo —de trabajar tu identidad desde adentro hacia
            afuera, de construir desde la raíz lo que querés comunicar al mundo— sabes dónde encontrarme.
          </p>
          <p>
            <Link href="/creative-studio" className="font-semibold text-brand-blue underline">
              Método Soulful Branding
            </Link>
            {" · "}
            <a href="https://www.sofiaciabattoni.com/creative-studio" className="text-brand-blue underline">
              www.sofiaciabattoni.com
            </a>
            {" · "}
            <a
              href="https://www.instagram.com/soficiabattoni"
              className="text-brand-blue underline"
              rel="noopener noreferrer"
            >
              Instagram Sofia Ciabattoni
            </a>
          </p>
          <p>
            Mi nombre es Sofia Ciabattoni. Creadora de Soulful Branding y fundadora del primer creative studio
            argentino especializado en identidad, energía y estrategia.
          </p>
          <p>
            Hace +9 años acompaño a visionarios y artistas en procesos identitarios, revelando marcas y sistemas de
            comunicación.
          </p>
          <p>Este oráculo nació de mi propio viaje (y los dones al servicio).</p>
          <p className="font-serif text-lg italic">Echá raíz.</p>
          <p className="font-serif text-xl">
            GRACIAS,
            <br />
            GRACIAS,
            <br />
            GRACIAS.
          </p>
          <p className="font-sans text-xs font-bold uppercase tracking-[0.28em]">XOXO, SO.</p>
        </section>

        <footer className="mt-12 flex justify-center pb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ORACULO_MEDIA.footerImage} alt="Soulful Branding" className="max-w-[200px]" />
        </footer>
      </main>
    </div>
  );
}
