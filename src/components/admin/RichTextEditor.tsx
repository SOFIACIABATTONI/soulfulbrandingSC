"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { brandUi } from "@/lib/brand-ui";
import "./rich-text-editor.css";

const BRAND_COLORS = [
  { label: "Rosa", value: "#F03172" },
  { label: "Navy", value: "#131945" },
  { label: "Azul", value: "#323FF6" },
  { label: "Rosa claro", value: "#F3B0E3" },
  { label: "Negro", value: "#0D0D0D" },
];

type RichTextEditorProps = {
  value: string;
  placeholder?: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  ariaLabel?: string;
};

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="min-w-[32px] h-8 px-2 rounded-lg text-sm font-semibold transition-colors"
      style={{
        background: active ? brandUi.accentSoft : "transparent",
        color: active ? brandUi.accent : brandUi.textMuted,
      }}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  placeholder = "Escribí acá…",
  onChange,
  onBlur,
  ariaLabel,
}: RichTextEditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmitted = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "tiptap",
        "aria-label": ariaLabel ?? "Editor de documento",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmitted.current = html;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => onChange(html), 600);
    },
    onBlur: () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      onBlur?.();
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    if (editor.getHTML() === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
    lastEmitted.current = value;
  }, [editor, value]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div
      className="rich-text-editor rounded-2xl border overflow-hidden bg-white"
      style={{ borderColor: brandUi.borderStrong }}
    >
      <div
        className="flex flex-wrap items-center gap-1 px-2 py-2 border-b"
        style={{ borderColor: brandUi.border, background: "#FAFAFA" }}
      >
        <ToolbarButton
          title="Negrita"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          title="Cursiva"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="italic font-serif">I</span>
        </ToolbarButton>
        <ToolbarButton
          title="Subrayado"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          title="Tachado"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <span className="line-through">S</span>
        </ToolbarButton>

        <span className="w-px h-6 mx-1" style={{ background: brandUi.border }} />

        <select
          title="Título"
          className="h-8 rounded-lg border px-2 text-xs"
          style={{ borderColor: brandUi.border, color: brandUi.textMuted }}
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                  ? "h3"
                  : "p"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 }).run();
          }}
        >
          <option value="p">Texto normal</option>
          <option value="h1">Título grande</option>
          <option value="h2">Título medio</option>
          <option value="h3">Título chico</option>
        </select>

        <span className="w-px h-6 mx-1" style={{ background: brandUi.border }} />

        <ToolbarButton
          title="Lista con viñetas"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •≡
        </ToolbarButton>
        <ToolbarButton
          title="Lista numerada"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          title="Checklist — tildá lo que vayas completando"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          ☑
        </ToolbarButton>

        <span className="w-px h-6 mx-1" style={{ background: brandUi.border }} />

        <label
          title="Color del texto"
          className="flex items-center gap-1 h-8 px-2 rounded-lg cursor-pointer text-xs font-bold"
          style={{ color: brandUi.textMuted }}
        >
          A
          <input
            type="color"
            className="w-6 h-6 border-0 p-0 cursor-pointer bg-transparent"
            defaultValue="#F03172"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>

        <div className="flex items-center gap-0.5">
          {BRAND_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              className="w-5 h-5 rounded-full border"
              style={{ background: c.value, borderColor: brandUi.border }}
              onClick={() => editor.chain().focus().setColor(c.value).run()}
            />
          ))}
        </div>

        <span className="w-px h-6 mx-1" style={{ background: brandUi.border }} />

        <ToolbarButton
          title="Insertar tabla"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          ⊞
        </ToolbarButton>
        <ToolbarButton
          title="Quitar negrita / color / formato"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          ✕
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

/** HTML del editor listo para incrustar en un mail. */
export function phaseHtmlForEmail(html: string): string {
  return html;
}
