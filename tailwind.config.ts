import type { Config } from "tailwindcss";

/**
 * Manual de marca (tipografía): Helvetica = base (sans); Garamond = titulares / citas (serif).
 * `font-serif` usa EB Garamond vía `--font-garamond` (sustituto web; Apple Garamond = local si aplica).
 */
/** Paleta oficial — manual de marca Sofia Ciabattoni / Soulful Branding */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#131945",
          navyDark: "#0a0d2e",
          sky: "#C9E2FF",
          blue: "#323FF6",
          cream: "#F9F3DB",
          magenta: "#F03172",
          pink: "#F3B0E3",
          yellowPale: "#EEE78C",
          yellowBright: "#F2E914",
          redWine: "#9F2024",
          orange: "#FF340C",
          page: "#F2F2F2",
        },
      },
      fontFamily: {
        sans: ["Helvetica Neue", "Helvetica", "Segoe UI", "Roboto", "Arial", "sans-serif"],
        serif: ["var(--font-garamond)", "Apple Garamond", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
