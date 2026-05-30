import { QuoteRespondClient } from "./QuoteRespondClient";

type Props = { params: Promise<{ token: string }> };

export const metadata = {
  title: "Tu propuesta — Soulful Branding®",
  robots: { index: false, follow: false },
};

export default async function PresupuestoPublicPage({ params }: Props) {
  const { token } = await params;
  return <QuoteRespondClient token={token} />;
}
