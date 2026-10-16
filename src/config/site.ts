export const site = {
  artistName: "ARA",
  shortName: "ARA",
  description: "Songs, shows, and records.",
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
  email: "hello@DOMAIN",
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/ara_music" },
    {
      label: "Spotify",
      href: "https://open.spotify.com/artist/7eMq20o4L2IGNOa4AVugMr?si=y0CpR3BMQVWqy3xuDyOBTw",
    },
    { label: "YouTube", href: "https://www.youtube.com/@AraMusic27" },
  ],
};
