"use client";

import { useState, type FormEvent } from "react";
import { copy } from "@/config/copy";
import styles from "./list-signup.module.css";

const ACTION =
  "https://assets.mailerlite.com/jsonp/2720408/forms/201589724682389236/subscribe";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm() {
  const [emailError, setEmailError] = useState(false);
  const [formError, setFormError] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("fields[name]") ?? "").trim();
    const email = String(data.get("fields[email]") ?? "").trim();
    if (!EMAIL.test(email)) {
      setEmailError(true);
      setFormError(false);
      return;
    }

    setEmailError(false);
    setFormError(false);
    setPending(true);
    try {
      const body = new URLSearchParams();
      body.set("fields[name]", name);
      body.set("fields[email]", email);
      body.set("ml-submit", "1");
      body.set("anticsrf", "true");
      body.set("ajax", "1");
      const response = await fetch(ACTION, {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      const payload = (await response.json()) as {
        success?: boolean;
        errors?: { fields?: { email?: string[] } };
      };
      if (payload.success) {
        setDone(true);
        return;
      }
      if (payload.errors?.fields?.email?.length) {
        setEmailError(true);
        return;
      }
      setFormError(true);
    } catch {
      setFormError(true);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return <p className={styles.success}>{copy.newsletterThanks}</p>;
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="newsletter-name">{copy.newsletterName}</label>
        <input id="newsletter-name" type="text" name="fields[name]" autoComplete="given-name" />
      </div>
      <div className={`${styles.field} ${emailError ? styles.invalid : ""}`}>
        <label htmlFor="newsletter-email">{copy.newsletterEmail}</label>
        <input
          id="newsletter-email"
          aria-required="true"
          aria-invalid={emailError}
          aria-describedby="newsletter-email-error"
          type="email"
          name="fields[email]"
          autoComplete="email"
        />
        <p id="newsletter-email-error" className={styles.fieldError} role="alert">
          {copy.newsletterEmailError}
        </p>
      </div>
      <div className={styles.submit}>
        <button type="submit" className={styles.join} disabled={pending}>
          {pending ? copy.newsletterLoading : copy.newsletterJoin}
        </button>
      </div>
      {formError ? (
        <p className={styles.formError} role="alert">
          {copy.newsletterError}
        </p>
      ) : null}
    </form>
  );
}
