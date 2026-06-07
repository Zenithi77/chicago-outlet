"use client";

import { useState } from "react";
import { classNames } from "@/lib/utils";

// Deterministic gradient placeholder used in place of real product photos.
function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const PALETTES: [string, string][] = [
  ["#1A1A1A", "#3A3A3A"],
  ["#C8A96E", "#8A6F3E"],
  ["#2C3E5B", "#5A7295"],
  ["#6B6B4E", "#9FAA8E"],
  ["#9A6B43", "#C9A37A"],
  ["#3A3A3A", "#6E6E6E"],
  ["#2F6B57", "#5FA68C"],
  ["#9C6B7A", "#C99FB0"],
];

export function ProductImage({
  seed,
  label,
  className,
}: {
  seed: string;
  label?: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const isUrl = /^https?:\/\//i.test(seed);

  // Real photo (e.g. fetched from a barcode lookup). Falls back to the
  // gradient placeholder if the external image fails to load.
  if (isUrl && !broken) {
    return (
      <img
        src={seed}
        alt={label ?? "Бараа"}
        loading="lazy"
        onError={() => setBroken(true)}
        className={classNames("object-cover", className)}
      />
    );
  }

  const h = hash(seed);
  const [from, to] = PALETTES[h % PALETTES.length];
  const angle = h % 180;
  const initials = (label ?? seed)
    .split(/[\s-]/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={classNames(
        "relative flex items-center justify-center overflow-hidden",
        className
      )}
      style={{ background: `linear-gradient(${angle}deg, ${from}, ${to})` }}
      role="img"
      aria-label={label ?? seed}
    >
      <span className="font-serif text-3xl font-semibold tracking-wide text-white/85">
        {initials}
      </span>
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
    </div>
  );
}
