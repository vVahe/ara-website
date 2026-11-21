import { connection } from "next/server";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { Header } from "@/components/home/header";
import { ListSignup } from "@/components/home/list-signup";
import { Watch } from "@/components/home/watch";
import { Shows } from "@/components/home/shows";
import { amsterdamToday, amsterdamYear } from "@/lib/dates";

export default async function HomePage() {
  // Read the clock per request so passed shows follow today's date.
  await connection();
  const today = amsterdamToday();

  return (
    <>
      <Nav />
      <main>
        <Header />
        <Watch />
        <Shows today={today} />
        <ListSignup />
      </main>
      <Footer year={amsterdamYear()} />
    </>
  );
}
