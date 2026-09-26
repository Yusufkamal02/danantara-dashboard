"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TICKER_TAPE } from "@/data/market";
import { Term } from "@/components/Term";

const TABS = [
  { href: "/", label: "Ikhtisar" },
  { href: "/holdings", label: "Holdings" },
  { href: "/laporan-keuangan", label: "Laporan Keuangan" },
  { href: "/prediksi", label: "Prediksi" },
  { href: "/chat", label: "Chat AI" },
];

function fmt(n: number): string {
  return n.toLocaleString("id-ID", { minimumFractionDigits: n % 1 ? 2 : 0 });
}

function AppBar({ subtitle }: { subtitle: string }) {
  return (
    <header
      style={{
        flexShrink: 0,
        height: 44,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 12px",
        background: "var(--bg-panel-header)",
        borderBottom: "1px solid var(--border-hairline)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 1.5 18 6v8l-8 4.5L2 14V6z" fill="none" stroke="var(--accent-amber)" strokeWidth="1.4" />
          <path
            d="M10 6.2v7.6M6.6 8.1l6.8 3.8M13.4 8.1l-6.8 3.8"
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth="1.1"
          />
        </svg>
        <span
          className="mono"
          style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.14em" }}
        >
          DANANTARA
        </span>
      </span>

      <span
        className="dim"
        style={{
          fontSize: 12,
          paddingLeft: 16,
          borderLeft: "1px solid var(--border-hairline)",
          whiteSpace: "nowrap",
        }}
      >
        {subtitle}
      </span>

      <span style={{ flexGrow: 1 }} />

      <span style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
        {TICKER_TAPE.map((q) => (
          <span key={q.ticker} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
            <span className="mono dim" style={{ fontSize: 11, fontWeight: 700 }}>
              {q.ticker === "IHSG" ? <Term k="IHSG" label="IHSG" /> : q.ticker}
            </span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
              {fmt(q.price)}
            </span>
            <span
              className={`mono ${q.changePct >= 0 ? "pos" : "neg"}`}
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              {q.changePct >= 0 ? "+" : ""}
              {q.changePct.toFixed(2).replace(".", ",")}%
            </span>
          </span>
        ))}
      </span>

      <span
        className="mono"
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "var(--text-on-accent)",
          background: "var(--accent-amber)",
          padding: "2px 6px",
        }}
      >
        DATA CONTOH
      </span>
    </header>
  );
}

function CommandBand({ command, meta }: { command: string; meta: string }) {
  return (
    <div
      style={{
        flexShrink: 0,
        height: 22,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 12px",
        background: "var(--band-command)",
      }}
    >
      <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-amber)" }}>
        {command}
      </span>
      <span style={{ flexGrow: 1 }} />
      <span
        className="mono"
        style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#ffd9d9" }}
      >
        {meta}
      </span>
    </div>
  );
}

function TabStrip({ sync }: { sync: string }) {
  const pathname = usePathname();
  return (
    <nav
      style={{
        flexShrink: 0,
        height: 24,
        display: "flex",
        alignItems: "stretch",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-hairline)",
      }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              textDecoration: "none",
              color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
              background: active ? "var(--accent-amber)" : "transparent",
              borderRight: "1px solid var(--border-hairline)",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
      <span style={{ flexGrow: 1 }} />
      <span
        className="mono dim"
        style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: 10 }}
      >
        {sync}
      </span>
    </nav>
  );
}

/** Page frame shared by all five screens. */
export function Shell({
  subtitle,
  command,
  meta,
  sync = "Terakhir sinkron 16:04:22 WIB",
  children,
}: {
  subtitle: string;
  command: string;
  meta: string;
  sync?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="screen">
      <AppBar subtitle={subtitle} />
      <CommandBand command={command} meta={meta} />
      <TabStrip sync={sync} />
      {children}
    </div>
  );
}
