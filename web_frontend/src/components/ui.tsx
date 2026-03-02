"use client";

import React from "react";

export function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export function formatMoney(
  value: number | undefined,
  currency: string | undefined,
): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  const cur = currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${cur}`;
  }
}

export function formatNumber(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(undefined).format(value);
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "error" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : tone === "info"
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-gray-200 bg-white text-gray-700";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "secondary"
      ? "border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-gray-50"
      : variant === "ghost"
        ? "text-[var(--color-text)] hover:bg-gray-100"
        : "bg-[var(--color-primary)] text-white hover:bg-blue-700";
  return (
    <button className={cx(base, styles)} {...props}>
      {children}
    </button>
  );
}

export function Input({
  label,
  hint,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--color-text)]">
        {label}
      </span>
      {hint ? (
        <div className="mt-1 text-xs text-[var(--color-muted)]">{hint}</div>
      ) : null}
      <input
        className={cx(
          "mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm text-[var(--color-text)] shadow-sm outline-none transition",
          "border-[var(--color-border)] focus:border-blue-300 focus:ring-4 focus:ring-blue-100",
          error ? "border-red-300 focus:border-red-300 focus:ring-red-100" : "",
        )}
        {...props}
      />
      {error ? <div className="mt-1 text-xs text-red-700">{error}</div> : null}
    </label>
  );
}

export function Textarea({
  label,
  hint,
  error,
  rows = 5,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--color-text)]">
        {label}
      </span>
      {hint ? (
        <div className="mt-1 text-xs text-[var(--color-muted)]">{hint}</div>
      ) : null}
      <textarea
        rows={rows}
        className={cx(
          "mt-2 w-full resize-y rounded-md border bg-white px-3 py-2 text-sm text-[var(--color-text)] shadow-sm outline-none transition",
          "border-[var(--color-border)] focus:border-blue-300 focus:ring-4 focus:ring-blue-100",
          error ? "border-red-300 focus:border-red-300 focus:ring-red-100" : "",
        )}
        {...props}
      />
      {error ? <div className="mt-1 text-xs text-red-700">{error}</div> : null}
    </label>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        className="absolute inset-0 bg-black/30"
        aria-label="Close details"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-auto bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--color-border)] bg-white px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-[var(--color-muted)]">
              Details
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              {title}
            </h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
