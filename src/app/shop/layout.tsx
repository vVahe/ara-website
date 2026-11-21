import type { ReactNode } from "react";
import { connection } from "next/server";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { amsterdamYear } from "@/lib/dates";
import styles from "./layout.module.css";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  await connection();
  return (
    <div className={styles.shell}>
      <Nav />
      {children}
      <div className={styles.footerDock}>
        <Footer year={amsterdamYear()} />
      </div>
    </div>
  );
}
