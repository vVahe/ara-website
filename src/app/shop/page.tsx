import type { Metadata } from "next";
import { Catalog } from "@/components/shop/catalog";
import { copy } from "@/config/copy";
import { products } from "@/lib/content";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Shop",
};

export default function ShopPage() {
  return (
    <main className={styles.main}>
      <h1>{copy.shopTitle}</h1>
      <p className={styles.note}>{copy.vatNote}</p>
      <Catalog products={products} />
      {/* LEGAL_REVIEW: starting text, not legal advice. */}
      <p className={styles.legal}>{copy.withdrawal}</p>
    </main>
  );
}
