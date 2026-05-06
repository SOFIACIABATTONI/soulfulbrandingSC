"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";
import type { ConsentState } from "@/lib/cookie-consent";
import { getConsent } from "@/lib/cookie-consent";

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-7HMFH56SV0";

/**
 * Scripts de analítica / marketing según consentimiento (localStorage).
 * GA4 solo se monta si el usuario aceptó cookies de analítica.
 */
export function ConsentScripts() {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    setConsent(getConsent());

    const onUpdate = (e: Event) => {
      const ce = e as CustomEvent<ConsentState>;
      if (ce.detail) setConsent(ce.detail);
      else setConsent(getConsent());
    };

    window.addEventListener("sb-consent-updated", onUpdate);
    return () => window.removeEventListener("sb-consent-updated", onUpdate);
  }, []);

  if (!consent?.analytics) return null;

  return <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
