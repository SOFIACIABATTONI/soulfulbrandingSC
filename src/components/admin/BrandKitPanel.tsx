"use client";

import { useEffect, useRef, useState } from "react";
import { brandUi, clientFrame } from "@/lib/brand-ui";
import { uploadBrandAssetFile } from "@/lib/admin-client-upload";
import { BrandKitCardCoverField } from "@/components/admin/BrandKitCardCoverField";
import { isLocalAdminUploadHost, isLocalDevUploadUrl } from "@/lib/admin-blob-upload";
import {
  cardHasContent,
  cardPreviewBackground,
  cardPreviewImage,
  cardColorCount,
  createBrandKitId,
  createCustomBrandKitCard,
  getBrandKitCardDef,
  hexToRgb,
  hexToCmyk,
  isCustomBrandKitCardKey,
  isImageAssetFile,
  isValidHex,
  normalizeHex,
  parseBrandKit,
  parseBrandKitColorsFromText,
  serializeBrandKit,
  setCardCoverFiles,
  type BrandKit,
  type BrandKitAssetFile,
  type BrandKitCard,
  type BrandKitColor,
  type BrandKitFileGroup,
} from "@/lib/brand-kit";

type BrandKitPanelProps = {
  phaseLabel: string;
  brandKitJson: string;
  saving?: boolean;
  onSave: (brandKitJson: string) => Promise<boolean> | boolean;
  onUploadActivityChange?: (active: boolean) => void;
};

export function BrandKitPanel({
  phaseLabel,
  brandKitJson,
  saving = false,
  onSave,
  onUploadActivityChange,
}: BrandKitPanelProps) {
  const [kit, setKit] = useState<BrandKit>(() => parseBrandKit(brandKitJson));
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [coverPreviewByCard, setCoverPreviewByCard] = useState<Record<string, string>>({});
  const [coverFieldUploading, setCoverFieldUploading] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistedRef = useRef(serializeBrandKit(parseBrandKit(brandKitJson)));
  const kitRef = useRef(kit);
  /** Tras guardar OK, ignorar props del padre hasta que reflejen lo persistido (evita pantalla en blanco). */
  const awaitingPropSyncRef = useRef(false);

  useEffect(() => {
    kitRef.current = kit;
  }, [kit]);

  useEffect(() => {
    if (uploadingKey || coverFieldUploading) return;

    const incomingSerialized = serializeBrandKit(parseBrandKit(brandKitJson));
    const localSerialized = serializeBrandKit(kitRef.current);

    if (awaitingPropSyncRef.current) {
      if (incomingSerialized === lastPersistedRef.current || incomingSerialized === localSerialized) {
        awaitingPropSyncRef.current = false;
      } else {
        return;
      }
    }

    if (incomingSerialized === localSerialized) {
      lastPersistedRef.current = incomingSerialized;
      return;
    }

    const next = parseBrandKit(brandKitJson);
    setKit(next);
    lastPersistedRef.current = incomingSerialized;
  }, [brandKitJson, uploadingKey, coverFieldUploading]);

  useEffect(() => {
    if (!awaitingPropSyncRef.current) return;
    const timer = window.setTimeout(() => {
      awaitingPropSyncRef.current = false;
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [brandKitJson]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  useEffect(() => {
    onUploadActivityChange?.(Boolean(uploadingKey) || coverFieldUploading);
  }, [uploadingKey, coverFieldUploading, onUploadActivityChange]);

  const activeCard = activeCardId ? kit.cards.find((c) => c.id === activeCardId) ?? null : null;

  async function persist(nextKit: BrandKit, opts?: { silent?: boolean }) {
    const serialized = serializeBrandKit(nextKit);
    if (serialized === lastPersistedRef.current) return true;
    setManualSaving(true);
    try {
      const ok = await onSave(serialized);
      if (ok) {
        lastPersistedRef.current = serialized;
        awaitingPropSyncRef.current = true;
        if (!opts?.silent) setMessage("Brand ID guardado.");
      } else if (!opts?.silent) {
        setMessage("No se pudo guardar.");
      }
      return ok;
    } finally {
      setManualSaving(false);
    }
  }

  function updateKit(updater: (prev: BrandKit) => BrandKit) {
    setKit((prev) => {
      const next = updater(prev);
      setMessage(null);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void persist(next, { silent: true }), 900);
      return next;
    });
  }

  function updateCardById(cardId: string, updater: (card: BrandKitCard) => BrandKitCard) {
    updateKit((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === cardId ? updater(c) : c)),
    }));
  }

  async function uploadToGroup(cardId: string, groupId: string, fileList: FileList | null) {
    if (!fileList?.length) return;
    const card = kit.cards.find((c) => c.id === cardId);
    if (!card) return;
    setUploadingKey(`${cardId}-${groupId}`);
    setMessage(null);
    try {
      const uploaded: BrandKitAssetFile[] = [];
      for (const file of Array.from(fileList)) {
        const u = await uploadBrandAssetFile(file);
        uploaded.push({
          id: createBrandKitId(),
          url: u.url,
          fileName: u.fileName,
          mime: u.mime,
        });
      }
      updateCardById(cardId, (c) => ({
        ...c,
        fileGroups: c.fileGroups.map((g) =>
          g.id === groupId ? { ...g, files: [...g.files, ...uploaded] } : g,
        ),
      }));
      setMessage(`${uploaded.length} archivo(s) subido(s).`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Error al subir.";
      setMessage(errorMessage);
      window.alert(errorMessage);
    } finally {
      setUploadingKey(null);
    }
  }

  async function saveCoverForCard(cardId: string, nextCard: BrandKitCard): Promise<boolean> {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const nextKit: BrandKit = {
      ...kitRef.current,
      cards: kitRef.current.cards.map((c) => (c.id === cardId ? nextCard : c)),
    };
    kitRef.current = nextKit;
    setKit(nextKit);
    const serialized = serializeBrandKit(nextKit);
    const ok = await onSave(serialized);
    if (ok) {
      lastPersistedRef.current = serialized;
      awaitingPropSyncRef.current = true;
      setMessage("Portada actualizada.");
    }
    return ok;
  }

  function addCustomCard() {
    const title = newCardTitle.trim() || "Nueva sección";
    const card = createCustomBrandKitCard(title);
    updateKit((prev) => ({ ...prev, cards: [...prev.cards, card] }));
    setNewCardTitle("");
    setActiveCardId(card.id);
    setMessage(`Card "${title}" creada.`);
  }

  function removeCustomCard(cardId: string) {
    const card = kit.cards.find((c) => c.id === cardId);
    if (!card || !isCustomBrandKitCardKey(card.key)) return;
    if (!window.confirm(`¿Eliminar la sección "${card.title}"?`)) return;
    updateKit((prev) => ({ ...prev, cards: prev.cards.filter((c) => c.id !== cardId) }));
    if (activeCardId === cardId) setActiveCardId(null);
    setMessage("Sección eliminada.");
  }

  return (
    <div
      className="rounded-2xl border-2 p-4 space-y-4"
      style={{ borderColor: clientFrame.border, background: clientFrame.background }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: clientFrame.border }}>
          Documento para el cliente — Brand ID · {phaseLabel}
        </p>
        <p className="text-xs mt-1" style={{ color: brandUi.textMuted }}>
          Cambiá la portada de cada card, subí archivos por sección y agregá cards propias del proyecto.
          Tocá una card para editarla; volvé a tocarla para cerrarla.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {kit.cards.map((card) => {
          const preview = cardPreviewBackground(card);
          const filled = cardHasContent(card);
          const localCover = coverPreviewByCard[card.id];
          const previewStyle = localCover
            ? { background: `url("${localCover}") center/cover no-repeat` }
            : preview.type === "image"
              ? { background: `url("${preview.value}") center/cover no-repeat` }
              : preview.type === "palette" || preview.type === "color"
                ? { background: preview.value }
                : { background: "linear-gradient(135deg, rgba(50,63,246,0.08), rgba(240,49,114,0.08))" };
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveCardId((prev) => (prev === card.id ? null : card.id))}
              className="rounded-xl border overflow-hidden text-left transition"
              style={{
                borderColor: activeCardId === card.id ? brandUi.blue : brandUi.border,
                boxShadow: activeCardId === card.id ? `0 0 0 1px ${brandUi.blue}` : undefined,
              }}
              aria-expanded={activeCardId === card.id}
            >
              <div className="h-20 flex items-center justify-center" style={previewStyle}>
                {preview.type === "empty" && (
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
                    {filled ? "Con contenido" : "Vacío"}
                  </span>
                )}
              </div>
              <p className="px-2 py-2 text-[11px] font-medium truncate" style={{ color: brandUi.text }}>
                {card.title}
                {isCustomBrandKitCardKey(card.key) && (
                  <span className="font-normal" style={{ color: brandUi.blue }}>
                    {" "}
                    · custom
                  </span>
                )}
                {cardColorCount(card) > 0 && (
                  <span className="font-normal" style={{ color: brandUi.textFaint }}>
                    {" "}
                    · {cardColorCount(card)} colores
                  </span>
                )}
              </p>
            </button>
          );
        })}
      </div>

      <div
        className="rounded-xl border p-3 flex flex-wrap items-end gap-2"
        style={{ borderColor: brandUi.border, borderStyle: "dashed" }}
      >
        <label className="flex-1 min-w-[180px]">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
            Nueva card del proyecto
          </span>
          <input
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            style={{ borderColor: brandUi.borderStrong }}
            placeholder="Ej. Stickers, Papelería, Redes sociales…"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCustomCard();
            }}
          />
        </label>
        <button
          type="button"
          className="rounded-full px-4 py-2 text-xs font-medium text-white shrink-0"
          style={{ background: brandUi.blue }}
          onClick={addCustomCard}
        >
          + Agregar card
        </button>
      </div>

      {activeCard && (
        <CardEditor
          card={activeCard}
          uploadingKey={uploadingKey}
          onUpdate={(next) => updateCardById(activeCard.id, () => next)}
          onUpload={(groupId, files) => void uploadToGroup(activeCard.id, groupId, files)}
          onSaveCover={(nextCard) => saveCoverForCard(activeCard.id, nextCard)}
          onCoverPreviewChange={(previewUrl) => {
            setCoverPreviewByCard((prev) => {
              if (!previewUrl) {
                if (!prev[activeCard.id]) return prev;
                const next = { ...prev };
                delete next[activeCard.id];
                return next;
              }
              return { ...prev, [activeCard.id]: previewUrl };
            });
          }}
          onCoverUploadActivityChange={setCoverFieldUploading}
          onRemove={() => removeCustomCard(activeCard.id)}
          onClose={() => setActiveCardId(null)}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving || manualSaving || Boolean(uploadingKey)}
          onClick={() => void persist(kit)}
          className="rounded-full px-4 py-2 text-xs font-medium border disabled:opacity-50"
          style={{ borderColor: brandUi.borderStrong, color: brandUi.text }}
        >
          {saving || manualSaving ? "Guardando…" : "Guardar Brand ID"}
        </button>
        {message && (
          <p className="text-xs" style={{ color: brandUi.textMuted }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

function CardEditor({
  card,
  uploadingKey,
  onUpdate,
  onUpload,
  onSaveCover,
  onCoverPreviewChange,
  onCoverUploadActivityChange,
  onRemove,
  onClose,
}: {
  card: BrandKitCard;
  uploadingKey: string | null;
  onUpdate: (next: BrandKitCard) => void;
  onUpload: (groupId: string, files: FileList | null) => void;
  onSaveCover: (next: BrandKitCard) => Promise<boolean>;
  onCoverPreviewChange?: (previewUrl: string | null) => void;
  onCoverUploadActivityChange?: (active: boolean) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const def = getBrandKitCardDef(card.key);
  const isCustom = isCustomBrandKitCardKey(card.key);

  return (
    <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: brandUi.border }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {isCustom ? (
            <input
              className="w-full rounded border px-2 py-1.5 text-sm font-medium"
              style={{ borderColor: brandUi.borderStrong, color: brandUi.text }}
              value={card.title}
              onChange={(e) => onUpdate({ ...card, title: e.target.value })}
              placeholder="Nombre de la sección"
            />
          ) : (
            <p className="text-sm font-medium" style={{ color: brandUi.text }}>
              {card.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isCustom && (
            <button
              type="button"
              className="text-xs"
              style={{ color: brandUi.accent }}
              onClick={onRemove}
            >
              Eliminar
            </button>
          )}
          <button
            type="button"
            className="text-xs"
            style={{ color: brandUi.textMuted }}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>

      <BrandKitCardCoverField
        card={card}
        onPreviewChange={onCoverPreviewChange}
        onSaveCover={onSaveCover}
        onUploadActivityChange={onCoverUploadActivityChange}
      />

      {def.kind === "palette" && (
        <PaletteEditor card={card} onUpdate={onUpdate} emphasize />
      )}

      {def.kind === "link" && (
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
            Link Canva (opcional)
          </span>
          <input
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            style={{ borderColor: brandUi.borderStrong }}
            placeholder="https://canva.com/…"
            value={card.sourceUrl}
            onChange={(e) => onUpdate({ ...card, sourceUrl: e.target.value })}
          />
        </label>
      )}

      {def.kind === "fonts" && (
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
            Link fuente online (opcional)
          </span>
          <input
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            style={{ borderColor: brandUi.borderStrong }}
            placeholder="Google Fonts, Adobe Fonts…"
            value={card.sourceUrl}
            onChange={(e) => onUpdate({ ...card, sourceUrl: e.target.value })}
          />
        </label>
      )}

      {isCustom && (
        <label className="block">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
            Link online (opcional)
          </span>
          <input
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            style={{ borderColor: brandUi.borderStrong }}
            placeholder="https://…"
            value={card.sourceUrl}
            onChange={(e) => onUpdate({ ...card, sourceUrl: e.target.value })}
          />
        </label>
      )}

      {card.fileGroups
        .filter((group) => group.label !== "Presentación")
        .map((group) => (
          <FileGroupEditor
            key={group.id}
            group={group}
            card={card}
            uploading={uploadingKey === `${card.id}-${group.id}`}
            gridPreview={card.key === "trama" && group.label === "Versión PNG"}
            canRemoveGroup={isCustom && group.label !== "Archivos"}
            onUpdate={(next) =>
              onUpdate({
                ...card,
                fileGroups: card.fileGroups.map((g) => (g.id === group.id ? next : g)),
              })
            }
            onUpload={(files) => onUpload(group.id, files)}
            onRemoveGroup={() =>
              onUpdate({
                ...card,
                fileGroups: card.fileGroups.filter((g) => g.id !== group.id),
              })
            }
          />
        ))}

      {isCustom && (
        <button
          type="button"
          className="text-[11px]"
          style={{ color: brandUi.blue }}
          onClick={() =>
            onUpdate({
              ...card,
              fileGroups: [
                ...card.fileGroups,
                { id: createBrandKitId(), label: "Archivos extra", files: [] },
              ],
            })
          }
        >
          + Grupo de archivos
        </button>
      )}

      <label className="block">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
          Notas para el cliente (opcional)
        </span>
        <textarea
          className="mt-1 w-full min-h-[72px] rounded border px-2 py-1.5 text-sm"
          style={{ borderColor: brandUi.borderStrong }}
          placeholder="Indicaciones de uso, contexto, etc."
          value={card.notes}
          onChange={(e) => onUpdate({ ...card, notes: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: brandUi.textFaint }}>
          Link Drive (opcional — complemento)
        </span>
        <input
          className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
          style={{ borderColor: brandUi.borderStrong }}
          placeholder="https://drive.google.com/…"
          value={card.driveUrl}
          onChange={(e) => onUpdate({ ...card, driveUrl: e.target.value })}
        />
      </label>
    </div>
  );
}

function PaletteEditor({
  card,
  onUpdate,
  emphasize,
}: {
  card: BrandKitCard;
  onUpdate: (next: BrandKitCard) => void;
  emphasize?: boolean;
}) {
  const [pasteText, setPasteText] = useState("");
  const [previewColors, setPreviewColors] = useState<BrandKitColor[] | null>(null);
  const [skippedLines, setSkippedLines] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  function runPreview(text: string) {
    const { colors, skippedLines: skipped } = parseBrandKitColorsFromText(text);
    if (colors.length === 0) {
      setPreviewColors(null);
      setSkippedLines(skipped);
      setImportSuccess(null);
      setImportError(
        skipped.length > 0
          ? `No encontramos colores válidos (${skipped.length} línea(s) ignorada(s)). Formato: #E1ADFF — lila claro`
          : "No encontramos colores válidos. Usá una línea por color: #E1ADFF — lila claro",
      );
      return;
    }

    setImportError(null);
    setSkippedLines(skipped);
    setPreviewColors(colors);

  }

  function applyImport(mode: "replace" | "append") {
    if (!previewColors?.length) return;
    onUpdate({
      ...card,
      colors: mode === "replace" ? previewColors : [...card.colors, ...previewColors],
    });
    setPasteText("");
    setPreviewColors(null);
    setSkippedLines([]);
    setImportError(null);
    setImportSuccess(
      `${previewColors.length} color${previewColors.length === 1 ? "" : "es"} cargado${previewColors.length === 1 ? "" : "s"}.`,
    );
  }

  return (
    <div
      className="rounded-lg border p-3 space-y-3"
      style={{
        borderColor: emphasize ? brandUi.blue : brandUi.border,
        background: emphasize ? "rgba(50,63,246,0.04)" : "transparent",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium" style={{ color: brandUi.text }}>
            Paleta de colores
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: brandUi.textMuted }}>
            Nombre y color de cada tono. Si no hay imagen en Presentación, estos colores son la portada de la
            card en el grid.
          </p>
        </div>
        <button
          type="button"
          className="text-[11px] shrink-0"
          style={{ color: brandUi.blue }}
          onClick={() =>
            onUpdate({
              ...card,
              colors: [
                ...card.colors,
                { id: createBrandKitId(), name: "", hex: "#131945", rgb: "19, 25, 69", cmyk: "" },
              ],
            })
          }
        >
          + Tono
        </button>
      </div>

      {emphasize && (
        <div
          className="rounded-lg border p-3 space-y-2"
          style={{ borderColor: brandUi.border, background: "rgba(255,255,255,0.6)" }}
        >
          <p className="text-[11px] font-medium" style={{ color: brandUi.text }}>
            Importar colores (pegá el texto acá)
          </p>
          <p className="text-[10px]" style={{ color: brandUi.textMuted }}>
            Una línea por color. Ejemplo: <code className="font-mono">#E1ADFF — lila claro</code>
          </p>
          <textarea
            className="w-full min-h-[88px] rounded border px-2 py-1.5 text-xs font-mono"
            style={{ borderColor: brandUi.borderStrong }}
            placeholder={"#3A1E66 — púrpura oscuro\n#E1ADFF — lila claro"}
            value={pasteText}
            onChange={(e) => {
              setPasteText(e.target.value);
              setPreviewColors(null);
              setSkippedLines([]);
              setImportError(null);
              setImportSuccess(null);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full px-3 py-1 text-[11px] font-medium border"
              style={{ borderColor: brandUi.borderStrong, color: brandUi.text }}
              onClick={() => runPreview(pasteText)}
            >
              Vista previa
            </button>
          </div>

          {importError && (
            <p className="text-[10px]" style={{ color: brandUi.accent }}>
              {importError}
            </p>
          )}

          {importSuccess && (
            <p className="text-[10px]" style={{ color: "#1a6b1a" }}>
              {importSuccess}
            </p>
          )}

          {previewColors && previewColors.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[10px]" style={{ color: brandUi.textMuted }}>
                {previewColors.length} color{previewColors.length === 1 ? "" : "es"} detectado
                {previewColors.length === 1 ? "" : "s"}
                {skippedLines.length > 0 ? ` · ${skippedLines.length} línea(s) ignorada(s)` : ""}
              </p>
              <div className="flex h-4 rounded-full overflow-hidden border" style={{ borderColor: brandUi.border }}>
                {previewColors.map((c) => (
                  <div key={c.id} className="flex-1" style={{ background: normalizeHex(c.hex) }} aria-hidden />
                ))}
              </div>
              <ul className="space-y-0.5 max-h-32 overflow-y-auto">
                {previewColors.map((c) => (
                  <li key={c.id} className="text-[10px] font-mono" style={{ color: brandUi.textMuted }}>
                    {normalizeHex(c.hex)} — {c.name}
                    {c.rgb ? ` · RGB ${c.rgb}` : ""}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full px-3 py-1 text-[11px] font-medium text-white"
                  style={{ background: brandUi.blue }}
                  onClick={() => applyImport("replace")}
                >
                  Reemplazar paleta
                </button>
                <button
                  type="button"
                  className="rounded-full px-3 py-1 text-[11px] font-medium border"
                  style={{ borderColor: brandUi.borderStrong, color: brandUi.text }}
                  onClick={() => applyImport("append")}
                >
                  Agregar al final
                </button>
                <button
                  type="button"
                  className="text-[11px]"
                  style={{ color: brandUi.textFaint }}
                  onClick={() => {
                    setPreviewColors(null);
                    setSkippedLines([]);
                    setImportError(null);
                    setImportSuccess(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {card.colors.length > 0 && (
        <div className="flex h-3 rounded-full overflow-hidden border" style={{ borderColor: brandUi.border }}>
          {card.colors
            .filter((c) => isValidHex(c.hex))
            .map((c) => (
              <div key={c.id} className="flex-1" style={{ background: normalizeHex(c.hex) }} aria-hidden />
            ))}
        </div>
      )}

      {card.colors.length === 0 ? (
        <p className="text-[11px]" style={{ color: brandUi.textFaint }}>
          Sin tonos cargados todavía.
        </p>
      ) : (
        card.colors.map((color) => (
          <ColorSpecRow
            key={color.id}
            color={color}
            onChange={(next) =>
              onUpdate({
                ...card,
                colors: card.colors.map((c) => (c.id === color.id ? next : c)),
              })
            }
            onRemove={() => onUpdate({ ...card, colors: card.colors.filter((c) => c.id !== color.id) })}
          />
        ))
      )}
    </div>
  );
}

function FileGroupEditor({
  group,
  card,
  uploading,
  gridPreview,
  canRemoveGroup,
  onUpdate,
  onUpload,
  onRemoveGroup,
}: {
  group: BrandKitFileGroup;
  card: BrandKitCard;
  uploading: boolean;
  gridPreview?: boolean;
  canRemoveGroup?: boolean;
  onUpdate: (next: BrandKitFileGroup) => void;
  onUpload: (files: FileList | null) => void;
  onRemoveGroup?: () => void;
}) {
  const fileAccept =
    card.key === "tipografias"
      ? ".ttf,.otf,.woff,.woff2,.eot,.ttc,font/*"
      : undefined;
  const hasStaleLocalUrls =
    typeof window !== "undefined" &&
    !isLocalAdminUploadHost(window.location.hostname) &&
    group.files.some((file) => isLocalDevUploadUrl(file.url));

  return (
    <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: brandUi.border }}>
      <div className="flex items-center justify-between gap-2">
        {canRemoveGroup ? (
          <input
            className="flex-1 rounded border px-2 py-1 text-xs font-medium"
            style={{ borderColor: brandUi.borderStrong, color: brandUi.text }}
            value={group.label}
            onChange={(e) => onUpdate({ ...group, label: e.target.value })}
          />
        ) : (
          <p className="text-xs font-medium" style={{ color: brandUi.text }}>
            {group.label}
          </p>
        )}
        {canRemoveGroup && onRemoveGroup && (
          <button type="button" className="text-[11px] shrink-0" style={{ color: brandUi.accent }} onClick={onRemoveGroup}>
            Quitar grupo
          </button>
        )}
      </div>

      {hasStaleLocalUrls && (
        <p className="text-[10px] rounded-lg border px-2 py-1.5" style={{ borderColor: brandUi.accent, color: brandUi.accent }}>
          Hay archivos subidos en local que no existen en Vercel. Volvé a subirlos acá para verlos en preview.
        </p>
      )}

      {gridPreview && group.files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {group.files
            .filter((f) => f.url.trim() && isImageAssetFile(f))
            .map((file) => (
              <div key={file.id} className="relative aspect-[4/3] rounded-lg overflow-hidden border" style={{ borderColor: brandUi.border }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.url} alt={file.fileName} className="h-full w-full object-cover" />
              </div>
            ))}
        </div>
      )}

      <ul className="space-y-1">
        {group.files.map((file) => (
          <li key={file.id} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate" style={{ color: brandUi.textMuted }}>
              {file.fileName || "archivo"}
            </span>
            <button
              type="button"
              style={{ color: brandUi.accent }}
              onClick={() =>
                onUpdate({ ...group, files: group.files.filter((f) => f.id !== file.id) })
              }
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <input
          type="file"
          multiple
          accept={fileAccept}
          className="text-xs"
          disabled={uploading}
          onChange={(e) => {
            onUpload(e.target.files);
            e.target.value = "";
          }}
        />
        {uploading && <span className="text-[11px]" style={{ color: brandUi.textFaint }}>Subiendo…</span>}
        {card.key === "tipografias" && (
          <span className="text-[10px]" style={{ color: brandUi.textFaint }}>
            .ttf, .otf, .woff, .woff2
          </span>
        )}
        {card.key === "trama" && (
          <span className="text-[10px]" style={{ color: brandUi.textFaint }}>
            Podés subir varios cuadraditos a la vez
          </span>
        )}
      </div>
    </div>
  );
}

function ColorSpecRow({
  color,
  onChange,
  onRemove,
}: {
  color: BrandKitColor;
  onChange: (next: BrandKitColor) => void;
  onRemove: () => void;
}) {
  const hex = normalizeHex(color.hex);
  const swatch = isValidHex(hex) ? hex : "#ccc";

  return (
    <div
      className="rounded-xl border p-3 flex flex-wrap gap-3 items-start"
      style={{ borderColor: brandUi.border }}
    >
      <label className="relative shrink-0 cursor-pointer" title="Elegir color">
        <div
          className="h-14 w-14 rounded-lg border shadow-sm"
          style={{ background: swatch, borderColor: brandUi.borderStrong }}
          aria-hidden
        />
        <input
          type="color"
          value={isValidHex(hex) ? hex : "#131945"}
          onChange={(e) => {
            const nextHex = e.target.value;
            onChange({
              ...color,
              hex: nextHex,
              rgb: hexToRgb(nextHex) || color.rgb,
              cmyk: hexToCmyk(nextHex) || color.cmyk,
            });
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Selector de color"
        />
      </label>
      <div className="min-w-0 flex-1 grid gap-2 sm:grid-cols-2">
        <input
          className="rounded border px-2 py-1 text-sm sm:col-span-2"
          style={{ borderColor: brandUi.borderStrong }}
          placeholder="Nombre (ej. Soft Lilac)"
          value={color.name}
          onChange={(e) => onChange({ ...color, name: e.target.value })}
        />
        <input
          className="rounded border px-2 py-1 text-sm font-mono"
          style={{ borderColor: brandUi.borderStrong }}
          placeholder="#E1ADFF"
          value={color.hex}
          onChange={(e) => {
            const nextHex = e.target.value;
            onChange({
              ...color,
              hex: nextHex,
              rgb: hexToRgb(nextHex) || color.rgb,
              cmyk: hexToCmyk(nextHex) || color.cmyk,
            });
          }}
        />
        <input
          className="rounded border px-2 py-1 text-sm"
          style={{ borderColor: brandUi.borderStrong }}
          placeholder="RGB · 225, 173, 255"
          value={color.rgb}
          onChange={(e) => onChange({ ...color, rgb: e.target.value })}
        />
        <input
          className="rounded border px-2 py-1 text-sm sm:col-span-2"
          style={{ borderColor: brandUi.borderStrong }}
          placeholder="CMYK · 12, 32, 0, 0"
          value={color.cmyk}
          onChange={(e) => onChange({ ...color, cmyk: e.target.value })}
        />
      </div>
      <button type="button" onClick={onRemove} className="text-[11px] shrink-0" style={{ color: brandUi.accent }}>
        Quitar
      </button>
    </div>
  );
}
