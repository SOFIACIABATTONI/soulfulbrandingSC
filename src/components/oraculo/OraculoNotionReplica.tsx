import Link from "next/link";
import type { OraculoBlock } from "@/lib/oraculo-page-layout-types";
import { OraculoOrderForm } from "@/components/oraculo/OraculoPageClient";
import { ORACULO_MEDIA } from "@/lib/oraculo-content";
import styles from "./oraculo-notion.module.css";

function Lines({ lines, boldFromLine }: { lines: string[]; boldFromLine?: number }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {boldFromLine !== undefined && i >= boldFromLine ? <strong>{line}</strong> : line}
        </span>
      ))}
    </>
  );
}

function RichText({ html }: { html: string }) {
  return <div className={styles.textBlock} dangerouslySetInnerHTML={{ __html: html.replace(/\n/g, "<br />") }} />;
}

function BlockImage({ src, alt, href }: { src: string; alt?: string; href?: string }) {
  if (src.endsWith(".bin")) return null;
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt ?? ""} className="w-full" />
  );
  return (
    <div className={styles.mediaBlock}>
      {href ? <Link href={href}>{img}</Link> : img}
    </div>
  );
}

type Props = {
  blocks: OraculoBlock[];
  videoUrl: string;
};

export function OraculoNotionReplica({ blocks, videoUrl }: Props) {
  return (
    <article className={styles.oraculoPage}>
      <div className={styles.notionBody}>
        {blocks.map((block, index) => {
          switch (block.kind) {
            case "title":
              return (
                <h1 key={index} className={styles.title}>
                  {block.text}
                </h1>
              );
            case "sub_header":
              return (
                <h3 key={index} className={styles.subHeader}>
                  <Lines lines={block.lines} />
                </h3>
              );
            case "sub_sub_header":
              return (
                <h4 key={index} className={styles.subSubHeader}>
                  <Lines lines={block.lines} boldFromLine={block.boldFromLine} />
                </h4>
              );
            case "text":
              return <RichText key={index} html={block.html} />;
            case "bulleted_list":
              return (
                <div key={index} className={styles.bulletItem}>
                  <span>{block.text}</span>
                </div>
              );
            case "image":
              return <BlockImage key={index} src={block.src} alt={block.alt} href={block.href} />;
            case "audio":
              return (
                <audio
                  key={index}
                  controls
                  className={styles.audio}
                  src={ORACULO_MEDIA.bienvenidaAudio}
                  preload="metadata"
                />
              );
            case "video":
              return (
                <div key={index} className={styles.mediaBlock}>
                  {videoUrl ? (
                    <video controls playsInline className="w-full bg-black" preload="metadata" src={videoUrl} />
                  ) : null}
                  <p className={styles.caption}>{block.caption}</p>
                </div>
              );
            case "form":
              return (
                <section key={index} className={styles.formSection} id="comprar">
                  <h1 className={styles.formTitle}>Oráculo Raíz—</h1>
                  <OraculoOrderForm />
                </section>
              );
            case "callout_image":
              return <BlockImage key={index} src={block.src} alt="" />;
            default:
              return null;
          }
        })}

        <footer className="mt-12 flex justify-center pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ORACULO_MEDIA.footerImage} alt="Soulful Branding" className="max-w-[200px]" />
        </footer>
      </div>
    </article>
  );
}
