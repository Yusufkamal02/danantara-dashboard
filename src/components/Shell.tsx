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
    <header className="appbar">
      <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 1.5 18 6v8l-8 4.5L2 14V6z" fill="none" stroke="var(--accent-amber)" strokeWidth="1.4" />
          <path
            d="M10 6.2v7.6M6.6 8.1l6.8 3.8M13.4 8.1l-6.8 3.8"
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth="1.1"
          />
        </svg>
        <span className="mono" style={{ fontSize: "calc(15px * var(--fs-scale))", fontWeight: 700, letterSpacing: "0.14em" }}>
          DANANTARA
        </span>
      </span>

      <span className="appbar-subtitle">{subtitle}</span>

      <span style={{ flexGrow: 1 }} />

      <span className="appbar-tape">
        {TICKER_TAPE.map((q) => (
          <span key={q.ticker} style={{ display: "flex", gap: 6, alignItems: "baseline", flexShrink: 0 }}>
            <span className="mono dim" style={{ fontSize: "calc(11px * var(--fs-scale))", fontWeight: 700 }}>
              {q.ticker === "IHSG" ? <Term k="IHSG" label="IHSG" /> : q.ticker}
            </span>
            <span className="mono" style={{ fontSize: "calc(13px * var(--fs-scale))", fontWeight: 600 }}>
              {fmt(q.price)}
            </span>
            <span className={`mono ${q.changePct >= 0 ? "pos" : "neg"}`} style={{ fontSize: "calc(11px * var(--fs-scale))", fontWeight: 600 }}>
              {q.changePct >= 0 ? "+" : ""}
              {q.changePct.toFixed(2).replace(".", ",")}%
            </span>
          </span>
        ))}
      </span>

      <span
        className="mono"
        style={{
          flexShrink: 0,
          fontSize: "calc(9px * var(--fs-scale))",
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
    <div className="cmdband">
      <span
        className="mono truncate"
        style={{ fontSize: "calc(11px * var(--fs-scale))", fontWeight: 600, color: "var(--accent-amber)" }}
      >
        {command}
      </span>
      <span style={{ flexGrow: 1 }} />
      <span
        className="mono cmdband-meta"
        style={{ fontSize: "calc(10px * var(--fs-scale))", fontWeight: 600, letterSpacing: "0.08em", color: "#ffd9d9", whiteSpace: "nowrap" }}
      >
        {meta}
      </span>
    </div>
  );
}

function TabStrip({ sync }: { sync: string }) {
  const pathname = usePathname();
  return (
    <nav className="tabstrip">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="tab"
            aria-current={active ? "page" : undefined}
            style={{
              fontWeight: active ? 600 : 500,
              color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
              background: active ? "var(--accent-amber)" : "transparent",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
      <span style={{ flexGrow: 1 }} />
      <span
        className="mono dim tabstrip-sync"
        style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: "calc(10px * var(--fs-scale))", whiteSpace: "nowrap" }}
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
