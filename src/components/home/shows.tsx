import { shows, videos } from "@/lib/content";
import styles from "./shows.module.css";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Amsterdam",
});

function formatDate(isoDate: string) {
  return dateFormat.format(new Date(`${isoDate}T12:00:00+02:00`));
}

function youtubeId(value: string) {
  return value.split("&")[0]?.split("?")[0] ?? "";
}

export function Shows({ today }: { today: string }) {
  const clips = videos.filter((video) => youtubeId(video.youtubeId));

  return (
    <section id="shows" className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.label}>Show dates</h2>
        <ol className={styles.list}>
          {shows.map((show) => {
            const past = show.date < today;
            return (
              <li
                key={`${show.date}-${show.city}-${show.venue}`}
                className={past ? `${styles.row} ${styles.past}` : styles.row}
              >
                <p className={styles.date}>{formatDate(show.date)}</p>
                <div>
                  <p className={styles.place}>
                    {show.city}
                    <span className={styles.venue}> — {show.venue}</span>
                  </p>
                  {show.note ? <p className={styles.note}>{show.note}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
        {clips.length > 0 ? (
          <div className={styles.footage}>
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
        ) : null}
      </div>
    </section>
  );
}
