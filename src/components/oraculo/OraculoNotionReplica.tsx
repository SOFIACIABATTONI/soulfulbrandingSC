import type { ReactNode } from "react";
import Link from "next/link";
import type { OraculoBlock } from "@/lib/oraculo-page-layout-types";
import { OraculoOrderForm } from "@/components/oraculo/OraculoPageClient";
import { OraculoPaymentCard } from "@/components/oraculo/OraculoPaymentCard";
import { OraculoFlorMark } from "@/components/oraculo/OraculoFlorMark";
import { ORACULO_MEDIA } from "@/lib/oraculo-content";
import styles from "./oraculo-notion.module.css";

function Lines({ lines, boldFromLine }: { lines: string[]; boldFromLine?: number }) {
  const nodes: ReactNode[] = [];
  let lastWasLine = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "") {
      nodes.push(<span key={`gap-${i}`} className={styles.stanzaGap} aria-hidden="true" />);
      lastWasLine = false;
      continue;
    }
    if (lastWasLine) {
      nodes.push(<br key={`br-${i}`} />);
    }
    const content =
      boldFromLine !== undefined && i >= boldFromLine ? <strong>{line}</strong> : line;
    nodes.push(<span key={i}>{content}</span>);
    lastWasLine = true;
  }

  return <>{nodes}</>;
}

function RichText({
  html,
  center,
  small,
  brandLines,
}: {
  html: string;
  center?: boolean;
  small?: boolean;
  brandLines?: boolean;
}) {
  const className = [
    styles.textBlock,
    center ? styles.textBlockCenter : "",
    small ? styles.textBlockSmall : "",
    brandLines ? styles.textBlockBrandLines : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: html.replace(/\n/g, "<br />") }} />
  );
}

function BlockImage({
  src,
  alt,
  href,
  compact,
}: {
  src: string;
  alt?: string;
  href?: string;
  compact?: boolean;
}) {
  if (src.endsWith(".bin")) return null;
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className={compact ? styles.mediaImageCompact : "w-full"}
    />
  );
  return (
    <div className={compact ? styles.mediaBlockCompact : styles.mediaBlock}>
      {href ? <Link href={href}>{img}</Link> : img}
    </div>
  );
}

type Props = {
  blocks: OraculoBlock[];
  videoUrl: string;
  paymentLink?: string;
};

export function OraculoNotionReplica({ blocks, videoUrl, paymentLink }: Props) {
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
                <h4
                  key={index}
                  className={`${styles.subSubHeader}${block.align === "center" ? ` ${styles.subSubHeaderCenter}` : ""}`}
                >
                  <Lines lines={block.lines} boldFromLine={block.boldFromLine} />
                </h4>
              );
            case "text":
              return (
                <RichText
                  key={index}
                  html={block.html}
                  center={block.align === "center"}
                  small={block.size === "sm"}
                  brandLines={block.variant === "brandLines"}
                />
              );
            case "bulleted_list":
              return (
                <div key={index} className={styles.bulletItem}>
                  <span>{block.text}</span>
                </div>
              );
            case "image":
              return (
                <BlockImage
                  key={index}
                  src={block.src}
                  alt={block.alt}
                  href={block.href}
                  compact={block.scale === "compact"}
                />
              );
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
                    <video controls playsInline className="w-full bg-black" preload="metadata">
                      <source src={videoUrl} type="video/quicktime" />
                    </video>
                  ) : null}
                  <p className={styles.caption}>{block.caption}</p>
                </div>
              );
            case "payment_card":
              return <OraculoPaymentCard key={index} paymentLink={paymentLink} />;
            case "form":
              return (
                <section key={index} className={styles.formSection} id="comprar">
                  <OraculoFlorMark className={styles.formFlorWrap} />
                  <h1 className={styles.formTitle}>Oráculo Raíz—</h1>
                  <OraculoOrderForm />
                </section>
              );
            case "callout_image":
              return <BlockImage key={index} src={block.src} alt="" />;
            case "spacer":
              return (
                <div
                  key={index}
                  className={block.size === "lg" ? styles.blockGapLg : styles.blockGap}
                  aria-hidden="true"
                />
              );
            default: {
              const _exhaustive: never = block;
              return _exhaustive;
            }
          }
        })}

      </div>
    </article>
  );
}
