import { Fragment } from "react";
import { Shell } from "@/components/Shell";
import { Panel, BarRow } from "@/components/Panel";
import { Term } from "@/components/Term";
import { RatioTrend, Sparkline } from "@/components/charts/MiniCharts";
import {
  QUARTERS,
  RATIOS,
  TREND_SERIES,
  INCOME_STATEMENT,
  DUPONT,
  PEER_ROE,
  FUNDAMENTAL_SCORE,
  OWNERSHIP_PANEL,
  DATA_SOURCES,
  AI_SUMMARY,
  AI_SUMMARY_SOURCES,
} from "@/data/fundamentals";
import { HOLDINGS } from "@/data/holdings";

const EMITEN_LIST = HOLDINGS.slice(0, 12);

export default function LaporanKeuanganPage() {
  const maxPeer = Math.max(...PEER_ROE.map((p) => p.value));

  return (
    <Shell
      subtitle="Analisis Laporan Keuangan"
      command=">BBRI IJ EQUITY FA<GO>"
      meta="ROE 16,8% · ROA 2,74% · ROI 12,1% · PERIODE Q3-2026"
    >
      <main className="main-grid" style={{ gridTemplateColumns: "250px minmax(0, 1fr) 330px" }}>
        {/* ---------------- left ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <Panel title="Emiten Portofolio" chip="URUT: NILAI" style={{ height: 402 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {EMITEN_LIST.map((e, i) => (
                <div
                  key={e.ticker}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px minmax(0,1fr) 42px",
                    gap: 6,
                    alignItems: "center",
                    padding: "5px 6px",
                    background: i === 0 ? "#1b212c" : "transparent",
                    borderLeft: `2px solid ${i === 0 ? "var(--accent-amber)" : "transparent"}`,
                    borderBottom: "1px solid var(--border-row)",
                  }}
                >
                  <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {e.ticker}
                  </span>
                  <span className="truncate" style={{ fontSize: 11, color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {e.name}
                  </span>
                  <span className={`mono ${e.roe < 0 ? "neg" : "pos"}`} style={{ fontSize: 10, fontWeight: 600, textAlign: "right" }}>
                    {e.roe.toFixed(1).replace(".", ",")}%
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Trimmed per review: average cost, unrealised gain, trailing dividend
              and effective yield were removed from this panel. */}
          <Panel title="Kepemilikan Danantara" chip="BBRI" style={{ height: 160 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="mono" style={{ fontSize: 26, fontWeight: 700 }}>
                  {OWNERSHIP_PANEL.ownedPct.toString().replace(".", ",")}%
                </span>
                <span className="dim" style={{ fontSize: 11 }}>
                  saham dimiliki Danantara
                </span>
              </div>
              <div style={{ height: 8, background: "var(--bg-panel-header)" }}>
                <div style={{ width: `${OWNERSHIP_PANEL.ownedPct}%`, height: 8, background: "var(--accent-amber)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px 10px" }}>
                {OWNERSHIP_PANEL.stats.map((s) => (
                  <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span className="dim" style={{ fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {s.label}
                    </span>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Sumber Data" chip={`${DATA_SOURCES.length} TERHUBUNG`} style={{ flexGrow: 1, minHeight: 0 }} bodyStyle={{ padding: 10, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DATA_SOURCES.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-positive)" }} />
                  <span style={{ flexGrow: 1, fontSize: 11 }}>{s.label}</span>
                  <span className="mono dim" style={{ fontSize: 9 }}>
                    {s.freshness === "T+1" ? <Term k="T+1" label="T+1" /> : s.freshness}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ---------------- centre ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, height: 118, flexShrink: 0 }}>
            {RATIOS.map((r) => {
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
                    <span className="mono dim" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
                      <Term k={r.label} />
                    </span>
                    <span style={{ flexGrow: 1 }} />
                    <span className="mono" style={{ fontSize: 20, fontWeight: 600 }}>
                      {r.value}
                    </span>
                  </div>
                  <Sparkline values={r.series} color={color} />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="mono" style={{ fontSize: 10, fontWeight: 600, color }}>
                      {r.qoq}
                    </span>
                    <span className="mono dim" style={{ fontSize: 10 }}>
                      {r.yoy}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Panel
            title="Tren Rasio Profitabilitas — 9 Kuartal"
            chip="ROE · ROI · ROA"
            style={{ height: 248, flexShrink: 0 }}
          >
            <RatioTrend quarters={QUARTERS} series={TREND_SERIES} />
          </Panel>

          <Panel
            title="Laporan Laba Rugi — Perbandingan QoQ & YoY"
            chip="Rp miliar · belum diaudit"
            style={{ flexGrow: 1, minHeight: 0 }}
            bodyStyle={{ padding: 8, overflow: "auto" }}
          >
            <table className="tbl">
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
                {INCOME_STATEMENT.map((row) => (
                  <tr key={row.label} style={{ background: row.strong ? "var(--bg-row-alt)" : undefined }}>
                    <td className="left" style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: row.strong ? 600 : 400 }}>
                      {row.label === "PPOP" ? <Term k="PPOP" /> : row.label === "Beban CKPN" ? <>Beban <Term k="CKPN" /></> : row.label === "Laba per saham (Rp)" ? <><Term k="EPS" label="Laba per saham" /> (Rp)</> : row.label}
                    </td>
                    <td style={{ fontWeight: row.strong ? 600 : 400 }}>{row.q3}</td>
                    <td>{row.q2}</td>
                    <td className={row.qoq.startsWith("+") ? "pos" : "neg"} style={{ fontWeight: 600 }}>
                      {row.qoq}
                    </td>
                    <td>{row.q3Prev}</td>
                    <td className={row.yoy.startsWith("+") ? "pos" : "neg"} style={{ fontWeight: 600 }}>
                      {row.yoy}
                    </td>
                    <td style={{ fontWeight: row.strong ? 600 : 400 }}>{row.m9}</td>
                    <td className={row.yoy9.startsWith("+") ? "pos" : "neg"} style={{ fontWeight: 600 }}>
                      {row.yoy9}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* ---------------- right ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <Panel title={<Term k="DuPont" label="Dekomposisi DuPont" />} chip="Q3-2026" style={{ height: 172 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "stretch", gap: 6 }}>
                {DUPONT.map((d, i) => (
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
                      <span className="dim" style={{ fontSize: 9.5, lineHeight: 1.2 }}>
                        {d.label}
                      </span>
                      <span className="mono" style={{ fontSize: 15, fontWeight: 600 }}>
                        {d.value}
                      </span>
                      <span className={`mono ${d.up ? "pos" : "neg"}`} style={{ fontSize: 9.5, fontWeight: 600 }}>
                        {d.delta}
                      </span>
                    </div>
                    {i < DUPONT.length - 1 && (
                      <span className="mono dim" style={{ alignSelf: "center", fontSize: 14 }}>
                        ×
                      </span>
                    )}
                  </Fragment>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 7, borderTop: "1px solid var(--border-hairline)" }}>
                <span className="dim" style={{ fontSize: 11 }}>
                  Menghasilkan <Term k="ROE" />
                </span>
                <span style={{ flexGrow: 1 }} />
                <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-amber)" }}>
                  16,8%
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Perbandingan ROE Sejawat" chip={<Term k="Himbara" label="HIMBARA" />} style={{ height: 180 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {PEER_ROE.map((p) => (
                <BarRow key={p.name} label={p.name} value={`${p.value.toString().replace(".", ",")}%`} fraction={p.value / maxPeer} color={p.color} />
              ))}
            </div>
          </Panel>

          <Panel title="Skor Fundamental" chip="MODEL v2.4" style={{ height: 136 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <svg viewBox="0 0 68 68" width={68} height={68} role="img" aria-label={`Skor fundamental ${FUNDAMENTAL_SCORE.total} dari 100`} style={{ flexShrink: 0 }}>
                <circle cx={34} cy={34} r={30} fill="none" stroke="#1b2230" strokeWidth={7} />
                <circle
                  cx={34}
                  cy={34}
                  r={30}
                  fill="none"
                  stroke="var(--status-positive)"
                  strokeWidth={7}
                  strokeDasharray={`${(2 * Math.PI * 30 * FUNDAMENTAL_SCORE.total) / 100} ${2 * Math.PI * 30}`}
                  transform="rotate(-90 34 34)"
                />
                <text x={34} y={36} textAnchor="middle" className="mono" fontSize={17} fontWeight={700} fill="var(--text-primary)">
                  {FUNDAMENTAL_SCORE.total}
                </text>
                <text x={34} y={48} textAnchor="middle" fontSize={8} fill="var(--text-secondary)">
                  / 100
                </text>
              </svg>
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                {FUNDAMENTAL_SCORE.factors.map((f) => (
                  <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span className="dim" style={{ width: 82, flexShrink: 0, fontSize: 10.5 }}>
                      {f.label}
                    </span>
                    <div style={{ flexGrow: 1, height: 6, background: "var(--bg-panel-header)" }}>
                      <div style={{ width: `${f.value}%`, height: 6, background: f.good ? "var(--status-positive)" : "var(--accent-amber)" }} />
                    </div>
                    <span className="mono" style={{ width: 20, textAlign: "right", fontSize: 10 }}>
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Ringkasan Otomatis" chip="DIBUAT AI" style={{ flexGrow: 1, minHeight: 0 }} bodyStyle={{ padding: 10, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {AI_SUMMARY.map((p) => (
                <p key={p.slice(0, 20)} style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5 }}>
                  {p}
                </p>
              ))}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {AI_SUMMARY_SOURCES.map((s) => (
                  <span key={s} className="mono dim" style={{ fontSize: 9, border: "1px solid var(--border-hairline)", padding: "2px 5px" }}>
                    {s}
                  </span>
                ))}
              </div>
              <a
                href="/chat"
                className="mono"
                style={{
                  alignSelf: "flex-start",
                  padding: "6px 10px",
                  fontSize: 10,
                  fontWeight: 600,
                  textDecoration: "none",
                  color: "var(--text-on-accent)",
                  background: "var(--accent-amber)",
                }}
              >
                TANYA LEBIH LANJUT DI CHAT AI
              </a>
            </div>
          </Panel>
        </div>
      </main>
    </Shell>
  );
}
