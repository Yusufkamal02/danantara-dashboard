"use client";

import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Panel } from "@/components/Panel";
import { Term } from "@/components/Term";
import { ForecastChart } from "@/components/charts/ForecastChart";
import {
  MODELS,
  HORIZONS,
  ASSUMPTIONS,
  SCENARIOS,
  DRIVERS,
  MODEL_QUALITY,
  COMBINED_SIGNAL,
  ACCURACY_HISTORY,
  PORTFOLIO_FORECAST,
  METHODOLOGY_NOTE,
  LAST_PRICE,
  assumptionShift,
  type Assumption,
} from "@/data/forecast";

const BASE_ASSUMPTIONS = Object.fromEntries(ASSUMPTIONS.map((a) => [a.id, a.value])) as Record<string, number>;

const fmtAssumption = (a: Assumption, v: number) => `${v.toFixed(a.decimals).replace(".", ",")}${a.unit}`;
const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;
const signedPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")}%`;

const TONE_COLOR = {
  neg: "var(--status-negative)",
  base: "var(--accent-amber)",
  pos: "var(--status-positive)",
} as const;

export default function PrediksiPage() {
  const [model, setModel] = useState(MODELS[0].name);
  const [horizon, setHorizon] = useState("12B");
  const [assumptions, setAssumptions] = useState(BASE_ASSUMPTIONS);
  const shift = assumptionShift(assumptions);
  const adjusted = ASSUMPTIONS.some((a) => assumptions[a.id] !== a.value);
  const baseTarget = SCENARIOS.find((s) => s.tone === "base")!.price * (1 + shift);

  const maxDriver = Math.max(...DRIVERS.map((d) => Math.abs(d.value)));

  return (
    <Shell
      subtitle="Mesin Prediksi & Skenario"
      meta={`BBRI IJ EQUITY FCST ${horizon} · MODEL ENSEMBLE · MAPE 6,8% · DILATIH 24 SEP 2026`}
    >
      <main
        className="main-grid"
        style={{ "--col-left": "268px", "--col-right": "312px" } as React.CSSProperties}
      >
        {/* ---------------- left ---------------- */}
        <div className="col col-left">
          <Panel title="Model Prediksi" chip={`${MODELS.length} TERSEDIA`} style={{ height: 172 }} bodyStyle={{ padding: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {MODELS.map((m) => {
                const on = m.name === model;
                return (
                  <label
                    key={m.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: 6,
                      cursor: "pointer",
                      background: on ? "#1b212c" : "transparent",
                      border: `1px solid ${on ? "var(--border-hairline)" : "transparent"}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="model"
                      checked={on}
                      onChange={() => setModel(m.name)}
                      style={{ width: 12, height: 12, accentColor: "var(--accent-amber)" }}
                    />
                    <span style={{ flexGrow: 1, fontSize: "calc(11px * var(--fs-scale))", color: on ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      {m.name.includes("LSTM") ? (
                        <>
                          Ensemble <Term k="LSTM" /> + <Term k="XGBoost" />
                        </>
                      ) : (
                        m.name
                      )}
                    </span>
                    <span className="mono" style={{ fontSize: "calc(8.5px * var(--fs-scale))", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: on ? "var(--status-positive)" : "var(--text-secondary)" }}>
                      {on ? "aktif" : "siap"}
                    </span>
                  </label>
                );
              })}
            </div>
          </Panel>

          <Panel
            title="Horizon & Asumsi"
            chip={adjusted ? `TARGET ${signedPct(shift * 100)}` : "SKENARIO DASAR"}
            extra={
              adjusted && (
                <button type="button" className="chat-pop-btn mono" onClick={() => setAssumptions(BASE_ASSUMPTIONS)} title="Kembali ke asumsi skenario dasar">
                  RESET
                </button>
              )
            }
            style={{ height: 228 }}
            bodyStyle={{ overflow: "auto" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {HORIZONS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorizon(h)}
                    aria-pressed={horizon === h}
                    className="mono tap"
                    style={{
                      flexGrow: 1,
                      height: 26,
                      fontSize: "calc(11px * var(--fs-scale))",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "1px solid var(--border-hairline)",
                      background: horizon === h ? "var(--accent-amber)" : "transparent",
                      color: horizon === h ? "var(--text-on-accent)" : "var(--text-secondary)",
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>

              {ASSUMPTIONS.map((a) => (
                <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "baseline" }}>
                    <label htmlFor={a.id} className="dim" style={{ flexGrow: 1, fontSize: "calc(10.5px * var(--fs-scale))" }}>
                      {a.label}
                    </label>
                    <span
                      className="mono"
                      aria-live="polite"
                      style={{
                        fontSize: "calc(10.5px * var(--fs-scale))",
                        fontWeight: 600,
                        color: assumptions[a.id] !== a.value ? "var(--accent-amber)" : undefined,
                      }}
                    >
                      {fmtAssumption(a, assumptions[a.id])}
                    </span>
                  </div>
                  <input
                    id={a.id}
                    type="range"
                    min={a.min}
                    max={a.max}
                    step={a.step}
                    value={assumptions[a.id]}
                    aria-valuetext={fmtAssumption(a, assumptions[a.id])}
                    onChange={(e) => setAssumptions((s) => ({ ...s, [a.id]: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: "var(--accent-amber)" }}
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Kualitas Model" chip="UJI MUNDUR" style={{ height: 170 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {MODEL_QUALITY.map((q) => (
                <div key={q.label} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-row)" }}>
                  <span className="dim" style={{ flexGrow: 1, fontSize: "calc(11px * var(--fs-scale))" }}>
                    {q.term ? <Term k={q.term} label={q.label} /> : q.label}
                  </span>
                  <span className={`mono ${q.good === true ? "pos" : q.good === null ? "dim" : "neg"}`} style={{ fontSize: "calc(12px * var(--fs-scale))", fontWeight: 600 }}>
                    {q.value}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Catatan Metodologi" chip="PENTING" className="panel-grow" bodyStyle={{ padding: 10, overflow: "auto" }}>
            <p className="dim" style={{ margin: 0, fontSize: "calc(11px * var(--fs-scale))", lineHeight: 1.5 }}>
              {METHODOLOGY_NOTE}
            </p>
          </Panel>
        </div>

        {/* ---------------- centre ---------------- */}
        <div className="col col-main">
          <Panel
            title="Proyeksi Harga BBRI — 14 Bulan ke Depan"
            chip={<Term k="Ensemble" label="ENSEMBLE LSTM + XGBOOST" />}
            extra={
              <span className="mono" style={{ fontSize: "calc(10px * var(--fs-scale))", fontWeight: 700, color: "var(--accent-amber)" }}>
                TARGET {rupiah(baseTarget)}
              </span>
            }
            className="panel-chart"
            style={{ height: 368, flexShrink: 0 }}
          >
            <ForecastChart shift={shift} />
          </Panel>

          <Panel title="Analisis Skenario — 12 Bulan" chip={adjusted ? "TARGET MENGIKUTI ASUMSI" : "PROBABILITAS TERTIMBANG"} style={{ height: 182, flexShrink: 0 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
            <table className="tbl tbl-mid">
              <thead>
                <tr>
                  <th className="left">SKENARIO</th>
                  <th className="left">PROB.</th>
                  <th className="left">TARGET 12B</th>
                  <th className="left">IMBAL HASIL</th>
                  <th className="left">ROE PROY.</th>
                  <th className="left">GROWTH</th>
                  <th className="left">ASUMSI UTAMA</th>
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.map((s) => (
                  <tr key={s.name}>
                    <td className="left" style={{ fontWeight: 700, color: TONE_COLOR[s.tone] }}>
                      {s.name}
                    </td>
                    <td className="left">{s.probability}</td>
                    <td className="left" style={{ fontWeight: 600, fontSize: "calc(12px * var(--fs-scale))" }}>
                      {rupiah(s.price * (1 + shift))}
                    </td>
                    <td className="left" style={{ fontWeight: 600, color: TONE_COLOR[s.tone] }}>
                      {signedPct(((s.price * (1 + shift)) / LAST_PRICE - 1) * 100)}
                    </td>
                    <td className="left">{s.roe}</td>
                    <td className="left">{s.growth}</td>
                    <td className="left truncate dim" style={{ fontFamily: "var(--font-sans)", fontSize: "calc(11px * var(--fs-scale))", width: "100%" }}>
                      {s.assumption}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Proyeksi Seluruh Portofolio" chip="8 DARI 42 EMITEN" className="panel-grow" bodyStyle={{ padding: 8, overflow: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th className="left">KODE</th>
                  <th>TARGET</th>
                  <th>POTENSI</th>
                  <th className="left" style={{ width: "50%" }}>
                    KEYAKINAN
                  </th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO_FORECAST.map((f) => (
                  <tr key={f.ticker}>
                    <td className="left" style={{ color: "var(--accent-amber)", fontWeight: 700, fontSize: "calc(11px * var(--fs-scale))" }}>
                      {f.ticker}
                    </td>
                    <td>{f.target}</td>
                    <td className={f.up ? "pos" : "neg"} style={{ fontWeight: 600 }}>
                      {f.upside}
                    </td>
                    <td className="left">
                      <div style={{ height: 7, background: "var(--bg-panel-header)" }}>
                        <div style={{ width: `${f.confidence}%`, height: 7, background: f.up ? "var(--status-positive)" : "var(--status-negative)" }} />
                      </div>
                    </td>
                    <td className="dim">{f.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* ---------------- right ---------------- */}
        <div className="col col-right">
          <Panel title="Kontribusi Faktor" chip={<Term k="SHAP" label="SHAP TERNORMALISASI" />} style={{ height: 272 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DRIVERS.map((d) => {
                const color = d.value > 0 ? "var(--status-positive)" : "var(--status-negative)";
                const width = (Math.abs(d.value) / maxDriver) * 50;
                return (
                  <div key={d.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span className="truncate" style={{ flexGrow: 1, fontSize: "calc(10.5px * var(--fs-scale))", width: "100%" }}>
                        {d.label}
                      </span>
                      <span className="mono" style={{ fontSize: "calc(10px * var(--fs-scale))", fontWeight: 600, color }}>
                        {d.value > 0 ? "+" : ""}
                        {d.value.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <div style={{ position: "relative", height: 8, background: "var(--bg-panel-header)" }}>
                      <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: 8, background: "var(--border-hairline)" }} />
                      <div
                        style={{
                          position: "absolute",
                          left: d.value > 0 ? "50%" : `${50 - width}%`,
                          top: 0,
                          width: `${width}%`,
                          height: 8,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Sinyal Gabungan" chip="PEMBARUAN HARIAN" style={{ height: 196 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="mono pos" style={{ fontSize: "calc(30px * var(--fs-scale))", fontWeight: 700 }}>
                  {COMBINED_SIGNAL.verdict}
                </span>
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span className="dim" style={{ fontSize: "calc(10.5px * var(--fs-scale))" }}>
                    Konsensus {COMBINED_SIGNAL.analysts} analis
                  </span>
                  <span className="mono" style={{ fontSize: "calc(11px * var(--fs-scale))" }}>
                    {COMBINED_SIGNAL.consensus}
                  </span>
                </div>
              </div>
              {COMBINED_SIGNAL.rows.map((r) => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="dim" style={{ width: 96, flexShrink: 0, fontSize: "calc(10.5px * var(--fs-scale))" }}>
                    {r.label}
                  </span>
                  <div style={{ flexGrow: 1, height: 7, background: "var(--bg-panel-header)" }}>
                    <div style={{ width: `${r.value}%`, height: 7, background: r.up ? "var(--status-positive)" : "var(--status-negative)" }} />
                  </div>
                  <span className={`mono ${r.up ? "pos" : "neg"}`} style={{ width: 54, textAlign: "right", fontSize: "calc(10px * var(--fs-scale))", fontWeight: 600 }}>
                    {r.verdict}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Riwayat Akurasi Proyeksi" chip="24 BULAN" className="panel-grow" bodyStyle={{ padding: 10, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {ACCURACY_HISTORY.map((a) => (
                <div key={a.ticker} style={{ display: "flex", alignItems: "baseline", gap: 8, paddingBottom: 7, borderBottom: "1px solid var(--border-row)" }}>
                  <span className="mono dim" style={{ width: 46, flexShrink: 0, fontSize: "calc(11px * var(--fs-scale))", fontWeight: 700 }}>
                    {a.ticker}
                  </span>
                  <span style={{ flexGrow: 1, fontSize: "calc(10.5px * var(--fs-scale))" }}>{a.note}</span>
                  <span
                    className="mono"
                    style={{
                      fontSize: "calc(11px * var(--fs-scale))",
                      fontWeight: 600,
                      color:
                        a.tone === "good" ? "var(--status-positive)" : a.tone === "warn" ? "var(--accent-amber)" : "var(--status-negative)",
                    }}
                  >
                    {a.error}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </main>
    </Shell>
  );
}
