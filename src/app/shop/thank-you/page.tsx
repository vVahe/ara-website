import type { Metadata } from "next";
import Link from "next/link";
import { copy } from "@/config/copy";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const reference = order && /^ord_[A-Za-z0-9_-]{12}$/.test(order) ? order : null;

  return (
    <main className={styles.main}>
      <h1>Thank you</h1>
      <p>{copy.thankYou}</p>
      {reference ? (
        <p className={styles.reference}>
          {copy.reference} {reference}
        </p>
      ) : null}
      <p>
        <Link href="/shop">{copy.backToShop}</Link>
      </p>
    </main>
  );
}
