import { ORACULO_MEDIA } from "@/lib/oraculo-content";
import styles from "./oraculo-notion.module.css";

type Props = {
  className?: string;
  florSrc?: string;
};

export function OraculoFlorMark({ className, florSrc }: Props) {
  return (
    <div className={className ? `${styles.florMark} ${className}` : styles.florMark}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={florSrc ?? ORACULO_MEDIA.florNegra} alt="" className={styles.florMarkImg} />
    </div>
  );
}
