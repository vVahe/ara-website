"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { copy } from "@/config/copy";
import {
  addLine,
  readCartSnapshot,
  removeLine,
  sameCart,
  serverCartSnapshot,
  setLineQuantity,
  subscribeCart,
  writeCart,
  type CartLine,
} from "@/lib/cart";
import type { Product, ProductEdition } from "@/lib/content";
import { lineLabel, maxLineQuantity } from "@/lib/lines";
import { formatEuros } from "@/lib/money";
import { Bag } from "./bag";
import styles from "./catalog.module.css";

const placeholderBlurbs = new Set(["", "One sentence.", "One or two sentences."]);

type ResolvedLine = CartLine & { product: Product };

function resolveLines(lines: CartLine[], products: Product[]) {
  return lines.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    if (!product) return [];
    if (product.sizes.length > 0 && !product.sizes.includes(line.size)) return [];
    if (product.sizes.length === 0 && line.size !== "") return [];
    return [{ ...line, product }];
  });
}

function cartLines(lines: ResolvedLine[]): CartLine[] {
  return lines.map(({ productId, size, quantity }) => ({ productId, size, quantity }));
}

function productName(product: Product) {
  return product.edition?.title ?? lineLabel({ ...product, size: "" });
}

export function Catalog({ products }: { products: Product[] }) {
  const stored = useSyncExternalStore(subscribeCart, readCartSnapshot, serverCartSnapshot);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const visible = resolveLines(stored, products);

  useEffect(() => {
    if (visible.length === 0) setOpen(false);
  }, [visible.length]);

  function update(change: (lines: CartLine[]) => CartLine[] | "qty" | "full", openPanel = false) {
    const current = cartLines(resolveLines(readCartSnapshot(), products));
    const next = change(current);
    if (next === "full") {
      setNote(copy.bagFull);
      return "full" as const;
    }
    if (next === "qty") return "qty" as const;
    setNote("");
    writeCart(next);
    if (openPanel && next.length > 0) setOpen(true);
    return "ok" as const;
  }

  useEffect(() => {
    const next = cartLines(resolveLines(stored, products));
    if (!sameCart(stored, next)) writeCart(next);
  }, [stored, products]);

  function openProduct(product: Product) {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(product);
  }

  function closeProduct() {
    setSelected(null);
    const trigger = returnFocus.current;
    requestAnimationFrame(() => trigger?.focus());
  }

  return (
    <div className={styles.layout}>
      <div inert={selected ? true : undefined}>
        <div inert={open ? true : undefined}>
          {note ? (
            <p className={styles.note} role="status">
              {note}
            </p>
          ) : null}
          <ul className={styles.list}>
            {products.filter((product) => !product.hidden).map((product) => {
              const label = productName(product);
              return (
                <li key={product.id}>
                  <article className={styles.card}>
                    <button
                      type="button"
                      className={styles.media}
                      aria-label={label}
                      onClick={() => openProduct(product)}
                    >
                      <span className={styles.thumb}>
                        <Image src={product.image} alt="" fill sizes="(min-width: 960px) 20rem, 50vw" />
                      </span>
                    </button>
                    <h2 className={styles.title}>
                      <button type="button" className={styles.name} onClick={() => openProduct(product)}>
                        {label}
                      </button>
                    </h2>
                    <p className={styles.price}>{formatEuros(product.priceCents)}</p>
                    {product.stock <= 3 ? <p className={styles.few}>{copy.fewLeft}</p> : null}
                    <button type="button" className={styles.view} onClick={() => openProduct(product)}>
                      {copy.viewProduct}
                    </button>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
        <Bag
          lines={visible}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          onQuantity={(productId, size, quantity) =>
            update((lines) => setLineQuantity(lines, productId, size, quantity))
          }
          onRemove={(productId, size) => update((lines) => removeLine(lines, productId, size))}
        />
      </div>
      {selected ? (
        <ProductModal
          product={selected}
          lines={visible}
          onClose={closeProduct}
          onAdd={(size, quantity) => {
            const result = update((lines) => addLine(lines, selected.id, size, quantity), true);
            if (result === "ok") setSelected(null);
            return result;
          }}
        />
      ) : null}
    </div>
  );
}

function EditionNotes({ edition }: { edition: ProductEdition }) {
  let number = 0;
  return (
    <div className={styles.edition}>
      <p className={styles.editionIntro}>{edition.intro}</p>
      <p className={styles.editionBody}>{edition.body}</p>
      {edition.groups.map((group) => (
        <section key={group.label}>
          <h4 className={styles.groupLabel}>{group.label}</h4>
          <ol className={styles.tracks}>
            {group.items.map((item) => {
              number += 1;
              const label = String(number).padStart(2, "0");
              return (
                <li key={item}>
                  <span className={styles.trackNo}>{label}</span>
                  <span>{item}</span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <section>
        <h4 className={styles.groupLabel}>Details</h4>
        <ul className={styles.facts}>
          {edition.details.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ProductModal({
  product,
  lines,
  onClose,
  onAdd,
}: {
  product: Product;
  lines: ResolvedLine[];
  onClose: () => void;
  onAdd: (size: string, quantity: number) => "ok" | "qty" | "full";
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const inCart = lines.find((line) => line.productId === product.id && line.size === size)?.quantity ?? 0;
  const room = Math.max(0, maxLineQuantity - inCart);
  const description = placeholderBlurbs.has(product.description) ? "" : product.description;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (quantity > room && room > 0) setQuantity(room);
  }, [quantity, room]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>("button, select, textarea, input, a[href]")].filter(
        (node) => !node.hasAttribute("disabled"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={dialogRef}
        id="product-dialog"
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label={copy.close}>
          ×
        </button>
        <div className={styles.visual}>
          <span className={styles.cover}>
            <Image src={product.image} alt="" fill sizes="(min-width: 720px) 30rem, 100vw" />
          </span>
        </div>
        <div className={styles.details}>
          <h2 id="product-title" className={styles.modalTitle}>
            {productName(product)}
          </h2>
          <p className={styles.modalPrice}>{formatEuros(product.priceCents)}</p>
          {product.stock <= 3 ? <p className={styles.few}>{copy.fewLeft}</p> : null}
          {product.sizes.length > 0 ? (
            <label className={styles.size}>
              <span>{copy.size}</span>
              <select
                value={size}
                onChange={(event) => {
                  setSize(event.target.value);
                  setQuantity(1);
                  setNote("");
                }}
              >
                {product.sizes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className={styles.buy}>
            <label className={styles.qty}>
              <span>{copy.quantity}</span>
              <select
                value={room > 0 ? quantity : 1}
                disabled={room === 0}
                onChange={(event) => {
                  setQuantity(Number(event.target.value));
                  setNote("");
                }}
              >
                {Array.from({ length: Math.max(room, 1) }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.add}
              disabled={room === 0}
              onClick={() => {
                const result = onAdd(size, quantity);
                if (result === "full") setNote(copy.bagFull);
                if (result === "qty") setNote(copy.inBagMax);
              }}
            >
              {room === 0 ? copy.inBagMax : copy.addToCart}
            </button>
          </div>
          {note ? (
            <p className={styles.modalNote} role="status">
              {note}
            </p>
          ) : null}
          {product.edition ? (
            <EditionNotes edition={product.edition} />
          ) : description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
