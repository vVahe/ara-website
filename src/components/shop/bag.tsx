"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { copy } from "@/config/copy";
import { shippingCents, type ShipCountry } from "@/config/shipping";
import { addressErrors, addressFields, type AddressDraft, type AddressErrors, type AddressField } from "@/lib/address";
import type { CartLine } from "@/lib/cart";
import type { Product } from "@/lib/content";
import { formatKind, shipmentClass } from "@/lib/lines";
import { formatEuros } from "@/lib/money";
import styles from "./bag.module.css";

type ResolvedLine = CartLine & { product: Product };

const emptyAddress: AddressDraft = {
  name: "",
  email: "",
  street: "",
  postalCode: "",
  city: "",
};

export function Bag({
  lines,
  open,
  onOpen,
  onClose,
  onQuantity,
  onRemove,
}: {
  lines: ResolvedLine[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onQuantity: (productId: string, size: string, quantity: number) => void;
  onRemove: (productId: string, size: string) => void;
}) {
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {count > 0 && !open ? (
        <button type="button" className={styles.reopen} onClick={onOpen}>
          {copy.bag}
          <span className={styles.count}>{count}</span>
        </button>
      ) : null}
      <div
        className={open ? styles.backdropOpen : styles.backdrop}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        id="cart"
        className={open ? styles.panelOpen : styles.panel}
        role="dialog"
        aria-modal={open}
        aria-hidden={!open}
        inert={!open}
        aria-labelledby="bag-title"
      >
        <div className={styles.header}>
          <h2 id="bag-title">
            {copy.bag}
            {count > 0 ? <span className={styles.count}>{count}</span> : null}
          </h2>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
            {copy.close}
          </button>
        </div>
        {lines.length === 0 ? (
          <p className={styles.empty}>{copy.bagEmpty}</p>
        ) : (
          <ul className={styles.lines}>
            {lines.map((line) => (
              <li key={`${line.productId}:${line.size}`}>
                <p className={styles.kind}>{formatKind(line.product.kind)}</p>
                <p className={styles.title}>{line.product.title}</p>
                {line.size ? <p className={styles.meta}>{line.size}</p> : null}
                <p className={styles.meta}>{formatEuros(line.product.priceCents * line.quantity)}</p>
                <div className={styles.controls}>
                  <label className={styles.qty}>
                    <span>{copy.quantity}</span>
                    <select
                      value={line.quantity}
                      onChange={(event) => onQuantity(line.productId, line.size, Number(event.target.value))}
                    >
                      {[1, 2, 3].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => onRemove(line.productId, line.size)}
                  >
                    {copy.remove}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {lines.length > 0 ? <Checkout lines={lines} /> : null}
      </aside>
    </>
  );
}

function Checkout({ lines }: { lines: ResolvedLine[] }) {
  const [country, setCountry] = useState<ShipCountry>("NL");
  const [values, setValues] = useState<AddressDraft>(emptyAddress);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const goods = lines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);
  const postage = shippingCents(
    country,
    shipmentClass(lines.map((line) => line.product.shippingClass)),
  );
  const total = goods + postage;

  function change(field: AddressField, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (tried) setErrors(addressErrors(next));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const found = addressErrors(values);
    setTried(true);
    setErrors(found);
    const first = addressFields.find((field) => found[field]);
    if (first) {
      document.getElementById(`checkout-${first}`)?.focus();
      return;
    }

    setPending(true);
    setError("");

    const payload = {
      lines: lines.map((line) => ({
        productId: line.productId,
        size: line.size,
        quantity: line.quantity,
      })),
      ...values,
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
        fields?: AddressErrors;
      } | null;
      if (result?.fields && Object.keys(result.fields).length > 0) {
        setErrors(result.fields);
        setPending(false);
        const field = addressFields.find((item) => result.fields?.[item]);
        if (field) document.getElementById(`checkout-${field}`)?.focus();
        return;
      }
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
      <Field name="name" label={copy.name} autoComplete="name" value={values.name} error={errors.name} onChange={change} />
      <Field
        name="email"
        label={copy.email}
        type="email"
        autoComplete="email"
        value={values.email}
        error={errors.email}
        onChange={change}
      />
      <Field
        name="street"
        label={copy.street}
        autoComplete="street-address"
        value={values.street}
        error={errors.street}
        onChange={change}
      />
      <div className={styles.split}>
        <Field
          name="postalCode"
          label={copy.postalCode}
          autoComplete="postal-code"
          value={values.postalCode}
          error={errors.postalCode}
          onChange={change}
        />
        <Field
          name="city"
          label={copy.city}
          autoComplete="address-level2"
          value={values.city}
          error={errors.city}
          onChange={change}
        />
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
          {copy.items} {formatEuros(goods)}
        </span>
        <span>
          {copy.shipping} {formatEuros(postage)}
        </span>
        <span>
          {copy.total} {formatEuros(total)}
        </span>
      </p>
      <button className={styles.pay} type="submit" disabled={pending}>
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

function Field({
  name,
  label,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
}: {
  name: AddressField;
  label: string;
  value: string;
  error?: string;
  onChange: (field: AddressField, value: string) => void;
  type?: string;
  autoComplete: string;
}) {
  const id = `checkout-${name}`;
  const messageId = `${id}-error`;
  return (
    <label className={error ? styles.fieldInvalid : styles.field} htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        maxLength={name === "postalCode" ? 16 : name === "email" ? 120 : name === "name" || name === "city" ? 80 : 120}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? messageId : undefined}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {error ? (
        <span id={messageId} className={styles.fieldError}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
