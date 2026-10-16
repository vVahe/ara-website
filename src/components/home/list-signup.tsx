import styles from "./list-signup.module.css";

export function ListSignup() {
  return (
    <section id="list" className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.label}>Newsletter</h2>
        <p className={styles.text}>Signup opens later. Shows and songs, nothing else.</p>
      </div>
    </section>
  );
}
