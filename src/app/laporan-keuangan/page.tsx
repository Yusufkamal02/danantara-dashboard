"use client";

import { Fragment, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Panel, BarRow } from "@/components/Panel";
import { Term } from "@/components/Term";
import { RatioTrend, Sparkline } from "@/components/charts/MiniCharts";
import { QUARTERS, DATA_SOURCES, buildFundamentals } from "@/data/fundamentals";
import { HOLDINGS } from "@/data/holdings";
import { EmitenList } from "@/components/EmitenList";
import { useChat } from "@/components/chat/ChatContext";

/**
 * The selected issuer lives in the URL (?emiten=TLKM) so a link from Holdings
 * or a shared URL opens the right company. Reading search params makes this
 * subtree client-rendered; the fallback prerenders BBRI so the static HTML is
 * never empty.
 */
export default function LaporanKeuanganPage() {
  return (
    <Suspense fallback={<LaporanKeuangan ticker="BBRI" />}>
      <FromQuery />
    </Suspense>
  );
}

function FromQuery() {
  const q = useSearchParams().get("emiten")?.toUpperCase();
  const ticker = HOLDINGS.some((h) => h.ticker === q) ? q! : "BBRI";
  return <LaporanKeuangan ticker={ticker} />;
}

/** Colour for a signed change; "—" (sign flip or no base) stays neutral. */
const tone = (v: string) => (v.startsWith("+") ? "pos" : v.startsWith("-") ? "neg" : "dim");

function LaporanKeuangan({ ticker }: { ticker: string }) {
  const router = useRouter();
  const { setPopupOpen } = useChat();
  const f = buildFundamentals(ticker);
  const maxPeer = Math.max(...f.peers.map((p) => p.value), 1);

  return (
    <Shell
      subtitle="Analisis Laporan Keuangan"
      meta={`${f.ticker} IJ EQUITY · ${f.meta}`}
    >
      <main
        className="main-grid"
        style={{ "--col-left": "250px", "--col-right": "330px" } as React.CSSProperties}
      >
        {/* ---------------- left ---------------- */}
        <div className="col col-left">
          <Panel title="Emiten Portofolio" chip="URUT: NILAI" style={{ height: 402 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
            <EmitenList
              selected={f.ticker}
              onSelect={(t) => router.replace(`/laporan-keuangan?emiten=${t}`, { scroll: false })}
              metric={(e) => ({ text: `${e.roe.toFixed(1).replace(".", ",")}%`, tone: e.roe < 0 ? "neg" : "pos" })}
            />
          </Panel>

          {/* Trimmed per review: average cost, unrealised gain, trailing dividend
              and effective yield were removed from this panel. */}
          <Panel title="Kepemilikan Danantara" chip={f.ticker} style={{ height: 160 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="mono" style={{ fontSize: "calc(26px * var(--fs-scale))", fontWeight: 700 }}>
                  {f.ownership.ownedPct.toString().replace(".", ",")}%
                </span>
                <span className="dim" style={{ fontSize: "calc(11px * var(--fs-scale))" }}>
                  saham dimiliki Danantara
                </span>
              </div>
              <div style={{ height: 8, background: "var(--bg-panel-header)" }}>
                <div style={{ width: `${f.ownership.ownedPct}%`, height: 8, background: "var(--accent-amber)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px 10px" }}>
                {f.ownership.stats.map((s) => (
                  <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span className="dim" style={{ fontSize: "calc(9.5px * var(--fs-scale))", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {s.label}
                    </span>
                    <span className="mono" style={{ fontSize: "calc(12px * var(--fs-scale))", fontWeight: 600 }}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Sumber Data" chip={`${DATA_SOURCES.length} TERHUBUNG`} className="panel-grow" bodyStyle={{ padding: 10, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DATA_SOURCES.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-positive)" }} />
                  <span style={{ flexGrow: 1, fontSize: "calc(11px * var(--fs-scale))" }}>{s.label}</span>
                  <span className="mono dim" style={{ fontSize: "calc(9px * var(--fs-scale))" }}>
                    {s.freshness === "T+1" ? <Term k="T+1" label="T+1" /> : s.freshness}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ---------------- centre ---------------- */}
        <div className="col col-main">
          <div className="tile-row" style={{ "--tile-h": "118px" } as React.CSSProperties}>
            {f.ratios.map((r) => {
              const color = r.up ? "var(--status-positive)" : "var(--status-negative)";
              return (
                <div
                  key={r.key}
                  style={{
                    flexGrow: 1,
                    flexBasis: 0,
                    minWidth: 0,
                    padding: "9px 11px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-hairline)",
                    borderTop: `2px solid ${color}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span className="mono dim" style={{ fontSize: "calc(11px * var(--fs-scale))", fontWeight: 700, letterSpacing: "0.1em" }}>
                      <Term k={r.label} />
                    </span>
                    <span style={{ flexGrow: 1 }} />
                    <span className="mono" style={{ fontSize: "calc(20px * var(--fs-scale))", fontWeight: 600 }}>
                      {r.value}
                    </span>
                  </div>
                  <Sparkline values={r.series} color={color} />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="mono" style={{ fontSize: "calc(10px * var(--fs-scale))", fontWeight: 600, color }}>
                      {r.qoq}
                    </span>
                    <span className="mono dim" style={{ fontSize: "calc(10px * var(--fs-scale))" }}>
                      {r.yoy}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Panel
            title={`Tren Rasio Profitabilitas ${f.ticker} — 9 Kuartal`}
            chip="ROE · ROI · ROA"
            className="panel-chart"
            style={{ height: 248, flexShrink: 0 }}
          >
            <RatioTrend quarters={QUARTERS} series={f.trend} />
          </Panel>

          <Panel
            title={`Laporan Laba Rugi ${f.ticker} — Perbandingan QoQ & YoY`}
            chip="Rp miliar · belum diaudit"
            className="panel-grow"
            bodyStyle={{ padding: 8, overflow: "auto" }}
          >
            <table className="tbl tbl-mid">
              <thead>
                <tr>
                  <th className="left">POS LAPORAN</th>
                  <th>Q3-26</th>
                  <th>Q2-26</th>
                  <th>
                    <Term k="QoQ" />
                  </th>
                  <th>Q3-25</th>
                  <th>
                    <Term k="YoY" />
                  </th>
                  <th>9M-26</th>
                  <th>YoY 9M</th>
                </tr>
              </thead>
              <tbody>
                {f.income.map((row) => (
                  <tr key={row.label} style={{ background: row.strong ? "var(--bg-row-alt)" : undefined }}>
                    <td className="left" style={{ fontFamily: "var(--font-sans)", fontSize: "calc(11.5px * var(--fs-scale))", fontWeight: row.strong ? 600 : 400 }}>
                      {row.label === "PPOP" ? <Term k="PPOP" /> : row.label === "Beban CKPN" ? <>Beban <Term k="CKPN" /></> : row.label === "Laba per saham (Rp)" ? <><Term k="EPS" label="Laba per saham" /> (Rp)</> : row.label}
                    </td>
                    <td style={{ fontWeight: row.strong ? 600 : 400 }}>{row.q3}</td>
                    <td>{row.q2}</td>
                    <td className={tone(row.qoq)} style={{ fontWeight: 600 }}>
                      {row.qoq}
                    </td>
                    <td>{row.q3Prev}</td>
                    <td className={tone(row.yoy)} style={{ fontWeight: 600 }}>
                      {row.yoy}
                    </td>
                    <td style={{ fontWeight: row.strong ? 600 : 400 }}>{row.m9}</td>
                    <td className={tone(row.yoy9)} style={{ fontWeight: 600 }}>
                      {row.yoy9}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* ---------------- right ---------------- */}
        <div className="col col-right">
          <Panel title={<Term k="DuPont" label="Dekomposisi DuPont" />} chip="Q3-2026" style={{ height: 172 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "stretch", gap: 6 }}>
                {f.dupont.map((d, i) => (
                  <Fragment key={d.label}>
                    <div
                      style={{
                        flexGrow: 1,
                        flexBasis: 0,
                        minWidth: 0,
                        padding: "7px 8px",
                        background: "var(--bg-row-alt)",
                        border: "1px solid var(--border-hairline)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <span className="dim" style={{ fontSize: "calc(9.5px * var(--fs-scale))", lineHeight: 1.2 }}>
                        {d.label}
                      </span>
                      <span className="mono" style={{ fontSize: "calc(15px * var(--fs-scale))", fontWeight: 600 }}>
                        {d.value}
                      </span>
                      <span className={`mono ${d.up ? "pos" : "neg"}`} style={{ fontSize: "calc(9.5px * var(--fs-scale))", fontWeight: 600 }}>
                        {d.delta}
                      </span>
                    </div>
                    {i < f.dupont.length - 1 && (
                      <span className="mono dim" style={{ alignSelf: "center", fontSize: "calc(14px * var(--fs-scale))" }}>
                        ×
                      </span>
                    )}
                  </Fragment>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 7, borderTop: "1px solid var(--border-hairline)" }}>
                <span className="dim" style={{ fontSize: "calc(11px * var(--fs-scale))" }}>
                  Menghasilkan <Term k="ROE" />
                </span>
                <span style={{ flexGrow: 1 }} />
                <span className="mono" style={{ fontSize: "calc(18px * var(--fs-scale))", fontWeight: 700, color: "var(--accent-amber)" }}>
                  {f.dupontRoe}
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Perbandingan ROE Sejawat" chip={f.peerLabel === "Himbara" ? <Term k="Himbara" label="HIMBARA" /> : f.peerLabel.toUpperCase()} style={{ height: 180 }} bodyStyle={{ overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {f.peers.map((p) => (
                <BarRow key={p.name} label={p.name} value={`${p.value.toString().replace(".", ",")}%`} fraction={Math.max(0, p.value) / maxPeer} color={p.color} />
              ))}
            </div>
          </Panel>

          <Panel title="Skor Fundamental" chip="MODEL v2.4" style={{ height: 136 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <svg viewBox="0 0 68 68" width={68} height={68} role="img" aria-label={`Skor fundamental ${f.score.total} dari 100`} style={{ flexShrink: 0 }}>
                <circle cx={34} cy={34} r={30} fill="none" stroke="#1b2230" strokeWidth={7} />
                <circle
                  cx={34}
                  cy={34}
                  r={30}
                  fill="none"
                  stroke="var(--status-positive)"
                  strokeWidth={7}
                  strokeDasharray={`${(2 * Math.PI * 30 * f.score.total) / 100} ${2 * Math.PI * 30}`}
                  transform="rotate(-90 34 34)"
                />
                <text x={34} y={36} textAnchor="middle" className="mono" fontSize={17} fontWeight={700} fill="var(--text-primary)">
                  {f.score.total}
                </text>
                <text x={34} y={48} textAnchor="middle" fontSize={8} fill="var(--text-secondary)">
                  / 100
                </text>
              </svg>
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                {f.score.factors.map((f) => (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span className="dim" style={{ width: 82, flexShrink: 0, fontSize: "calc(10.5px * var(--fs-scale))" }}>
                      {f.label}
                    </span>
                    <div style={{ flexGrow: 1, height: 6, background: "var(--bg-panel-header)" }}>
                      <div style={{ width: `${f.value}%`, height: 6, background: f.good ? "var(--status-positive)" : "var(--accent-amber)" }} />
                    </div>
                    <span className="mono" style={{ width: 20, textAlign: "right", fontSize: "calc(10px * var(--fs-scale))" }}>
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Ringkasan Otomatis" chip="DIBUAT AI" className="panel-grow" bodyStyle={{ padding: 10, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {f.summary.map((p) => (
                <p key={p.slice(0, 20)} style={{ margin: 0, fontSize: "calc(11.5px * var(--fs-scale))", lineHeight: 1.5 }}>
                  {p}
                </p>
              ))}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {f.summarySources.map((s) => (
                  <span key={s} className="mono dim" style={{ fontSize: "calc(9px * var(--fs-scale))", border: "1px solid var(--border-hairline)", padding: "2px 5px" }}>
                    {s}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPopupOpen(true)}
                className="mono"
                style={{
                  alignSelf: "flex-start",
                  padding: "6px 10px",
                  fontSize: "calc(10px * var(--fs-scale))",
                  fontWeight: 600,
                  border: 0,
                  cursor: "pointer",
                  color: "var(--text-on-accent)",
                  background: "var(--accent-amber)",
                }}
              >
                TANYA LEBIH LANJUT DI CHAT AI
              </button>
            </div>
          </Panel>
        </div>
      </main>
    </Shell>
  );
}
