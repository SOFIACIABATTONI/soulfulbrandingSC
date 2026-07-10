"use client";

import { useState } from "react";
import { brandUi } from "@/lib/brand-ui";
import {
  deliverableCardFiles,
  brandKitHasContent,
  cardDownloadableSquares,
  cardHasContent,
  cardPreviewBackground,
  cardColorCount,
  isBrandKitPresentationGroup,
  isImageAssetFile,
  isValidHex,
  normalizeHex,
  type BrandKit,
  type BrandKitCard,
  type BrandKitColor,
} from "@/lib/brand-kit";

export function BrandKitClientView({
  brandKit,
  zipDownloadUrl,
}: {
  brandKit: BrandKit;
  zipDownloadUrl?: string | null;
}) {
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  if (!brandKitHasContent(brandKit)) return null;

  const visibleCards = brandKit.cards.filter(cardHasContent);

  return (
    <div
      className="max-w-3xl mx-auto mb-6 print:hidden rounded-2xl border p-5 space-y-5"
      style={{ borderColor: brandUi.border, background: "rgba(50,63,246,0.04)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: brandUi.text }}>
            Brand ID
          </p>
          <p className="text-xs mt-1" style={{ color: brandUi.textMuted }}>
            Tu identidad completa: paleta de colores y archivos por sección. Descargá cada recurso por separado.
          </p>
        </div>
        {zipDownloadUrl && (
          <a
            href={zipDownloadUrl}
            download
            className="rounded-full px-4 py-2 text-xs font-medium text-white shrink-0"
            style={{ background: brandUi.blue }}
          >
            Descargar ZIP
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {visibleCards.map((card) => {
          const preview = cardPreviewBackground(card);
          const previewStyle =
            preview.type === "image"
              ? { background: `url("${preview.value}") center/cover no-repeat` }
              : preview.type === "palette" || preview.type === "color"
                ? { background: preview.value }
                : { background: "linear-gradient(135deg, rgba(50,63,246,0.12), rgba(240,49,114,0.12))" };
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setOpenCardId(openCardId === card.id ? null : card.id)}
              className="rounded-xl border overflow-hidden text-left"
              style={{ borderColor: openCardId === card.id ? brandUi.blue : brandUi.border }}
            >
              <div className="h-20" style={previewStyle} />
              <p className="px-2 py-2 text-[11px] font-medium leading-snug" style={{ color: brandUi.text }}>
                {card.title}
                {cardColorCount(card) > 0 && (
                  <span className="block text-[10px] font-normal" style={{ color: brandUi.textFaint }}>
                    {cardColorCount(card)} tonos
                  </span>
                )}
              </p>
            </button>
          );
        })}
      </div>

      {openCardId && (
        <CardClientDetail
          card={visibleCards.find((c) => c.id === openCardId)!}
          onClose={() => setOpenCardId(null)}
        />
      )}
    </div>
  );
}

function CardClientDetail({ card, onClose }: { card: BrandKitCard; onClose: () => void }) {
  const squares = card.key === "trama" ? cardDownloadableSquares(card) : [];
  const paletteColors = card.colors.filter((c) => c.name.trim() || isValidHex(c.hex));

  return (
    <div
      className="rounded-xl border p-4 space-y-4"
      style={{ borderColor: brandUi.border, background: brandUi.surface }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium" style={{ color: brandUi.text }}>
          {card.title}
        </p>
        <button type="button" className="text-xs" style={{ color: brandUi.textMuted }} onClick={onClose}>
          Cerrar
        </button>
      </div>

      {paletteColors.length > 0 && (
        <PaletteClientSection colors={paletteColors} emphasize={card.key === "paleta-colores" || card.key === "brand-sheet"} />
      )}

      {card.key === "trama" && squares.length > 0 && (
        <section className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
            Cuadraditos de trama — descarga individual
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {squares.map((file) => (
              <FileSquareDownload key={file.id} file={file} />
            ))}
          </div>
        </section>
      )}

      {card.sourceUrl.trim() && (
        <a
          href={card.sourceUrl.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline block"
          style={{ color: brandUi.blue }}
        >
          {card.key === "kit-canva" ? "Abrir kit en Canva →" : "Ver enlace online →"}
        </a>
      )}

      {card.fileGroups.map((group) => {
        if (isBrandKitPresentationGroup(group.label)) return null;
        const files = group.files.filter((f) => f.url.trim());
        if (files.length === 0) return null;
        if (card.key === "trama" && group.label === "Versión PNG" && squares.length > 0) return null;
        return (
          <section key={group.id} className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
              {group.label}
            </p>
            {(() => {
              const imageFiles = files.filter(isImageAssetFile);
              const otherFiles = files.filter((f) => !isImageAssetFile(f));
              return (
                <>
                  {imageFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imageFiles.map((file) => (
                        <FilePreviewDownload key={file.id} file={file} />
                      ))}
                    </div>
                  )}
                  {otherFiles.length > 0 && (
                    <ul className="space-y-2">
                      {otherFiles.map((file) => (
                        <li
                          key={file.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                          style={{ borderColor: brandUi.border }}
                        >
                          <span className="text-xs truncate" style={{ color: brandUi.text }}>
                            {file.fileName}
                          </span>
                          <a
                            href={file.url}
                            download={file.fileName || undefined}
                            className="rounded-full px-3 py-1 text-[10px] font-medium text-white shrink-0"
                            style={{ background: brandUi.accent }}
                          >
                            Descargar
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              );
            })()}
          </section>
        );
      })}

      {card.notes.trim() && (
        <p className="text-xs leading-relaxed" style={{ color: brandUi.textMuted }}>
          {card.notes.trim()}
        </p>
      )}

      {card.driveUrl.trim() && (
        <a
          href={card.driveUrl.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline block"
          style={{ color: brandUi.textMuted }}
        >
          Complemento en Drive →
        </a>
      )}

      {paletteColors.length === 0 &&
        deliverableCardFiles(card).length === 0 &&
        !card.driveUrl.trim() &&
        !card.sourceUrl.trim() &&
        !card.notes.trim() && (
          <p className="text-xs" style={{ color: brandUi.textFaint }}>
            Sin contenido en esta sección.
          </p>
        )}
    </div>
  );
}

function PaletteClientSection({
  colors,
  emphasize,
}: {
  colors: BrandKitColor[];
  emphasize?: boolean;
}) {
  return (
    <section
      className="rounded-xl border p-3 space-y-3"
      style={{
        borderColor: emphasize ? brandUi.blue : brandUi.border,
        background: emphasize ? "rgba(50,63,246,0.04)" : "transparent",
      }}
    >
      <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
        Paleta de colores
      </p>
      <div className="flex h-4 rounded-full overflow-hidden border" style={{ borderColor: brandUi.border }}>
        {colors
          .filter((c) => isValidHex(c.hex))
          .map((c) => (
            <div key={c.id} className="flex-1" style={{ background: normalizeHex(c.hex) }} aria-hidden />
          ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {colors.map((color) => {
          const hex = normalizeHex(color.hex);
          const swatch = isValidHex(hex) ? hex : "#ccc";
          return (
            <div
              key={color.id}
              className="rounded-xl border p-3 flex gap-3"
              style={{ borderColor: brandUi.border }}
            >
              <div
                className="h-14 w-14 rounded-lg shrink-0 border"
                style={{ background: swatch, borderColor: brandUi.borderStrong }}
              />
              <div className="min-w-0 text-[11px]" style={{ color: brandUi.textMuted }}>
                <p className="font-medium text-sm" style={{ color: brandUi.text }}>
                  {color.name || "Color"}
                </p>
                <p className="font-mono mt-1">{hex || "—"}</p>
                {color.rgb && <p>RGB · {color.rgb}</p>}
                {color.cmyk && <p>CMYK · {color.cmyk}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FilePreviewDownload({
  file,
}: {
  file: { id: string; url: string; fileName: string };
}) {
  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col"
      style={{ borderColor: brandUi.border, background: brandUi.surface }}
    >
      <div
        className="aspect-[4/3] flex items-center justify-center p-3"
        style={{
          backgroundColor: "#f7f7f7",
          backgroundImage:
            "linear-gradient(45deg, #ececec 25%, transparent 25%), linear-gradient(-45deg, #ececec 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ececec 75%), linear-gradient(-45deg, transparent 75%, #ececec 75%)",
          backgroundSize: "12px 12px",
          backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file.url}
          alt={file.fileName || "Recurso de marca"}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="p-2">
        <a
          href={file.url}
          download={file.fileName || undefined}
          className="block text-center rounded-full py-1.5 text-[10px] font-medium text-white"
          style={{ background: brandUi.accent }}
        >
          Descargar
        </a>
      </div>
    </div>
  );
}

function FileSquareDownload({
  file,
}: {
  file: { id: string; url: string; fileName: string };
}) {
  return <FilePreviewDownload file={file} />;
}
