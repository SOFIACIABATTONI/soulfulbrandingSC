import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContactEmailNotification } from "@/lib/send-contact-email";
import { checkRateLimit, requestClientIp } from "@/lib/rate-limit";
import { z } from "zod";
import { isContactFormKey } from "@/lib/contact-form-keys";

const CONTACT_MAX_PER_WINDOW = 8;
const CONTACT_WINDOW_MS = 10 * 60_000;

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  message: z.string().min(1).max(50000),
  formKey: z.string().optional(),
  stageTitle: z.string().max(200).optional(),
});

const FORM_ORIGIN_FALLBACK: Record<string, string> = {
  "contacto-corto": "Contacto",
  "aplicacion-inicio": "Etapas — Estoy comenzando",
  "contacto-evolucion": "Etapas — Necesito evolucionar",
  "aplicacion-expansion": "Etapas — Busco expandirme",
  "servicios-info": "Servicios",
};

export async function POST(req: Request) {
  const ip = requestClientIp(req);
  if (!checkRateLimit("contact", ip, CONTACT_MAX_PER_WINDOW, CONTACT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Demasiados envíos. Probá de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { name, email, message, formKey: rawKey, stageTitle: rawStage } = parsed.data;

  const formKey =
    rawKey && isContactFormKey(rawKey) ? rawKey : ("contacto-corto" as const);
  const stageTitle = ((rawStage ?? "").trim() || FORM_ORIGIN_FALLBACK[formKey] || "General").slice(0, 200);

  await prisma.contactMessage.create({
    data: {
      name,
      email,
      message,
      formKey,
      stageTitle,
    },
  });

  await sendContactEmailNotification({
    name,
    email,
    message,
    formKey,
    stageTitle,
  });

  return NextResponse.json({ ok: true });
}
