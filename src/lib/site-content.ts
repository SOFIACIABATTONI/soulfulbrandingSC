export type NavItem = { label: string; href: string };

export type ServiceItem = {
  title: string;
  description: string;
  /** Highlighted card style (mockup: item 3) */
  featured?: boolean;
};

/** Formulario asociado a la etapa (coincide con `momentos.md` y query `formulario`) */
export const STAGE_FORM_IDS = [
  "aplicacion-inicio",
  "contacto-evolucion",
  "aplicacion-expansion",
  "servicios-info",
] as const;
export type StageFormId = (typeof STAGE_FORM_IDS)[number];

export type StageItem = {
  title: string;
  /** Línea corta bajo el título (gancho) */
  description: string;
  /** Párrafo visible en la tarjeta (texto largo de apoyo; antes asociado a +INFO) */
  subtitle: string;
  /** Qué formulario abre al pulsar + INFO (`/?etapa=…&formulario=…#contacto`) */
  formId: StageFormId;
  /** Estética mockup: amarillo, bloque navy o tarjeta blanca con texto rosa */
  style?: "yellow" | "navy" | "outlinePink";
  /** Si es false, oculta el botón + INFO */
  showInfo?: boolean;
};

const STAGE_STYLE_CYCLE: { style: NonNullable<StageItem["style"]>; showInfo: boolean }[] = [
  { style: "yellow", showInfo: true },
  { style: "navy", showInfo: true },
  { style: "outlinePink", showInfo: true },
];

/** Mockup actual: solo tres momentos; el CMS antiguo podía tener más filas en JSON */
export const MAX_VISIBLE_STAGES = 3;

/** Asegura `style`, `showInfo`, `subtitle` y `formId`, recorta a `MAX_VISIBLE_STAGES` */
export function normalizeStageItems(stages: StageItem[]): StageItem[] {
  const defaults = defaultSiteContent().stages.stages;
  return stages.slice(0, MAX_VISIBLE_STAGES).map((s, i) => {
    const c = STAGE_STYLE_CYCLE[i % STAGE_STYLE_CYCLE.length];
    const d = defaults[i];
    const formId = (s as Partial<StageItem>).formId;
    const subtitle = (s as Partial<StageItem>).subtitle;
    return {
      ...s,
      style: s.style ?? c.style,
      showInfo: typeof s.showInfo === "boolean" ? s.showInfo : c.showInfo,
      subtitle: subtitle?.trim() ? subtitle : d?.subtitle ?? "",
      formId: (formId && STAGE_FORM_IDS.includes(formId as StageFormId) ? formId : d?.formId) ?? "aplicacion-inicio",
    };
  });
}

/** Bloque etapas: lista acotada e `activeIndex` coherente */
export function normalizeStagesSection(block: SiteContentData["stages"]): SiteContentData["stages"] {
  const list = normalizeStageItems(block.stages ?? []);
  const maxIdx = Math.max(0, list.length - 1);
  const raw = block.activeIndex;
  const ai = typeof raw === "number" && Number.isFinite(raw) ? Math.trunc(raw) : 0;
  return {
    ...block,
    stages: list,
    activeIndex: Math.min(Math.max(0, ai), maxIdx),
  };
}

export interface SiteContentData {
  nav: NavItem[];
  hero: {
    eyebrow: string;
    /** “SOULFUL BRANDING®” → se parte en dos columnas a los lados de la foto */
    title: string;
    /** Línea “EXPERIENCE” bajo el titular */
    experienceWord: string;
    subtitle: string;
    imageUrl: string;
    /** Logo wordmark encima del bloque (soulful-branding.svg) */
    showLogo: boolean;
  };
  essence: {
    headline: string;
    bullets: string[];
    bodyParagraph: string;
    workLine: string;
    whyLine: string;
    signatureName: string;
    signatureRole: string;
    imageLeftUrl: string;
    imageRightUrl: string;
  };
  about: {
    heading: string;
    body: string;
    readMoreLabel: string;
    imageUrl: string;
    /** Párrafo largo en tipografía pequeña (mockup About) */
    finePrint: string;
  };
  aboutMore: {
    introParagraphs: string[];
    sinceText: string;
    graciasText: string;
    processText: string;
    closingIntro: string;
    closingBullets: string[];
    closingOutro: string;
    imagePortraitUrl: string;
    imageBookUrl: string;
    imageExpandedUrl: string;
    imageMainLaptopUrl: string;
    imageBuddhaUrl: string;
  };
  method: {
    tagLabel: string;
    title: string;
    introParagraph1: string;
    introHighlight: string;
    introParagraph2: string;
    pillarsIntro: string;
    pillars: string[];
    transitionsIntro: string;
    transitions: string[];
    watermarkText: string;
    imageTopUrl: string;
    imageBottomUrl: string;
  };
  stages: {
    heading: string;
    stages: StageItem[];
    imageUrl: string;
    /** 0-based index for “active” stage in UI */
    activeIndex: number;
  };
  services: {
    backgroundWord: string;
    items: ServiceItem[];
  };
  contact: {
    heading: string;
    intro: string;
    instagramUrl: string;
    /** Enlace mailto para el ícono de email (Gmail en el mockup) */
    emailMailto?: string;
    substackUrl?: string;
    pinterestUrl?: string;
    footerTagline: string;
    /** Líneas en mayúsculas bajo el tagline del pie */
    footerLines?: string[];
    footerImageUrl: string;
  };
  meta: {
    siteTitle: string;
  };
}

export const defaultSiteContent = (): SiteContentData => ({
  meta: {
    siteTitle: "Soulful Branding®",
  },
  nav: [
    { label: "About", href: "#about" },
    { label: "Services", href: "#servicios" },
    { label: "Brand´s", href: "/portfolio" },
    { label: "Contacto", href: "#contacto" },
  ],
  hero: {
    eyebrow: "",
    title: "SOULFUL BRANDING®",
    experienceWord: "EXPERIENCE",
    subtitle: "",
    imageUrl: "/media/journaling.png",
    showLogo: true,
  },
  essence: {
    headline: "Toda marca tiene una esencia.",
    bullets: [
      "La coherencia le da fuerza.",
      "La percepción define el impacto.",
      "La autenticidad genera magnetismo.",
      "La expresión manifiesta su Identidad.",
    ],
    bodyParagraph:
      "Cuando una marca entiende quién es y qué representa, su identidad se vuelve magnética.",
    workLine: "Mi trabajo consiste en acompañar ese proceso.",
    whyLine: "That's WHY Soulful Branding®.",
    signatureName: "Sofía Ciabattoni",
    signatureRole: "Creative Studio.",
    imageLeftUrl: "/media/about-expanded-top-left-seated-laptop.png",
    imageRightUrl: "/media/book-portrait.png",
  },
  about: {
    heading: "ABOUT",
    body:
      "Exploro la alquimia entre identidad, estrategia y energía. Mi misión es visibilizar marcas —conscientes— con impacto social; uniendo estética y propósito.",
    readMoreLabel: "MORE ABOUT",
    imageUrl: "/media/about-main-laptop-portrait.png",
    finePrint:
      "Mi nombre es Sofia Ciabattoni. Me gusta presentarme como Artista y Alquimista porque tengo el don de revelar lo oculto y transformarlo en arte. De allí nace mi estudio creativo, el Atelier Identitario que hoy lleva mi nombre. Since 2018 (till now) me especializo en branding estratégico y diseño emocional. Llevo una década acompañando la creación de marcas e identidades que buscan algo más que presencia visual; eligen claridad, coherencia, sensibilidad estética, resonancia emocional. I mean = posicionamiento y autenticidad. Gracias a mi experiencia, hace 4 años nació mi propia metodología, el Soulful Branding®. Allí la suma de las partes co-crean el todo (estrategia, identidad y energía). El proceso implica profunda alineación y co-creación identitaria. El resultado es la expresión consciente de lo que ya es.",
  },
  aboutMore: {
    introParagraphs: [
      "Mi nombre es Sofia Ciabattoni.",
      "Exploro la alquimia entre identidad, estrategia y energía. Mi misión es visibilizar marcas —conscientes— con impacto social; uniendo estética y propósito.",
      "Me gusta presentarme como Artista y Alquimista porque tengo el don de revelar lo oculto y transformarlo en arte. De allí nace mi estudio creativo, el Atelier Identitario que hoy lleva mi nombre.",
    ],
    sinceText:
      "Since 2018 (til now) me especializo en branding estratégico y diseño emocional. Llevo una década acompañando la creación de marcas e identidades que buscan algo más que presencia visual; eligen claridad, coherencia, sensibilidad estética, resonancia emocional: I mean = posicionamiento y autenticidad.",
    graciasText:
      "Gracias a mi experiencia, hace 4 años nació mi propia metodología, el Soulful Branding®. Allí la suma de las partes co-crean el todo (estrategia, identidad y energía).",
    processText:
      "El proceso implica profunda alineación y co-creación identitaria. El resultado es la expresión consciente de lo que ya es.",
    closingIntro: "Es por eso que hoy trabajo con marcas o instituciones que:",
    closingBullets: [
    ],
    closingOutro:
      "El Soulful Branding® no es un proceso pensado para quienes buscan únicamente un logotipo rápido o soluciones superficiales. Es un proceso profundo de construcción identitaria.",
    imagePortraitUrl: "/media/about-portrait.jpeg",
    imageBookUrl: "/media/book-portrait.png",
    imageExpandedUrl: "/media/about-expanded-top-left-seated-laptop.png",
    imageMainLaptopUrl: "/media/about-main-laptop-portrait.png",
    imageBuddhaUrl: "/media/about-buddha-fuchsia.png",
  },
  method: {
    tagLabel: "[ EL MÉTODO ]",
    title: "SOULFUL BRANDING®",
    introParagraph1:
      "El método Soulful Branding® es un proceso que integra estrategia, energía e identidad para traducir la esencia de una marca en un sistema de comunicación coherente y sostenible.",
    introHighlight: "It's not about aesthetic.",
    introParagraph2:
      "Se trata de construir una identidad capaz de sostener el crecimiento del proyecto en el tiempo. It's about communication.",
    pillarsIntro: "Los pilares fundamentales de este proceso son:",
    pillars: ["Esencia e Identidad", "Sistema verbal", "Expresión visual"],
    transitionsIntro: "Esto nos permite pasar:",
    transitions: [
      "De la confusión a la claridad (seguridad y confianza).",
      "De la invisibilidad al magnetismo (que activa la presencia consciente).",
      "De la improvisación a la manifestación con intención (sistemas y fundamentos).",
    ],
    watermarkText: "Soulful Branding®",
    imageTopUrl: "/media/method-sofia-seated.png",
    imageBottomUrl: "/media/method-sofia-ipad-laptop.png",
  },
  stages: {
    heading: "¿En qué momento te encuentras?",
    stages: [
      {
        title: "Estoy comenzando",
        description: "Tengo una idea o proyecto y necesito darle forma desde cero.",
        subtitle:
          "Para marcas o proyectos visionarios que desean materializar su marca con consciencia, coherencia y sistemas claros. Revelaremos la esencia y lo traducimos en identidad verbal-visual.",
        formId: "aplicacion-inicio",
        style: "yellow",
        showInfo: true,
      },
      {
        title: "Necesito evolucionar",
        description: "Ya tengo una marca pero siento que no me representa completamente.",
        subtitle:
          "Ideal para empresas o marcas que han crecido o evolucionado. Revisaremos tu identidad actual, identificaremos el momento vital y qué necesita transformarse para alinearte a la proyección.",
        formId: "contacto-evolucion",
        style: "navy",
        showInfo: true,
      },
      {
        title: "Busco expandirme",
        description: "Mi marca está sólida pero necesito materiales y aplicaciones.",
        subtitle:
          "Para marcas establecidas que necesitan ampliar el material de comunicación. Revisaremos desarrollos y conceptos existentes para expandir el mensaje.",
        formId: "aplicacion-expansion",
        style: "outlinePink",
        showInfo: true,
      },
    ],
    imageUrl: "/media/stages-sofia-laptop.png",
    activeIndex: 0,
  },
  services: {
    backgroundWord: "Servicios",
    items: [
      { title: "Identidad de marca", description: "Esencia, narrativa verbal, arquitectura conceptual, identidad visual y sistema de marca." },
      {
        title: "Estrategia visual",
        description:
          "Materiales complementarios que expandan la percepción y experiencia de la marca en el mercado, basados en la identidad actual.",
      },
      {
        title: "Diseño editorial",
        description: "Material complementario de carácter institucional, basado en la identidad actual.",
        featured: true,
      },
      {
        title: "Presencia digital",
        description: "Diseño y/o activación de sitio web, plataformas digitales, redes sociales, membresías, etc.",
      },
    ],
  },
  contact: {
    heading: "CONTACTO",
    intro:
      "Me gustaría escuchar sobre tu proyecto y explorar cómo podemos crear algo significativo juntos.",
    instagramUrl: "https://instagram.com",
    emailMailto: "mailto:soficiabattoni@gmail.com",
    /** Placeholder visual mockup; reemplazar en admin con tus URLs reales */
    substackUrl: "https://substack.com",
    pinterestUrl: "https://www.pinterest.com",
    footerTagline: "Soulful Branding®",
    footerLines: [
      "INTERNATIONAL CREATIVE STUDIO",
      "HIGH END EXPERTISE",
      "SERVICIOS EXCLUSIVOS 1:1",
    ],
    footerImageUrl: "/media/book-portrait.png",
  },
});

/** Rutas `/uploads/…` solo existen en máquinas locales (gitignored); en Vercel hay que servir desde `/public/media`. */
function methodImageUrlFromDb(
  url: string | undefined,
  fallback: string,
): string {
  const u = url?.trim() ?? "";
  if (!u || u.startsWith("/uploads/")) return fallback;
  return u;
}

/** Correos antiguos guardados en el CMS; el valor por defecto actual sustituye a estos al leer. */
function normalizeContactEmailMailto(raw: string | undefined, fallback: string): string {
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;
  const addr = trimmed.replace(/^mailto:/i, "").trim().toLowerCase();
  if (addr.endsWith("@soulfulbranding.com")) return fallback;
  return trimmed.startsWith("mailto:") ? trimmed : `mailto:${trimmed}`;
}

/** Si en CMS quedaron URLs vacías, usa las rutas locales del mockup en `/public/media`. */
export function fillEmptyMediaFromDefaults(data: SiteContentData): SiteContentData {
  const d = defaultSiteContent();
  const normalizeServiceTitle = (value: string): string => {
    const v = value.trim().toLowerCase();
    if (v === "identidad de marca") return "Identidad de marca";
    if (v === "estrategia visual") return "Estrategia visual";
    if (v === "diseño editorial") return "Diseño editorial";
    if (v === "presencia digital") return "Presencia digital";
    return value;
  };
  const normalizedServiceItems = (data.services?.items ?? d.services.items).map((item) => ({
    ...item,
    title: normalizeServiceTitle(item.title),
  }));
  return {
    ...data,
    hero: {
      ...d.hero,
      ...data.hero,
      imageUrl: data.hero.imageUrl || d.hero.imageUrl,
      experienceWord: data.hero.experienceWord ?? d.hero.experienceWord,
      showLogo: data.hero.showLogo ?? d.hero.showLogo,
    },
    essence: {
      ...d.essence,
      ...data.essence,
      imageLeftUrl: data.essence.imageLeftUrl || d.essence.imageLeftUrl,
      imageRightUrl: data.essence.imageRightUrl || d.essence.imageRightUrl,
      bodyParagraph: data.essence.bodyParagraph ?? d.essence.bodyParagraph,
      workLine: data.essence.workLine ?? d.essence.workLine,
      whyLine: data.essence.whyLine ?? d.essence.whyLine,
      signatureName: data.essence.signatureName ?? d.essence.signatureName,
      signatureRole: data.essence.signatureRole ?? d.essence.signatureRole,
    },
    about: {
      ...d.about,
      ...data.about,
      imageUrl: data.about.imageUrl || d.about.imageUrl,
      body:
        !data.about.body?.trim() || data.about.body ===
          "Soy consultora de marca y comunicación. Trabajo con emprendedoras y equipos que quieren una presencia fiel a lo que son — con procesos ordenados y un tono humano."
          ? d.about.body
          : data.about.body,
      readMoreLabel:
        !data.about.readMoreLabel?.trim() || data.about.readMoreLabel === "READ MORE"
          ? d.about.readMoreLabel
          : data.about.readMoreLabel,
      finePrint: data.about.finePrint?.trim() ? data.about.finePrint : d.about.finePrint,
    },
    aboutMore: {
      ...d.aboutMore,
      ...data.aboutMore,
      introParagraphs: data.aboutMore?.introParagraphs?.length
        ? data.aboutMore.introParagraphs
        : d.aboutMore.introParagraphs,
      closingBullets: data.aboutMore?.closingBullets?.length
        ? data.aboutMore.closingBullets
        : d.aboutMore.closingBullets,
      imagePortraitUrl: data.aboutMore?.imagePortraitUrl || d.aboutMore.imagePortraitUrl,
      imageBookUrl: data.aboutMore?.imageBookUrl || d.aboutMore.imageBookUrl,
      imageExpandedUrl: data.aboutMore?.imageExpandedUrl || d.aboutMore.imageExpandedUrl,
      imageMainLaptopUrl: data.aboutMore?.imageMainLaptopUrl || d.aboutMore.imageMainLaptopUrl,
      imageBuddhaUrl: data.aboutMore?.imageBuddhaUrl || d.aboutMore.imageBuddhaUrl,
    },
    method: {
      ...d.method,
      ...data.method,
      pillars: data.method?.pillars?.length ? data.method.pillars : d.method.pillars,
      transitions: data.method?.transitions?.length ? data.method.transitions : d.method.transitions,
      imageTopUrl: methodImageUrlFromDb(data.method?.imageTopUrl, d.method.imageTopUrl),
      imageBottomUrl: methodImageUrlFromDb(data.method?.imageBottomUrl, d.method.imageBottomUrl),
    },
    stages: normalizeStagesSection({
      ...data.stages,
      imageUrl: data.stages.imageUrl || d.stages.imageUrl,
      stages: normalizeStageItems(
        data.stages.stages?.length ? data.stages.stages : d.stages.stages,
      ),
    }),
    services: {
      ...d.services,
      ...data.services,
      items: normalizedServiceItems,
    },
    contact: {
      ...d.contact,
      ...data.contact,
      intro:
        !data.contact.intro?.trim() ||
        data.contact.intro === "Cuéntame sobre tu proyecto. Responderé lo antes posible."
          ? d.contact.intro
          : data.contact.intro,
      footerImageUrl: data.contact.footerImageUrl || d.contact.footerImageUrl,
      footerLines:
        data.contact.footerLines?.length ? data.contact.footerLines : d.contact.footerLines,
      emailMailto: normalizeContactEmailMailto(data.contact.emailMailto, d.contact.emailMailto),
      substackUrl: data.contact.substackUrl?.trim() || d.contact.substackUrl,
      pinterestUrl: data.contact.pinterestUrl?.trim() || d.contact.pinterestUrl,
    },
  };
}

export function parseSiteContent(raw: unknown): SiteContentData {
  const d = defaultSiteContent();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;
  return {
    meta: { ...d.meta, ...(o.meta as SiteContentData["meta"]) },
    nav: Array.isArray(o.nav) ? (o.nav as NavItem[]) : d.nav,
    hero: { ...d.hero, ...(o.hero as object) },
    essence: { ...d.essence, ...(o.essence as object) },
    about: { ...d.about, ...(o.about as object) },
    aboutMore: { ...d.aboutMore, ...(o.aboutMore as object) } as SiteContentData["aboutMore"],
    method: { ...d.method, ...(o.method as object) } as SiteContentData["method"],
    stages: normalizeStagesSection({
      ...d.stages,
      ...(o.stages as object),
      stages: normalizeStageItems(
        Array.isArray((o.stages as Record<string, unknown>)?.stages)
          ? ((o.stages as { stages: StageItem[] }).stages)
          : d.stages.stages,
      ),
    }),
    services: {
      ...d.services,
      ...(o.services as object),
      items: Array.isArray((o.services as Record<string, unknown>)?.items)
        ? ((o.services as { items: ServiceItem[] }).items)
        : d.services.items,
    },
    contact: { ...d.contact, ...(o.contact as object) } as SiteContentData["contact"],
  };
}
