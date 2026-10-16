import type { Metadata } from "next";
import Link from "next/link";
import { copy } from "@/config/copy";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Cancelled",
  robots: { index: false, follow: false },
};

export default function CancelledPage() {
  return (
    <main className={styles.main}>
      <h1>Cancelled</h1>
      <p>{copy.cancelledLead}</p>
      <p>
        <Link href="/shop">{copy.backToShop}</Link>
      </p>
    </main>
  );
}
