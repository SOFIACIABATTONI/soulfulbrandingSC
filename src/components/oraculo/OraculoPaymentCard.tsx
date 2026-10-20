import type { ReactNode } from "react";
import Link from "next/link";
import { ORACULO_MEDIA, ORACULO_PAYMENT } from "@/lib/oraculo-content";
import type { OraculoMediaUrls } from "@/lib/oraculo-page-content";
import { OraculoFlorMark } from "@/components/oraculo/OraculoFlorMark";
import styles from "./oraculo-notion.module.css";

type Props = {
  paymentLink?: string;
  media?: OraculoMediaUrls;
};

function PaymentFlag({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={styles.paymentFlagImg} aria-hidden="true" />
  );
}

function PaymentMethodBox({
  flagSrc,
  label,
  children,
}: {
  flagSrc: string;
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.paymentMethodBox}>
      <p className={styles.paymentMethodLabel}>
        <PaymentFlag src={flagSrc} />
        <span>{label}</span>
      </p>
      {children}
    </div>
  );
}

function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className={styles.paymentCheckItem}>
      <span className={styles.paymentCheckIcon} aria-hidden="true">✓</span>
      <span>{children}</span>
    </li>
  );
}

export function OraculoPaymentCard({ paymentLink, media }: Props) {
  const { ar, es } = ORACULO_PAYMENT;
  const esLink = paymentLink?.trim() || es.paymentLink;
  const m = media ?? ORACULO_MEDIA;

  return (
    <section className={styles.paymentCard} aria-labelledby="oraculo-payment-heading">
      <OraculoFlorMark className={styles.paymentCardLogoWrap} florSrc={m.florNegra} />

      <div className={styles.paymentColumns}>
        <div className={styles.paymentColumn}>
          <h3 className={styles.paymentCountry}>{ar.label}</h3>
          <hr className={styles.paymentRule} />
          <p className={styles.paymentPrice}>
            Valor oficial: <strong>{ar.price}</strong>
          </p>
          <PaymentMethodBox flagSrc={m.flagAr} label="Alias:">
            <p className={styles.paymentMethodValue}>{ar.alias}</p>
          </PaymentMethodBox>
          <PaymentMethodBox flagSrc={m.flagAr} label={`${ar.cvuLabel}:`}>
            <p className={styles.paymentMethodValue}>{ar.cvu}</p>
          </PaymentMethodBox>
        </div>

        <div className={styles.paymentColumn}>
          <h3 className={styles.paymentCountry}>{es.label}</h3>
          <hr className={styles.paymentRule} />
          <p className={styles.paymentPrice}>
            Valor oficial: <strong>{es.price}</strong>
          </p>
          <PaymentMethodBox flagSrc={m.flagEs} label={<strong>Bizum:</strong>}>
            <p className={styles.paymentMethodValue}>{es.phone}</p>
          </PaymentMethodBox>
          <PaymentMethodBox
            flagSrc={m.flagEs}
            label={
              <>
                <strong>Transferencia</strong>:
              </>
            }
          >
            {esLink ? (
              <Link href={esLink} className={styles.paymentLink} target="_blank" rel="noopener noreferrer">
                link de pago
              </Link>
            ) : (
              <span className={styles.paymentLinkMuted}>link de pago</span>
            )}
          </PaymentMethodBox>
        </div>
      </div>

      <hr className={styles.paymentRuleFull} />

      <div className={styles.paymentImportant}>
        <h4 id="oraculo-payment-heading" className={styles.paymentImportantTitle}>
          IMPORTANTE (!!!)
        </h4>
        <ul className={styles.paymentCheckList}>
          <CheckItem>
            <strong>Una vez realizado el pago, completá el formulario a continuación.</strong>
          </CheckItem>
          <CheckItem>
            <strong>Recibirás el acceso en las próximas 24 horas,</strong> directamente en tu correo.
          </CheckItem>
          <CheckItem>
            <strong>Adjuntá el comprobante</strong> —ese es el único paso que nos separa de que esto sea tuyo.
          </CheckItem>
        </ul>
      </div>
    </section>
  );
}
