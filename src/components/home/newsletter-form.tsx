"use client";

import { useState, type FormEvent } from "react";
import { copy } from "@/config/copy";
import styles from "./list-signup.module.css";

const ACTION =
  "https://assets.mailerlite.com/jsonp/2720408/forms/201589724682389236/subscribe";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterForm() {
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("fields[name]") ?? "").trim();
    const email = String(data.get("fields[email]") ?? "").trim();
    const nextNameError = name ? "" : copy.newsletterNameError;
    const nextEmailError = !email
      ? copy.newsletterEmailMissing
      : EMAIL.test(email)
        ? ""
        : copy.newsletterEmailError;
    setNameError(nextNameError);
    setEmailError(nextEmailError);
    if (nextNameError || nextEmailError) {
      setFormError(false);
      const invalidId = nextNameError ? "newsletter-name" : "newsletter-email";
      form.querySelector<HTMLElement>(`#${invalidId}`)?.focus();
      return;
    }

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
        setEmailError(copy.newsletterEmailError);
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
      <div className={`${styles.field} ${nameError ? styles.invalid : ""}`}>
        <label htmlFor="newsletter-name">{copy.newsletterName}</label>
        <input
          id="newsletter-name"
          aria-required="true"
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "newsletter-name-error" : undefined}
          type="text"
          name="fields[name]"
          autoComplete="given-name"
          onChange={(event) => {
            if (nameError && event.target.value.trim()) setNameError("");
          }}
        />
        {nameError ? (
          <p id="newsletter-name-error" className={styles.fieldError} role="alert">
            {nameError}
          </p>
        ) : null}
      </div>
      <div className={`${styles.field} ${emailError ? styles.invalid : ""}`}>
        <label htmlFor="newsletter-email">{copy.newsletterEmail}</label>
        <input
          id="newsletter-email"
          aria-required="true"
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "newsletter-email-error" : undefined}
          type="email"
          name="fields[email]"
          autoComplete="email"
          onChange={(event) => {
            if (emailError && EMAIL.test(event.target.value.trim())) setEmailError("");
          }}
        />
        {emailError ? (
          <p id="newsletter-email-error" className={styles.fieldError} role="alert">
            {emailError}
          </p>
        ) : null}
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
