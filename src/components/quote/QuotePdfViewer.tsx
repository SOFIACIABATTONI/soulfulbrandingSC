"use client";

type Props = {
  pdfUrl: string;
  title: string;
  variant?: "portal" | "preview";
};

/** Visor PDF embebido para propuestas comerciales. */
export function QuotePdfViewer({ pdfUrl, title, variant = "portal" }: Props) {
  const height = variant === "preview" ? "min(75vh, 720px)" : "min(85vh, 900px)";

  return (
    <div className="w-full">
      <div
        className="overflow-hidden rounded-lg border bg-neutral-100"
        style={{ borderColor: "rgba(19,25,69,0.12)", height }}
      >
        <iframe
          src={pdfUrl}
          title={title}
          className="h-full w-full border-0"
        />
      </div>
      <p className="mt-3 text-center">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-brand-blue hover:underline"
        >
          Abrir PDF en pestaña nueva →
        </a>
      </p>
    </div>
  );
}
