"use client";

import Link from "next/link";
import { useState } from "react";

const STUBS = [
  { label: "Endless Inventory", note: "Coming soon" },
  { label: "Past Manifests", note: "Coming soon" },
  { label: "Chapter Board", note: "Coming soon" },
  { label: "Themed Packs", note: "Coming soon" },
  { label: "Pass the Manifest", note: "Coming soon" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
      <Link href="/" className="group flex items-baseline gap-2">
        <span className="display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Surplus</span>
        <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft sm:inline">
          for Pangaea
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <Link href="/play" className="btn-ghost hidden text-sm sm:inline-flex">
          Daily Shipment
        </Link>
        <button
          type="button"
          className="btn-ghost text-sm"
          aria-expanded={open}
          aria-controls="mode-menu"
          onClick={() => setOpen((v) => !v)}
        >
          Modes
        </button>
      </div>

      {open ? (
        <div
          id="mode-menu"
          className="surface absolute right-5 top-16 z-30 w-72 p-3 animate-rise"
          role="menu"
        >
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Later modes
          </p>
          <ul className="space-y-1">
            {STUBS.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-ink-soft"
                >
                  <span>{item.label}</span>
                  <span className="badge badge-warn">{item.note}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
