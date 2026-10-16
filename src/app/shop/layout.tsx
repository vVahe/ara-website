import type { ReactNode } from "react";
import { connection } from "next/server";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { amsterdamYear } from "@/lib/dates";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  await connection();
  return (
    <>
      <Nav />
      {children}
      <Footer year={amsterdamYear()} />
    </>
  );
}
