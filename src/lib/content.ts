import productsJson from "../../content/products.json";
import releaseJson from "../../content/release.json";
import showsJson from "../../content/shows.json";
import videosJson from "../../content/videos.json";
import type { ShippingClass } from "@/config/shipping";

export type Release = {
  title: string;
  type: string;
  date: string;
  blurb: string;
  cover: string;
  spotifyEmbedUrl: string;
  youtubeId: string;
};

export type Show = {
  date: string;
  city: string;
  venue: string;
  country: string;
  ticketUrl: string;
  soldOut: boolean;
  note?: string;
};

export type Video = {
  title: string;
  youtubeId: string;
};

export type Product = {
  id: string;
  title: string;
  kind: string;
  priceCents: number;
  currency: "EUR";
  image: string;
  description: string;
  sizes: string[];
  stock: number;
  shippingClass: ShippingClass;
};

export const release = releaseJson as Release;

export const shows = [...(showsJson as Show[])].sort((a, b) =>
  a.date.localeCompare(b.date),
);

export const videos = videosJson as Video[];

export const products = productsJson as Product[];
