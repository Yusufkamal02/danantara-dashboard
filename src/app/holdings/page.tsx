"use client";

import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { Panel, KpiTile, BarRow, AlertRow } from "@/components/Panel";
import { Term } from "@/components/Term";
import {
  HOLDINGS,
  SECTORS,
  SECTOR_COUNTS,
  SECTOR_BY_VALUE,
  SAVED_VIEWS,
  CONCENTRATION,
  CONCENTRATION_TOP5,
  HHI,
  PORTFOLIO_TOTALS,
  type Holding,
  type Sector,
} from "@/data/holdings";
import { FOLLOW_UPS } from "@/data/feed";

type SortKey = keyof Pick<
  Holding,
  "ticker" | "name" | "sector" | "owned" | "price" | "changePct" | "value" | "weight" | "roe" | "per" | "dividendYield"
>;

const COLUMNS: { key: SortKey; label: string; align: "left" | "right"; term?: string }[] = [
  { key: "ticker", label: "KODE", align: "left" },
  { key: "name", label: "NAMA EMITEN", align: "left" },
  { key: "sector", label: "SEKTOR", align: "left" },
  { key: "owned", label: "MILIK", align: "right" },
  { key: "price", label: "HARGA", align: "right" },
  { key: "changePct", label: "CHG", align: "right", term: "CHG" },
  { key: "value", label: "NILAI T", align: "right" },
  { key: "weight", label: "BOBOT", align: "right", term: "NAV" },
  { key: "roe", label: "ROE", align: "right", term: "ROE" },
  { key: "per", label: "PER", align: "right", term: "PER" },
  { key: "dividendYield", label: "YIELD", align: "right", term: "Dividend Yield" },
];

const num = (n: number, d = 1) => n.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2).replace(".", ",")}%`;

export default function HoldingsPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Set<Sector>>(new Set(["Perbankan", "Energi", "Infrastruktur"]));
  const [minOwned, setMinOwned] = useState(50);
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState("BBRI");
  const [savedView, setSavedView] = useState(SAVED_VIEWS[0]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = HOLDINGS.filter((h) => {
      if (active.size > 0 && !active.has(h.sector)) return false;
      if (h.owned < minOwned) return false;
      if (q && !h.ticker.toLowerCase().includes(q) && !h.name.toLowerCase().includes(q)) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      // Null PER (negative equity) always sorts last, whichever direction.
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, active, minOwned, sortKey, sortDir]);

  /** Totals reflect the rows actually on screen, not the whole portfolio. */
  const totals = useMemo(() => {
    const value = rows.reduce((s, r) => s + r.value, 0);
    const weight = rows.reduce((s, r) => s + r.weight, 0);
    const wOwned = value ? rows.reduce((s, r) => s + r.owned * r.value, 0) / value : 0;
    const wRoe = value ? rows.reduce((s, r) => s + r.roe * r.value, 0) / value : 0;
    const wChg = value ? rows.reduce((s, r) => s + r.changePct * r.value, 0) / value : 0;
    const wYield = value ? rows.reduce((s, r) => s + r.dividendYield * r.value, 0) / value : 0;
    const pers = rows.map((r) => r.per).filter((p): p is number => p !== null).sort((a, b) => a - b);
    const medianPer = pers.length ? pers[Math.floor(pers.length / 2)] : null;
    const sectors = new Set(rows.map((r) => r.sector)).size;
    return { value, weight, wOwned, wRoe, wChg, wYield, medianPer, sectors };
  }, [rows]);

  const detail = HOLDINGS.find((h) => h.ticker === selected) ?? HOLDINGS[0];

  function toggleSector(s: Sector) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function sortBy(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "ticker" || key === "name" || key === "sector" ? "asc" : "desc");
    }
  }

  const maxSector = SECTOR_BY_VALUE[0].pct;

  return (
    <Shell
      subtitle="Manajemen Kepemilikan & Portofolio"
      command=">DANANTARA HOLDINGS<GO>"
      meta={`${PORTFOLIO_TOTALS.issuers} EMITEN · ${PORTFOLIO_TOTALS.sectors} SEKTOR · NILAI POSISI Rp ${PORTFOLIO_TOTALS.nav.toLocaleString("id-ID")} T`}
      sync="Diperbarui 16:04:22 WIB · sumber IDX + XBRL"
    >
      <main className="main-grid" style={{ gridTemplateColumns: "250px minmax(0, 1fr) 300px" }}>
        {/* ---------------- filters ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <Panel title="Filter" chip={`${active.size} SEKTOR AKTIF`} style={{ height: 306 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, height: 26, padding: "0 8px", background: "var(--bg-input)", border: "1px solid var(--border-hairline)" }}>
                <span className="sr-only">Cari emiten</span>
                <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="7" cy="7" r="4.6" fill="none" stroke="var(--text-secondary)" strokeWidth="1.3" />
                  <path d="M10.6 10.6 14 14" stroke="var(--text-secondary)" strokeWidth="1.3" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari kode atau nama emiten…"
                  className="mono"
                  style={{ flexGrow: 1, minWidth: 0, background: "transparent", border: 0, outline: "none", fontSize: 10.5, color: "var(--text-primary)" }}
                />
              </label>

              <span className="mono dim" style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em" }}>
                SEKTOR
              </span>
              {SECTORS.map((s) => (
                <label key={s} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={active.has(s)}
                    onChange={() => toggleSector(s)}
                    style={{ width: 11, height: 11, accentColor: "var(--accent-amber)" }}
                  />
                  <span style={{ flexGrow: 1, fontSize: 11, color: active.has(s) ? "var(--text-primary)" : "var(--text-secondary)" }}>{s}</span>
                  <span className="mono dim" style={{ fontSize: 10 }}>
                    {SECTOR_COUNTS[s]}
                  </span>
                </label>
              ))}

              <span className="mono dim" style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em" }}>
                KEPEMILIKAN MINIMUM
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 600, width: 44 }}>
                  ≥ {minOwned}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={minOwned}
                  onChange={(e) => setMinOwned(Number(e.target.value))}
                  aria-label="Kepemilikan minimum"
                  style={{ flexGrow: 1, accentColor: "var(--accent-amber)" }}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Tampilan Tersimpan" chip={`${SAVED_VIEWS.length}`} style={{ height: 150 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {SAVED_VIEWS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSavedView(v)}
                  style={{
                    textAlign: "left",
                    padding: "5px 7px",
                    background: savedView === v ? "var(--bg-row-alt)" : "transparent",
                    borderLeft: `2px solid ${savedView === v ? "var(--accent-amber)" : "transparent"}`,
                    borderTop: 0,
                    borderRight: 0,
                    borderBottom: "1px solid var(--border-row)",
                    fontSize: 11,
                    color: savedView === v ? "var(--text-primary)" : "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Ringkasan Sektor" chip="% NILAI" style={{ flexGrow: 1, minHeight: 0 }} bodyStyle={{ padding: 10, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {SECTOR_BY_VALUE.map((s) => (
                <BarRow key={s.name} label={s.name} value={`${num(s.pct)}%`} fraction={s.pct / maxSector} color={s.color} />
              ))}
            </div>
          </Panel>
        </div>

        {/* ---------------- table ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, height: 76, flexShrink: 0 }}>
            <KpiTile label="EMITEN DITAMPILKAN" value={`${rows.length}`} delta={`dari ${HOLDINGS.length} baris`} foot={`${totals.sectors} sektor`} up={rows.length > 0} />
            <KpiTile label="NILAI POSISI" value={`Rp ${num(totals.value)} T`} delta={pct(totals.wChg)} foot="tertimbang nilai" up={totals.wChg >= 0} />
            <KpiTile label="RATA-RATA KEPEMILIKAN" value={`${num(totals.wOwned)}%`} delta={`bobot NAV ${num(totals.weight)}%`} foot="tertimbang nilai" up={totals.wOwned >= 50} />
            <KpiTile label={<Term k="Dividend Yield" label="DIVIDEND YIELD" />} value={`${num(totals.wYield)}%`} delta={`ROE ${num(totals.wRoe)}%`} foot="tertimbang nilai" up={totals.wYield >= 3} />
          </div>

          <Panel
            title="Daftar Kepemilikan Danantara"
            chip={`URUT: ${COLUMNS.find((c) => c.key === sortKey)?.label} ${sortDir === "asc" ? "↑" : "↓"}`}
            style={{ flexGrow: 1, minHeight: 0 }}
            bodyStyle={{ padding: 8, overflow: "auto", display: "flex", flexDirection: "column" }}
          >
            <table className="tbl">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      className={c.align === "left" ? "left" : undefined}
                      aria-sort={sortKey === c.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    >
                      {/* The sort control and the glossary tooltip are siblings:
                          nesting one button inside the other is invalid HTML. */}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <button
                          type="button"
                          className="th-sort"
                          data-active={sortKey === c.key}
                          onClick={() => sortBy(c.key)}
                          title={`Urutkan menurut ${c.label}`}
                        >
                          {c.label}
                          <span aria-hidden="true">{sortKey === c.key ? (sortDir === "asc" ? "▲" : "▼") : ""}</span>
                        </button>
                        {c.term && <Term k={c.term} label="ⓘ" className="th-info" />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr
                    key={h.ticker}
                    onClick={() => setSelected(h.ticker)}
                    style={{
                      cursor: "pointer",
                      outline: selected === h.ticker ? "1px solid var(--accent-amber)" : undefined,
                    }}
                  >
                    <td className="left" style={{ color: "var(--accent-amber)", fontWeight: 700, fontSize: 11 }}>
                      {h.ticker}
                    </td>
                    <td className="left truncate" style={{ fontFamily: "var(--font-sans)", fontSize: 11, width: "100%" }}>
                      {h.name}
                    </td>
                    <td className="left dim" style={{ fontFamily: "var(--font-sans)", fontSize: 10.5 }}>
                      {h.sector}
                    </td>
                    <td style={{ fontWeight: 600 }}>{num(h.owned)}%</td>
                    <td>{h.price.toLocaleString("id-ID")}</td>
                    <td className={h.changePct >= 0 ? "pos" : "neg"} style={{ fontWeight: 600 }}>
                      {pct(h.changePct)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{num(h.value)}</td>
                    <td className="dim">{num(h.weight)}%</td>
                    <td className={h.roe < 0 ? "neg" : undefined}>{num(h.roe)}%</td>
                    <td className="dim">{h.per === null ? "—" : `${num(h.per)}x`}</td>
                    <td className="dim">{num(h.dividendYield)}%</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="left dim" style={{ padding: 20, fontFamily: "var(--font-sans)", fontSize: 12 }}>
                      Tidak ada emiten yang cocok dengan filter ini. Longgarkan kepemilikan minimum atau aktifkan sektor lain.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ flexGrow: 1 }} />

            <div
              className="mono"
              style={{
                flexShrink: 0,
                display: "grid",
                gridTemplateColumns: "52px minmax(0,1fr) 96px 56px 62px 58px 68px 52px 48px 44px 52px",
                gap: 8,
                alignItems: "center",
                padding: 6,
                background: "var(--bg-panel-header)",
                borderTop: "1px solid var(--border-hairline)",
                fontSize: 10.5,
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--accent-amber)" }}>TOTAL</span>
              <span className="dim" style={{ fontFamily: "var(--font-sans)" }}>
                {rows.length} emiten ditampilkan
              </span>
              <span className="dim" style={{ fontFamily: "var(--font-sans)" }}>
                {totals.sectors} sektor
              </span>
              <span style={{ textAlign: "right", fontWeight: 600 }}>{num(totals.wOwned)}%</span>
              <span className="dim" style={{ textAlign: "right" }}>—</span>
              <span className={totals.wChg >= 0 ? "pos" : "neg"} style={{ textAlign: "right", fontWeight: 600 }}>
                {pct(totals.wChg)}
              </span>
              <span style={{ textAlign: "right", fontWeight: 600 }}>{num(totals.value)}</span>
              <span style={{ textAlign: "right", fontWeight: 600 }}>{num(totals.weight)}%</span>
              <span style={{ textAlign: "right", fontWeight: 600 }}>{num(totals.wRoe)}%</span>
              <span className="dim" style={{ textAlign: "right" }}>
                {totals.medianPer === null ? "—" : `${num(totals.medianPer)}x`}
              </span>
              <span style={{ textAlign: "right", fontWeight: 600 }}>{num(totals.wYield)}%</span>
            </div>
          </Panel>
        </div>

        {/* ---------------- detail ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <Panel title={`Detail Posisi — ${detail.ticker}`} chip="DIPILIH" style={{ height: 306 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{detail.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span className="mono" style={{ fontSize: 26, fontWeight: 600 }}>
                    {num(detail.owned)}%
                  </span>
                  <span className="dim" style={{ fontSize: 11 }}>
                    saham dimiliki
                  </span>
                </div>
              </div>

              <div style={{ height: 8, background: "var(--bg-panel-header)" }}>
                <div style={{ width: `${detail.owned}%`, height: 8, background: "var(--accent-amber)" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "9px 10px" }}>
                {[
                  ["Nilai posisi", `Rp ${num(detail.value)} T`],
                  ["Bobot NAV", `${num(detail.weight)}%`],
                  ["Harga terakhir", `Rp ${detail.price.toLocaleString("id-ID")}`],
                  ["Perubahan", pct(detail.changePct)],
                  ["ROE terkini", `${num(detail.roe)}%`],
                  ["PER", detail.per === null ? "— tidak bermakna" : `${num(detail.per)}x`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span className="dim" style={{ fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {k}
                    </span>
                    <span
                      className={`mono ${String(v).startsWith("+") ? "pos" : String(v).startsWith("-") ? "neg" : ""}`}
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              <a
                href="/laporan-keuangan"
                className="mono"
                style={{
                  alignSelf: "flex-start",
                  padding: "6px 10px",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textDecoration: "none",
                  color: "var(--text-on-accent)",
                  background: "var(--accent-amber)",
                }}
              >
                BUKA LAPORAN KEUANGAN
              </a>
            </div>
          </Panel>

          <Panel title="Konsentrasi Portofolio" chip="5 TERATAS" style={{ height: 210 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {CONCENTRATION.map((c) => (
                <BarRow key={c.ticker} label={<span className="mono">{c.ticker}</span>} value={`${num(c.pct)}%`} fraction={c.pct / CONCENTRATION[0].pct} color={c.color} />
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", background: "var(--bg-row-alt)" }}>
                <span style={{ flexGrow: 1, fontSize: 10.5 }}>5 posisi teratas menguasai {num(CONCENTRATION_TOP5)}% NAV</span>
                <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, color: "var(--accent-amber)" }}>
                  <Term k="HHI" label={`HHI ${HHI.toString().replace(".", ",")}`} />
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Tindak Lanjut" chip={`${FOLLOW_UPS.length} TERBUKA`} style={{ flexGrow: 1, minHeight: 0 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {FOLLOW_UPS.map((a) => (
                <AlertRow key={a.body} level={a.level} label={a.label}>
                  {a.body.includes("PER tidak bermakna") ? (
                    <>
                      WIKA & KRAS — ekuitas negatif, <Term k="PER" /> tidak bermakna
                    </>
                  ) : a.body.includes("RUPS") ? (
                    <>
                      <Term k="RUPS" /> ANTM 14 Okt — tentukan arah suara Danantara
                    </>
                  ) : (
                    a.body
                  )}
                </AlertRow>
              ))}
            </div>
          </Panel>
        </div>
      </main>
    </Shell>
  );
}
