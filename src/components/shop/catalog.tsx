"use client";

import { useState } from "react";
import Image from "next/image";
import { copy } from "@/config/copy";
import type { Product } from "@/lib/content";
import { formatEuros } from "@/lib/money";
import { ProductForm } from "./product-form";
import styles from "./catalog.module.css";

const placeholderBlurbs = new Set(["", "One sentence.", "One or two sentences."]);

export function Catalog({ products }: { products: Product[] }) {
  const [selectedId, setSelectedId] = useState(products.length === 1 ? products[0].id : "");
  const selected = products.find((product) => product.id === selectedId) ?? null;

  return (
    <div className={styles.catalog}>
      <ul className={styles.list}>
        {products.map((product) => {
          const selectedCard = product.id === selectedId;
          return (
            <li key={product.id}>
              <button
                type="button"
                className={selectedCard ? styles.cardSelected : styles.card}
                aria-pressed={selectedCard}
                onClick={() => setSelectedId(product.id)}
              >
                <Image
                  src={product.image}
                  alt=""
                  width={96}
                  height={96}
                  className={styles.image}
                />
                <span>
                  <span className={styles.title}>{product.title}</span>
                  <span className={styles.price}>{formatEuros(product.priceCents)}</span>
                  {product.stock <= 3 ? <span className={styles.few}>{copy.fewLeft}</span> : null}
                  {placeholderBlurbs.has(product.description) ? null : (
                    <span className={styles.description}>{product.description}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {selected ? <ProductForm key={selected.id} product={selected} /> : null}
    </div>
  );
}
