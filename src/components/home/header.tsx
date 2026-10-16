import Image from "next/image";
import { site } from "@/config/site";
import styles from "./header.module.css";

export function Header() {
  return (
    <div className={styles.header}>
      <Image
        src="/media/header.webp"
        alt={site.artistName}
        width={1600}
        height={900}
        priority
      />
    </div>
  );
}
