import Link from "next/link";
import type { Project } from "@prisma/client";
import type { DbGalleryItem } from "@/lib/portfolio-gallery-db";
import type { Testimonial } from "@/lib/testimonials";
import { CaseStudyTestimonialDisclosure } from "@/components/site/CaseStudyTestimonialDisclosure";
import { cn } from "@/lib/cn";

type Props = {
  project: Pick<Project, "title" | "slug">;
  gallery: DbGalleryItem[];
  testimonial?: Testimonial | null;
};

export function PortfolioPublishedCase({ project, gallery, testimonial }: Props) {
  return (
    <article className="mx-auto max-w-6xl px-4 pb-20 pt-6">
      <Link href="/portfolio" className="text-sm font-medium text-brand-blue hover:underline">
        ← Volver a Brand&apos;s
      </Link>

      <header className="mt-8">
        <h1 className="font-serif text-3xl font-medium text-brand-navy md:text-4xl lg:text-5xl">{project.title}</h1>
      </header>

      {testimonial ? <CaseStudyTestimonialDisclosure testimonial={testimonial} className="mt-4" /> : null}

      {gallery.length > 0 ? (
        <div className={cn("mt-8")}>
          <h2 className="sr-only">Trabajo</h2>
          <ul className="flex flex-col gap-0">
            {gallery.map((g) => (
              <li key={g.id} className="overflow-hidden">
                {g.kind === "video" ? (
                  <video
                    src={g.url}
                    controls
                    muted
                    playsInline
                    className="block h-auto w-full object-contain"
                    preload="metadata"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.url} alt="" className="block h-auto w-full" loading="lazy" />
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
