/** URL estática bajo `public/portfolio-media/<id>/` (Vercel sirve `public/` sin meter cientos de MB en la función serverless). */
export function portfolioAssetUrl(projectId: string, filename: string) {
  const enc = (s: string) => encodeURIComponent(s);
  return `/portfolio-media/${enc(projectId)}/${enc(filename)}`;
}
