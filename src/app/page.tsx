"use client";

import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { Panel, KpiTile, BarRow, AlertRow, Treemap } from "@/components/Panel";
import { Term } from "@/components/Term";
import { PricePanel } from "@/components/charts/PricePanel";
import { YoYArea, Donut } from "@/components/charts/MiniCharts";
import { YOY_GROWTH, HIMBARA_SHARE, REVENUE_SEGMENTS } from "@/data/market";
import {
  SECTOR_ALLOCATION,
  HOLDINGS,
  PORTFOLIO_TOTALS,
  FILTER_GROUPS,
  IHSG_RETURN_YTD,
  inGroup,
} from "@/data/holdings";
import { NEWS, CALENDAR, RISK_ALERTS } from "@/data/feed";

const num1 = (n: number) => n.toFixed(1).replace(".", ",");
const signed1 = (n: number) => `${n >= 0 ? "+" : ""}${num1(n)}`;

/** Treemap layout: the two big groups on top, the three smaller below. */
const TREEMAP_ROWS = [
  [
    { ...FILTER_GROUPS[0], flex: 6 },
    { ...FILTER_GROUPS[1], flex: 4 },
  ],
  FILTER_GROUPS.slice(2).map((g) => ({ ...g, flex: 1 })),
].map((row) => row.map((g) => ({ name: g.key, pct: g.pct, color: g.color, flex: g.flex })));

export default function IkhtisarPage() {
  const [selected, setSelected] = useState<string[]>([]);

  const filtering = selected.length > 0;

  const view = useMemo(() => {
    const groups = FILTER_GROUPS.filter((g) => selected.includes(g.key));
    const filtering = groups.length > 0;
    const matches = (ticker: string) => {
      const h = HOLDINGS.find((x) => x.ticker === ticker);
      return !!h && groups.some((g) => inGroup(g, h));
    };
    const holdings = filtering ? HOLDINGS.filter((h) => matches(h.ticker)) : HOLDINGS;

    // Stated portfolio totals when unfiltered; otherwise the selected groups
    // weighted by market cap.
    const cap = groups.reduce((s, g) => s + g.marketCap, 0);
    const w = (pick: (g: (typeof groups)[number]) => number) => groups.reduce((s, g) => s + pick(g) * g.marketCap, 0) / cap;
    const kpi = filtering
      ? {
          marketCap: cap,
          marketCapMoM: w((g) => g.marketCapMoM),
          returnYtd: w((g) => g.returnYtd),
          dividendYield: w((g) => g.dividendYield),
          dividendYieldYoY: w((g) => g.dividendYieldYoY),
          weightedRoe: w((g) => g.weightedRoe),
          weightedRoeQoQ: w((g) => g.weightedRoeQoQ),
          issuers: groups.reduce((s, g) => s + g.issuers, 0),
        }
      : {
          marketCap: PORTFOLIO_TOTALS.marketCap,
          marketCapMoM: 2.4,
          returnYtd: PORTFOLIO_TOTALS.returnYtd,
          dividendYield: PORTFOLIO_TOTALS.dividendYield,
          dividendYieldYoY: 0.3,
          weightedRoe: PORTFOLIO_TOTALS.weightedRoe,
          weightedRoeQoQ: -0.7,
          issuers: PORTFOLIO_TOTALS.issuers,
        };

    return {
      holdings,
      top: holdings.slice(0, 10),
      // The chart follows the largest position inside the filter.
      lead: holdings[0] ?? HOLDINGS[0],
      news: filtering ? NEWS.filter((n) => n.ticker === "MAKRO" || matches(n.ticker)) : NEWS,
      calendar: filtering ? CALENDAR.filter((c) => matches(c.ticker)) : CALENDAR,
      alerts: filtering ? RISK_ALERTS.filter((a) => a.tickers?.some(matches)) : RISK_ALERTS.slice(0, 4),
      allocation: new Set(groups.map((g) => g.allocationName)),
      kpi,
    };
  }, [selected]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      // Everything selected is the same as no filter.
      return next.length === FILTER_GROUPS.length ? [] : next;
    });
  }

  const maxSector = SECTOR_ALLOCATION[0].pct;
  const { kpi } = view;
  const scope = filtering ? `${kpi.issuers} emiten · ${selected.join(" + ")}` : `agregat ${PORTFOLIO_TOTALS.issuers} emiten`;

  return (
    <Shell
      subtitle="Portfolio Analytics Terminal"
      meta={`IKHTISAR PORTOFOLIO · ${filtering ? `FILTER: ${selected.join(" + ").toUpperCase()} · ` : ""}${kpi.issuers} EMITEN · NAV Rp ${PORTFOLIO_TOTALS.nav.toLocaleString("id-ID")} T`}
    >
      <main
        className="main-grid"
        style={{ "--col-left": "250px", "--col-right": "274px" } as React.CSSProperties}
      >
        {/* ---------------- left ---------------- */}
        <div className="col col-left">
          <Panel
            title="Filter Global"
            chip={filtering ? `${selected.length} DIPILIH` : "KLIK UNTUK FILTER"}
            extra={
              filtering && (
                <button type="button" className="chat-pop-btn mono" onClick={() => setSelected([])} title="Tampilkan seluruh portofolio">
                  SEMUA
                </button>
              )
            }
            className="panel-chart"
            style={{ height: 150 }}
            bodyStyle={{ padding: 8 }}
          >
            <Treemap rows={TREEMAP_ROWS} selected={selected} onToggle={toggle} />
          </Panel>

          <Panel title="Alokasi Sektor" chip={<Term k="NAV" label="% NAV" />} style={{ height: 250 }} bodyStyle={{ overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {SECTOR_ALLOCATION.map((s) => (
                <div key={s.name} style={{ opacity: filtering && !view.allocation.has(s.name) ? 0.35 : 1 }}>
                  <BarRow label={s.name} value={`${s.pct.toFixed(1).replace(".", ",")}%`} fraction={s.pct / maxSector} color={s.color} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Top Holdings"
            chip={filtering ? `${view.top.length} DARI ${view.holdings.length} SAMPEL` : `${PORTFOLIO_TOTALS.issuers} EMITEN`}
            className="panel-grow"
            bodyStyle={{ padding: 8, overflow: "auto" }}
          >
            <table className="tbl">
              <thead>
                <tr>
                  <th className="left">KODE</th>
                  <th className="left">EMITEN</th>
                  <th>
                    <Term k="CHG" label="CHG" />
                  </th>
                  <th>NILAI T</th>
                </tr>
              </thead>
              <tbody>
                {view.top.map((h) => (
                  <tr key={h.ticker}>
                    <td className="left" style={{ color: "var(--accent-amber)", fontWeight: 700, fontSize: "calc(11px * var(--fs-scale))" }}>
                      {h.ticker}
                    </td>
                    <td className="left truncate" style={{ fontFamily: "var(--font-sans)", fontSize: "calc(11px * var(--fs-scale))", width: "100%" }}>
                      {h.name}
                    </td>
                    <td className={h.changePct >= 0 ? "pos" : "neg"} style={{ fontWeight: 600 }}>
                      {h.changePct >= 0 ? "+" : ""}
                      {h.changePct.toFixed(2).replace(".", ",")}%
                    </td>
                    <td>{h.value.toLocaleString("id-ID", { minimumFractionDigits: 1 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* ---------------- centre ---------------- */}
        <div className="col col-main">
          <div className="tile-row">
            <KpiTile
              label={<Term k="Market Cap" label="MARKET CAP" />}
              value={`Rp ${kpi.marketCap.toLocaleString("id-ID")} T`}
              delta={`${signed1(kpi.marketCapMoM)}% MoM`}
              foot={scope}
              up={kpi.marketCapMoM >= 0}
            />
            <KpiTile
              label={<Term k="YTD" label="RETURN YTD" />}
              value={`${signed1(kpi.returnYtd)}%`}
              delta={`${signed1(kpi.returnYtd - IHSG_RETURN_YTD)} pp vs IHSG`}
              foot={<Term k="TWR" label="TWR, net dividen" />}
              up={kpi.returnYtd >= IHSG_RETURN_YTD}
            />
            <KpiTile
              label={<Term k="Dividend Yield" label="DIVIDEND YIELD" />}
              value={`${num1(kpi.dividendYield)}%`}
              delta={`${signed1(kpi.dividendYieldYoY)} pp YoY`}
              foot="dividen 12 bulan / harga"
              up={kpi.dividendYieldYoY >= 0}
            />
            <KpiTile
              label={<Term k="Weighted ROE" label="ROE TERTIMBANG" />}
              value={`${num1(kpi.weightedRoe)}%`}
              delta={`${signed1(kpi.weightedRoeQoQ)} pp QoQ`}
              foot={filtering ? scope : "42 emiten portofolio"}
              up={kpi.weightedRoeQoQ >= 0}
            />
          </div>

          <div className="chart-slot">
            <PricePanel
              key={view.lead.ticker}
              ticker={view.lead.ticker}
              name={view.lead.name}
              price={view.lead.price}
              changePct={view.lead.changePct}
            />
          </div>

          <div className="split-row">
            <Panel
              title="Berita & Sentimen Langsung"
              chip="AUTO-REFRESH 30s"
              style={{ flexGrow: 1, minWidth: 0 }}
              bodyStyle={{ padding: 8, overflow: "auto" }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                {view.news.map((n) => (
                  <div
                    key={n.time}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "42px 54px minmax(0, 1fr)",
                      gap: 8,
                      alignItems: "baseline",
                      padding: "4px 0",
                      borderBottom: "1px solid var(--border-row)",
                    }}
                  >
                    <span className="mono dim" style={{ fontSize: "calc(10px * var(--fs-scale))" }}>
                      {n.time}
                    </span>
                    <span
                      className={`mono ${n.tone === "up" ? "pos" : n.tone === "down" ? "neg" : "dim"}`}
                      style={{ fontSize: "calc(10px * var(--fs-scale))", fontWeight: 700 }}
                    >
                      {n.ticker}
                    </span>
                    <span className="truncate" style={{ fontSize: "calc(11.5px * var(--fs-scale))", width: "100%" }}>
                      {n.headline}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Kalender Korporasi" chip={filtering ? `${view.calendar.length} AGENDA` : "OKT 2026"} style={{ width: 300, flexShrink: 0 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {view.calendar.length === 0 && <EmptyNote>Tidak ada agenda untuk filter ini.</EmptyNote>}
                {view.calendar.map((c) => (
                  <div
                    key={c.date + c.ticker}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "baseline",
                      padding: "4px 0",
                      borderBottom: "1px solid var(--border-row)",
                    }}
                  >
                    <span className="mono" style={{ width: 44, flexShrink: 0, fontSize: "calc(10px * var(--fs-scale))", fontWeight: 600, color: "var(--accent-amber)" }}>
                      {c.date}
                    </span>
                    <span className="mono dim" style={{ width: 42, flexShrink: 0, fontSize: "calc(10px * var(--fs-scale))", fontWeight: 700 }}>
                      {c.ticker}
                    </span>
                    <span className="truncate" style={{ fontSize: "calc(11px * var(--fs-scale))", width: "100%" }}>
                      {c.event.includes("RUPS") ? <Term k="RUPS" label={c.event} /> : c.event.includes("Cum date") ? <Term k="Cum Date" label={c.event} /> : c.event}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* ---------------- right ---------------- */}
        <div className="col col-right">
          <Panel title="Pendapatan per Segmen" chip="BBRI · 9M-26" className="panel-chart" style={{ height: 170 }} bodyStyle={{ padding: 8 }}>
            <Treemap
              labelSize={9}
              rows={[
                [
                  { name: "Mikro", pct: REVENUE_SEGMENTS[0].pct, color: REVENUE_SEGMENTS[0].color, flex: 58 },
                  { name: "Korporasi", pct: REVENUE_SEGMENTS[1].pct, color: REVENUE_SEGMENTS[1].color, flex: 42 },
                ],
                [
                  { name: "Konsumer", pct: REVENUE_SEGMENTS[2].pct, color: REVENUE_SEGMENTS[2].color, flex: 1 },
                  { name: "Treasury", pct: REVENUE_SEGMENTS[3].pct, color: REVENUE_SEGMENTS[3].color, flex: 1 },
                  { name: "Fee", pct: REVENUE_SEGMENTS[4].pct, color: REVENUE_SEGMENTS[4].color, flex: 1 },
                ],
              ]}
            />
          </Panel>

          <Panel title={<><Term k="Himbara" label="Pangsa Kredit Himbara" /></>} chip="Q3-2026" style={{ height: 210 }}>
            <Donut slices={HIMBARA_SHARE} centre="Rp 7,1 rb T" caption="total kredit" unit=" T" />
          </Panel>

          <Panel title="Pertumbuhan Pendapatan YoY" chip={<Term k="YoY" label="AGREGAT" />} className="panel-chart" style={{ height: 150 }} bodyStyle={{ padding: 8 }}>
            <YoYArea data={YOY_GROWTH} />
          </Panel>

          <Panel
            title="Peringatan Risiko"
            chip={`${view.alerts.length} AKTIF`}
            className="panel-grow"
            bodyStyle={{ padding: 8, overflow: "auto" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {view.alerts.length === 0 && <EmptyNote>Tidak ada peringatan aktif untuk filter ini.</EmptyNote>}
              {view.alerts.map((a) => (
                <AlertRow key={a.body} level={a.level} label={a.label}>
                  {a.body.includes("DER") ? (
                    <>
                      PGAS — rasio <Term k="DER" /> 1,42x mendekati batas 1,50x
                    </>
                  ) : a.body.includes("NPL") ? (
                    <>
                      BBTN — <Term k="NPL Gross" label="NPL gross" /> naik ke 3,4% (+0,4 <Term k="pp" /> QoQ)
                    </>
                  ) : a.body.includes("kovenan") ? (
                    <>
                      SMGR — margin EBITDA turun 3,1 <Term k="pp" /> QoQ, di bawah <Term k="Covenant" label="kovenan" /> internal
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

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="dim" style={{ margin: 0, padding: "6px 0", fontSize: "calc(11px * var(--fs-scale))" }}>
      {children}
    </p>
  );
}
