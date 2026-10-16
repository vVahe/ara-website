import Image from "next/image";
import { release } from "@/lib/content";
import styles from "./release.module.css";

const placeholderBlurb = "One or two sentences.";

export function Release() {
  const blurb =
    release.blurb && release.blurb !== placeholderBlurb ? release.blurb : null;

  return (
    <section id="release" className={styles.section}>
      <p className={styles.label}>{release.type}</p>
      <div className={styles.layout}>
        <Image
          src={release.cover}
          alt={`${release.title} cover`}
          width={1600}
          height={1600}
        />
        <div>
          <h1 className={styles.title}>{release.title}</h1>
          {blurb ? <p className={styles.blurb}>{blurb}</p> : null}
          {release.spotifyEmbedUrl ? (
            <div className={styles.player}>
              <iframe
                src={release.spotifyEmbedUrl}
                height={352}
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                title={`${release.title} on Spotify`}
              />
            </div>
          ) : null}
          <a className={styles.buy} href="/shop">
            Buy CD
          </a>
        </div>
      </div>
    </section>
  );
}
