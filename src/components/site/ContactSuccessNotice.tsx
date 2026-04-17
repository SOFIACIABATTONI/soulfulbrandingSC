"use client";

import { POST_CONTACT_GOOGLE_CALENDAR_URL } from "@/lib/contact-calendar";

export function ContactSuccessNotice() {
  return (
    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <p className="text-sm font-medium text-emerald-800">Mensaje enviado. Gracias.</p>
      <p className="mt-1 text-xs leading-relaxed text-emerald-700">
        Si querés avanzar ahora, podés reservar tu llamada directamente desde Google Calendar.
      </p>
      <a
        href={POST_CONTACT_GOOGLE_CALENDAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center justify-center rounded-lg bg-brand-navy px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-brand-navyDark"
      >
        Ir al calendario
      </a>
    </div>
  );
}
