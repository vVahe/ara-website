import { copy } from "@/config/copy";
import { NewsletterForm } from "./newsletter-form";
import styles from "./list-signup.module.css";

export function ListSignup() {
  return (
    <section id="list" className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.label}>Newsletter</h2>
        <p className={styles.text}>{copy.newsletterLead}</p>
        <NewsletterForm />
      </div>
    </section>
  );
}
