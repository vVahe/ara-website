import Link from "next/link";
import { site } from "@/config/site";
import { InstagramIcon } from "./instagram-icon";
import styles from "./nav.module.css";

const links = [
  { href: "/#release", label: "EP" },
  { href: "/#shows", label: "Tour dates" },
  { href: "/#list", label: "Newsletter" },
];

export function Nav() {
  const instagram = site.socials[0];

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
        {instagram ? (
          <a
            className={styles.social}
            href={instagram.href}
            target="_blank"
            rel="noreferrer"
          >
            <InstagramIcon />
            <span className="visually-hidden">{instagram.label}</span>
          </a>
        ) : null}
      </nav>
    </header>
  );
}
