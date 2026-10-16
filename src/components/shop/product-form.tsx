"use client";

import { useState, type FormEvent } from "react";
import { copy } from "@/config/copy";
import { shippingCents, type ShipCountry } from "@/config/shipping";
import type { Product } from "@/lib/content";
import { formatEuros } from "@/lib/money";
import styles from "./product-form.module.css";

export function ProductForm({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [country, setCountry] = useState<ShipCountry>("NL");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const postage = shippingCents(country, product.shippingClass);
  const total = product.priceCents * quantity + postage;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      productId: product.id,
      size: product.sizes.length > 0 ? size : "",
      quantity,
      name: form.get("name"),
      email: form.get("email"),
      street: form.get("street"),
      postalCode: form.get("postalCode"),
      city: form.get("city"),
      country,
    };

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as {
        checkoutUrl?: string;
        error?: string;
      } | null;
      if (!response.ok || !result?.checkoutUrl) {
        setError(result?.error || copy.checkoutError);
        setPending(false);
        return;
      }
      window.location.href = result.checkoutUrl;
    } catch {
      setError(copy.checkoutError);
      setPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {product.sizes.length > 0 ? (
        <label className={styles.field}>
          <span>{copy.size}</span>
          <select name="size" value={size} onChange={(event) => setSize(event.target.value)} required>
            {product.sizes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className={styles.field}>
        <span>{copy.quantity}</span>
        <select
          name="quantity"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        >
          {[1, 2, 3].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>{copy.name}</span>
        <input name="name" autoComplete="name" required maxLength={80} />
      </label>
      <label className={styles.field}>
        <span>{copy.email}</span>
        <input name="email" type="email" autoComplete="email" required maxLength={120} />
      </label>
      <label className={styles.field}>
        <span>{copy.street}</span>
        <input name="street" autoComplete="street-address" required maxLength={120} />
      </label>
      <div className={styles.split}>
        <label className={styles.field}>
          <span>{copy.postalCode}</span>
          <input name="postalCode" autoComplete="postal-code" required maxLength={16} />
        </label>
        <label className={styles.field}>
          <span>{copy.city}</span>
          <input name="city" autoComplete="address-level2" required maxLength={80} />
        </label>
      </div>
      <label className={styles.field}>
        <span>{copy.country}</span>
        <select
          name="country"
          value={country}
          onChange={(event) => setCountry(event.target.value as ShipCountry)}
        >
          {copy.countries.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className={styles.totals}>
        <span>
          {copy.shipping} {formatEuros(postage)}
        </span>
        <span>
          {copy.total} {formatEuros(total)}
        </span>
      </p>

      <button
        className={styles.pay}
        type="submit"
        disabled={pending}
        aria-describedby={error ? "checkout-error" : undefined}
      >
        {pending ? copy.paying : copy.pay}
      </button>
      {error ? (
        <p id="checkout-error" className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
