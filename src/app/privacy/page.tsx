import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacy",
};

// LEGAL_REVIEW: starting text, not legal advice.
export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <h1>Privacy</h1>
      <p>This site has no accounts. It does not use analytics cookies.</p>
      <p>
        Newsletter signups are handled by MailerLite with double opt-in.
        Payments are handled by Mollie. An order keeps your
        name, email, address, and the item until the parcel is delivered.
      </p>
      <p>
        To ask for access or deletion, write to{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
      <p>
        <Link href="/">Back</Link>
      </p>
    </main>
  );
}
