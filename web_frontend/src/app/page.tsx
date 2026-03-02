"use client";

import React from "react";
import type { CompareOffer, CompareResponse } from "@/lib/api";
import { compareProducts, parseUrlsFromText } from "@/lib/api";
import {
  Badge,
  Button,
  Card,
  Drawer,
  Input,
  Textarea,
  cx,
  formatMoney,
  formatNumber,
} from "@/components/ui";

type SortKey = "price" | "shipping" | "rating" | "source" | "title";

function pickOffers(resp: CompareResponse): CompareOffer[] {
  return (resp.offers ?? []).filter(Boolean);
}

function normalizeOfferForUI(offer: CompareOffer): Required<CompareOffer> {
  return {
    source: offer.source ?? "Unknown",
    url: offer.url ?? "",
    title: offer.title ?? "Untitled offer",
    currency: offer.currency ?? "USD",
    price: offer.price ?? Number.NaN,
    shipping: offer.shipping ?? Number.NaN,
    availability: offer.availability ?? "Unknown",
    rating: offer.rating ?? Number.NaN,
    reviewCount: offer.reviewCount ?? Number.NaN,
    imageUrl: offer.imageUrl ?? "",
    lastUpdated: offer.lastUpdated ?? "",
    raw: offer.raw ?? null,
  };
}

function offerMatchesText(offer: Required<CompareOffer>, q: string) {
  const hay = `${offer.title} ${offer.source} ${offer.url} ${offer.availability}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function safeNumber(n: number) {
  return Number.isFinite(n) ? n : Infinity;
}

export default function Home() {
  const [productName, setProductName] = React.useState("");
  const [urlsText, setUrlsText] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [response, setResponse] = React.useState<CompareResponse | null>(null);

  const [filterText, setFilterText] = React.useState("");
  const [minPrice, setMinPrice] = React.useState<string>("");
  const [maxPrice, setMaxPrice] = React.useState<string>("");

  const [sortKey, setSortKey] = React.useState<SortKey>("price");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const [selected, setSelected] = React.useState<CompareOffer | null>(null);

  const urls = React.useMemo(() => parseUrlsFromText(urlsText), [urlsText]);

  const offers = React.useMemo(() => {
    const base = pickOffers(response ?? {});
    const normalized = base.map(normalizeOfferForUI);

    const q = filterText.trim();
    const min = minPrice.trim() === "" ? undefined : Number(minPrice);
    const max = maxPrice.trim() === "" ? undefined : Number(maxPrice);

    const filtered = normalized.filter((o) => {
      if (q && !offerMatchesText(o, q)) return false;
      if (min !== undefined && Number.isFinite(min) && safeNumber(o.price) < min)
        return false;
      if (max !== undefined && Number.isFinite(max) && safeNumber(o.price) > max)
        return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;

      if (sortKey === "price")
        return (safeNumber(a.price) - safeNumber(b.price)) * dir;
      if (sortKey === "shipping")
        return (safeNumber(a.shipping) - safeNumber(b.shipping)) * dir;
      if (sortKey === "rating")
        return (safeNumber(a.rating) - safeNumber(b.rating)) * dir;
      if (sortKey === "source") return a.source.localeCompare(b.source) * dir;
      return a.title.localeCompare(b.title) * dir;
    });

    return sorted;
  }, [response, filterText, minPrice, maxPrice, sortKey, sortDir]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = productName.trim();
    const parsedUrls = urls;

    if (!name && parsedUrls.length === 0) {
      setError("Enter a product name and/or at least one URL.");
      return;
    }

    setLoading(true);
    try {
      const resp = await compareProducts({
        productName: name || undefined,
        urls: parsedUrls.length ? parsedUrls : undefined,
      });
      setResponse(resp);
      setSelected(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }

  const warnings = response?.warnings ?? [];
  const showEmpty = !loading && !error && response && offers.length === 0;

  const selectedNormalized = React.useMemo(
    () => (selected ? normalizeOfferForUI(selected) : null),
    [selected],
  );

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow">
              <span className="text-sm font-black">PC</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--color-muted)]">
                Ocean Professional
              </div>
              <h1 className="text-lg font-black tracking-tight text-[var(--color-text)]">
                Price Comparison Hub
              </h1>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <a
              className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-gray-100"
              href="#"
            >
              Compare
            </a>
            <a
              className="rounded-md px-3 py-2 text-sm font-semibold text-[var(--color-muted)] hover:bg-gray-100"
              href="#"
              aria-disabled="true"
              title="Admin panel not implemented in this subtask"
              onClick={(e) => e.preventDefault()}
            >
              Admin
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
          {/* Input panel */}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-[var(--color-text)]">
                  Start a comparison
                </h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Enter a product name, paste multiple URLs, or both.
                </p>
              </div>
              <Badge tone="info">Beta UI</Badge>
            </div>

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              <Input
                label="Product name"
                placeholder="e.g. Sony WH-1000XM5"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                hint="Optional if you provide URLs."
                autoComplete="off"
              />

              <Textarea
                label="Product URLs"
                placeholder={
                  "Paste one or more URLs (separated by new lines, spaces, or commas)\nhttps://...\nhttps://..."
                }
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                hint="Optional if you provide a product name."
              />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-gray-50 px-3 py-3">
                <div className="text-sm text-[var(--color-muted)]">
                  Detected URLs:{" "}
                  <span className="font-semibold text-[var(--color-text)]">
                    {urls.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setProductName("");
                      setUrlsText("");
                      setResponse(null);
                      setError(null);
                      setSelected(null);
                    }}
                    disabled={loading}
                  >
                    Clear
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Comparing..." : "Compare prices"}
                  </Button>
                </div>
              </div>

              {error ? (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="font-bold">Request failed</div>
                  <div className="mt-1">{error}</div>
                  <div className="mt-2 text-xs text-red-700">
                    Tip: Set{" "}
                    <code className="rounded bg-white px-1 py-0.5">
                      NEXT_PUBLIC_API_BASE_URL
                    </code>{" "}
                    to your backend base URL (e.g.{" "}
                    <code className="rounded bg-white px-1 py-0.5">
                      https://...:3001
                    </code>
                    ).
                  </div>
                </div>
              ) : null}

              {warnings.length ? (
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                  <div className="font-bold">Notes</div>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </form>
          </Card>

          {/* Results panel */}
          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[var(--color-text)]">
                    Results
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Sort, filter, then open an offer for details.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs font-semibold text-[var(--color-muted)]">
                    Sort by
                    <select
                      className="ml-2 rounded-md border border-[var(--color-border)] bg-white px-2 py-2 text-sm text-[var(--color-text)]"
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                    >
                      <option value="price">Price</option>
                      <option value="shipping">Shipping</option>
                      <option value="rating">Rating</option>
                      <option value="source">Source</option>
                      <option value="title">Title</option>
                    </select>
                  </label>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                    }
                  >
                    {sortDir === "asc" ? "Asc" : "Desc"}
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    Text filter
                  </span>
                  <input
                    className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Search title/source..."
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    Min price
                  </span>
                  <input
                    className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="e.g. 50"
                    inputMode="decimal"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    Max price
                  </span>
                  <input
                    className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] shadow-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="e.g. 400"
                    inputMode="decimal"
                  />
                </label>
              </div>

              {/* States */}
              {loading ? (
                <div className="mt-5 rounded-lg border border-[var(--color-border)] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-blue-600" />
                    <div className="text-sm font-semibold text-[var(--color-text)]">
                      Loading comparison...
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-[var(--color-muted)]">
                    Scraping and normalizing offers can take a moment.
                  </div>
                </div>
              ) : null}

              {showEmpty ? (
                <div className="mt-5 rounded-lg border border-[var(--color-border)] bg-white p-4">
                  <div className="text-sm font-bold text-[var(--color-text)]">
                    No offers found
                  </div>
                  <div className="mt-1 text-sm text-[var(--color-muted)]">
                    Try a different query, or paste URLs from multiple sites.
                  </div>
                </div>
              ) : null}

              {/* Results list */}
              {!loading && offers.length ? (
                <div className="mt-5 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
                  <div className="grid grid-cols-[1fr_110px_110px_110px] gap-3 border-b border-[var(--color-border)] bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                    <div>Offer</div>
                    <div className="text-right">Price</div>
                    <div className="text-right">Shipping</div>
                    <div className="text-right">Rating</div>
                  </div>

                  <ul className="divide-y divide-[var(--color-border)]">
                    {offers.map((o, idx) => (
                      <li key={`${o.url}-${idx}`}>
                        <button
                          className={cx(
                            "grid w-full grid-cols-[1fr_110px_110px_110px] gap-3 px-4 py-4 text-left transition hover:bg-blue-50/50",
                          )}
                          onClick={() => setSelected(o)}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-sm font-extrabold text-[var(--color-text)]">
                                {o.title || "Untitled offer"}
                              </div>
                              <Badge tone="neutral">{o.source || "Source"}</Badge>
                            </div>
                            <div className="mt-1 truncate text-xs text-[var(--color-muted)]">
                              {o.url || "—"}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge
                                tone={
                                  (o.availability || "")
                                    .toLowerCase()
                                    .includes("in stock")
                                    ? "success"
                                    : "neutral"
                                }
                              >
                                {o.availability || "Unknown"}
                              </Badge>
                              {o.lastUpdated ? (
                                <Badge tone="info">Updated {o.lastUpdated}</Badge>
                              ) : null}
                            </div>
                          </div>

                          <div className="text-right text-sm font-black text-[var(--color-text)]">
                            {formatMoney(o.price, o.currency)}
                          </div>
                          <div className="text-right text-sm font-semibold text-[var(--color-text)]">
                            {formatMoney(o.shipping, o.currency)}
                          </div>
                          <div className="text-right text-sm font-semibold text-[var(--color-text)]">
                            {Number.isFinite(o.rating) ? o.rating.toFixed(1) : "—"}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!loading && offers.length ? (
                <div className="mt-3 text-xs text-[var(--color-muted)]">
                  Showing{" "}
                  <span className="font-semibold text-[var(--color-text)]">
                    {offers.length}
                  </span>{" "}
                  offer(s).
                </div>
              ) : null}
            </Card>

            <footer className="pb-4 text-center text-xs text-[var(--color-muted)]">
              Backend API:{" "}
              <code className="rounded bg-white px-1 py-0.5">
                {process.env.NEXT_PUBLIC_API_BASE_URL || "/api"}
              </code>{" "}
              · UI states: loading / error / empty supported
            </footer>
          </div>
        </div>
      </div>

      <Drawer
        open={selectedNormalized !== null}
        title={selectedNormalized?.title || "Offer details"}
        onClose={() => setSelected(null)}
      >
        {selectedNormalized ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{selectedNormalized.source}</Badge>
              <Badge
                tone={
                  selectedNormalized.availability
                    .toLowerCase()
                    .includes("in stock")
                    ? "success"
                    : "neutral"
                }
              >
                {selectedNormalized.availability}
              </Badge>
              {selectedNormalized.lastUpdated ? (
                <Badge tone="info">Updated {selectedNormalized.lastUpdated}</Badge>
              ) : null}
            </div>

            <Card className="p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                    Price
                  </div>
                  <div className="mt-1 text-lg font-black text-[var(--color-text)]">
                    {formatMoney(
                      selectedNormalized.price,
                      selectedNormalized.currency,
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                    Shipping
                  </div>
                  <div className="mt-1 text-lg font-black text-[var(--color-text)]">
                    {formatMoney(
                      selectedNormalized.shipping,
                      selectedNormalized.currency,
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                    Rating
                  </div>
                  <div className="mt-1 text-lg font-black text-[var(--color-text)]">
                    {Number.isFinite(selectedNormalized.rating)
                      ? `${selectedNormalized.rating.toFixed(1)} / 5`
                      : "—"}
                    {Number.isFinite(selectedNormalized.reviewCount) ? (
                      <span className="ml-2 text-sm font-semibold text-[var(--color-muted)]">
                        ({formatNumber(selectedNormalized.reviewCount)} reviews)
                      </span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                    Currency
                  </div>
                  <div className="mt-1 text-lg font-black text-[var(--color-text)]">
                    {selectedNormalized.currency}
                  </div>
                </div>
              </div>

              {selectedNormalized.url ? (
                <div className="mt-4">
                  <a
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
                    href={selectedNormalized.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open offer
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              ) : null}
            </Card>

            <details className="rounded-lg border border-[var(--color-border)] bg-white p-4">
              <summary className="cursor-pointer text-sm font-bold text-[var(--color-text)]">
                Raw payload
              </summary>
              <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs text-[var(--color-text)]">
{JSON.stringify(selectedNormalized.raw ?? selectedNormalized, null, 2)}
              </pre>
            </details>
          </div>
        ) : null}
      </Drawer>
    </main>
  );
}
