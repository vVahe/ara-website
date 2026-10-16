import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { Header } from "@/components/home/header";
import { ListSignup } from "@/components/home/list-signup";
import { Release } from "@/components/home/release";
import { Shows } from "@/components/home/shows";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Header />
        <Release />
        <Shows />
        <ListSignup />
      </main>
      <Footer />
    </>
  );
}
