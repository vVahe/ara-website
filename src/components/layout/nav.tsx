"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { site } from "@/config/site";
import { SocialIcon } from "./social-icon";
import styles from "./nav.module.css";

const links = [
  { href: "/#home", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/#watch", label: "Listen now" },
  { href: "/#shows", label: "Live Shows" },
  { href: "/#list", label: "Newsletter" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={solid ? `${styles.nav} ${styles.solid}` : styles.nav}>
      <Link className={styles.name} href="/#home" onClick={() => setOpen(false)}>
        {site.artistName}
      </Link>
      <nav className={styles.links} aria-label="Sections">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <Socials className={styles.socials} />
      <button
        type="button"
        className={open ? `${styles.menuButton} ${styles.menuOpen}` : styles.menuButton}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="visually-hidden">{open ? "Close menu" : "Open menu"}</span>
        <span className={styles.bars} aria-hidden="true" />
      </button>
      {open ? (
        <div id="site-menu" className={styles.drawer}>
          <nav className={styles.drawerLinks} aria-label="Sections">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
          <Socials className={styles.drawerSocials} />
        </div>
      ) : null}
    </header>
  );
}

function Socials({ className }: { className: string }) {
  return (
    <div className={className}>
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
    </div>
  );
}
