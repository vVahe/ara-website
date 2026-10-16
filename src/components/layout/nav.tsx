import Link from "next/link";
import { site } from "@/config/site";
import { SocialIcon } from "./social-icon";
import styles from "./nav.module.css";

const links = [
  { href: "/#release", label: "EP" },
  { href: "/#shows", label: "Show dates" },
  { href: "/#list", label: "Newsletter" },
];

export function Nav() {
  return (
    <header className={styles.nav}>
      <Link className={styles.name} href="/">
        {site.artistName}
      </Link>
      <nav className={styles.links} aria-label="Sections">
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
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
      </nav>
    </header>
  );
}
