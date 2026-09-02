import { GatewayLanding } from "@/components/gateway/GatewayLanding";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata = buildPageMetadata({
  title: "Soulful Branding® | Oráculo Raíz & Creative Studio",
  description:
    "Elegí tu camino: Oráculo Raíz — experiencia de marca desde el origen — o Creative Studio — identidad, energía y estrategia con Sofía Ciabattoni.",
  path: "/",
});

export default function GatewayPage() {
  return <GatewayLanding />;
}
