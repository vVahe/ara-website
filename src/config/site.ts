const spotifyHref =
  "https://open.spotify.com/artist/7eMq20o4L2IGNOa4AVugMr?si=y0CpR3BMQVWqy3xuDyOBTw";
const appleMusicHref = "https://music.apple.com/us/artist/ara/1748334331";

export const site = {
  artistName: "ARA",
  shortName: "ARA",
  description: "Songs, shows, and records.",
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
  email: "hello@DOMAIN",
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/ara_music" },
    { label: "Spotify", href: spotifyHref },
    { label: "Apple Music", href: appleMusicHref },
    { label: "YouTube", href: "https://www.youtube.com/@AraMusic27" },
  ],
  listen: [
    { label: "Spotify", href: spotifyHref },
    { label: "Apple Music", href: appleMusicHref },
    { label: "YouTube Music", href: "https://music.youtube.com/@AraMusic27" },
  ],
};
