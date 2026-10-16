import Link from "next/link";
import { site } from "@/config/site";
import { SocialIcon } from "./social-icon";
import styles from "./footer.module.css";

export function Footer({ year }: { year: string }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p>© {year} {site.artistName}. All rights reserved.</p>
          <p className={styles.credit}>Designed by VAHECO</p>
        </div>
        <nav className={styles.meta} aria-label="Footer">
          <span className={styles.socials}>
            {site.socials.map((social) => (
              <a
                key={social.label}
                className={styles.social}
                href={social.href}
                target="_blank"
                rel="noreferrer"
              >
                <SocialIcon name={social.label} />
                <span className="visually-hidden">{social.label}</span>
              </a>
            ))}
          </span>
          <Link href="/privacy">Privacy</Link>
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </nav>
      </div>
    </footer>
  );
}
