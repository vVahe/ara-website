"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { copy } from "@/config/copy";
import styles from "./list-signup.module.css";

const SUCCESS = "ml_webform_success_47263736";

export function NewsletterForm() {
  const formRow = useRef<HTMLDivElement>(null);
  const successRow = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const showSuccess = () => {
      if (formRow.current) formRow.current.style.display = "none";
      if (successRow.current) successRow.current.hidden = false;
    };
    const holder = window as unknown as Record<string, unknown>;
    holder[SUCCESS] = showSuccess;
    return () => {
      if (holder[SUCCESS] === showSuccess) delete holder[SUCCESS];
    };
  }, []);

  return (
    <>
      <div
        id="mlb2-47263736"
        className={`ml-subscribe-form ml-subscribe-form-47263736 ${styles.embed}`}
      >
        <div ref={formRow} className="row-form">
          <form
            className={`ml-block-form ${styles.form}`}
            action="https://assets.mailerlite.com/jsonp/2720408/forms/201589724682389236/subscribe"
            method="post"
            target="_blank"
          >
            <div className={`${styles.field} ml-field-group ml-field-name`}>
              <label htmlFor="newsletter-name">{copy.newsletterName}</label>
              <input
                id="newsletter-name"
                aria-label="name"
                type="text"
                name="fields[name]"
                autoComplete="given-name"
              />
            </div>
            <div
              className={`${styles.field} ml-field-group ml-field-email ml-validate-email ml-validate-required`}
            >
              <label htmlFor="newsletter-email">{copy.newsletterEmail}</label>
              <input
                id="newsletter-email"
                aria-label="email"
                aria-required="true"
                aria-describedby="newsletter-email-error"
                type="email"
                name="fields[email]"
                autoComplete="email"
              />
              <p id="newsletter-email-error" className={styles.fieldError} role="alert">
                {copy.newsletterEmailError}
              </p>
            </div>
            <input type="hidden" name="ml-submit" value="1" />
            <input type="hidden" name="anticsrf" value="true" />
            <div className={styles.submit}>
              <button type="submit" className={`primary ${styles.join}`}>
                {copy.newsletterJoin}
              </button>
              <button
                disabled
                type="button"
                className={`loading ${styles.loading}`}
                style={{ display: "none" }}
              >
                <span className={styles.spinner} aria-hidden="true" />
                <span className="visually-hidden">{copy.newsletterLoading}</span>
              </button>
            </div>
          </form>
        </div>
        <p ref={successRow} className={`row-success ${styles.success}`} hidden>
          {copy.newsletterThanks}
        </p>
      </div>
      <Script
        src="https://groot.mailerlite.com/js/w/webforms.min.js?v83147fa8ce2d95cb73ece7f28b469519"
        strategy="afterInteractive"
      />
    </>
  );
}
