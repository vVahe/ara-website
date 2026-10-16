import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Shop",
};

export default function ShopPage() {
  return (
    <main className={styles.main}>
      <p>CD checkout is not open yet.</p>
      <a href="/">Back</a>
    </main>
  );
}
