import { SocialIcon } from "@/components/layout/social-icon";
import { site } from "@/config/site";
import { videos } from "@/lib/content";
import styles from "./watch.module.css";

function youtubeId(value: string) {
  return value.split("&")[0]?.split("?")[0] ?? "";
}

export function Watch() {
  const clips = videos.filter(
    (video) => video.featured && youtubeId(video.youtubeId),
  );

  if (clips.length === 0) return null;

  return (
    <section id="watch" className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.label}>Listen now</h2>
        <ul className={styles.services}>
          {site.listen.map((service) => (
            <li key={service.label}>
              <a
                className={styles.service}
                href={service.href}
                target="_blank"
                rel="noreferrer"
              >
                <SocialIcon name={service.label} />
                <span className="visually-hidden">{service.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className={styles.clips}>
          {clips.map((video) => (
            <div key={video.youtubeId} className={styles.video}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId(video.youtubeId)}`}
                title={video.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
