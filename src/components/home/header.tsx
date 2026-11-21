import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";
import styles from "./header.module.css";

export function Header() {
  return (
    <section id="home" className={styles.header} aria-label={site.artistName}>
      <Image
        src="/media/header.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className={styles.image}
      />
      <div className={styles.copy}>
        <h1 className={styles.title}>
          <Image
            src="/media/flower-design.png"
            alt=""
            width={931}
            height={1025}
            className={styles.flower}
            aria-hidden
          />
          <span className={styles.album}>Where the Lilies Bloom in Ruins</span>
          <span className={styles.out}>EP Out Now</span>
        </h1>
        <div className={styles.actions}>
          <Link className={styles.button} href="/shop">
            Order Now
          </Link>
        </div>
      </div>
    </section>
  );
}
