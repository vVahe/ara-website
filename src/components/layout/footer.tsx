import { site } from "@/config/site";
import { InstagramIcon } from "./instagram-icon";
import styles from "./footer.module.css";

export function Footer() {
  const instagram = site.socials[0];
  if (!instagram) return null;

  return (
    <footer className={styles.footer}>
      <a
        className={styles.social}
        href={instagram.href}
        target="_blank"
        rel="noreferrer"
      >
        <InstagramIcon />
        <span className="visually-hidden">{instagram.label}</span>
      </a>
    </footer>
  );
}
