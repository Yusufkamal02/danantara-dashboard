"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Panel, BarRow } from "@/components/Panel";
import { Term } from "@/components/Term";
import { Sparkline } from "@/components/charts/MiniCharts";
import { EmitenList } from "@/components/EmitenList";
import { useChat } from "@/components/chat/ChatContext";
import { HOLDINGS, SECTOR_SHORT } from "@/data/holdings";
import {
  ANNUAL_YEARS,
  SELECTABLE_YEARS,
  BIDANG,
  buildAnnual,
  formatIndicator,
  indicatorChange,
  type Indicator,
  type IndicatorSeries,
} from "@/data/annual";

/** Same URL convention as Laporan Keuangan: ?emiten=TLKM. */
export default function LaporanTahunanPage() {
  return (
    <Suspense fallback={<LaporanTahunan ticker="BBRI" />}>
      <FromQuery />
    </Suspense>
  );
}

function FromQuery() {
  const q = useSearchParams().get("emiten")?.toUpperCase();
  const ticker = HOLDINGS.some((h) => h.ticker === q) ? q! : "BBRI";
  return <LaporanTahunan ticker={ticker} />;
}

const TOTAL_INDICATORS = BIDANG.reduce((s, b) => s + b.indicators.length, 0);

/** Relative change in the "good" direction, for ranking highlights. */
function goodness(s: IndicatorSeries, yi: number): number {
  const ind = s.indicator;
  if (ind.better === "none") return 0;
  const now = s.values[yi];
  const before = s.values[yi - 1];
  const rel = before === 0 ? 0 : (now - before) / Math.abs(before);
  return ind.better === "up" ? rel : -rel;
}

function LaporanTahunan({ ticker }: { ticker: string }) {
  const router = useRouter();
  const { setPopupOpen } = useChat();
  const [year, setYear] = useState(SELECTABLE_YEARS[SELECTABLE_YEARS.length - 1]);
  const [compare, setCompare] = useState<{ bidang: string; id: string }>({ bidang: "esg", id: "emission" });

  const report = useMemo(() => buildAnnual(ticker), [ticker]);
  const all = useMemo(() => HOLDINGS.map((h) => buildAnnual(h.ticker)), []);
  const yi = ANNUAL_YEARS.indexOf(year);

  const compareInd = BIDANG.find((b) => b.key === compare.bidang)!.indicators.find((i) => i.id === compare.id)!;
  const ranking = all
    .map((r) => ({
      ticker: r.ticker,
      value: r.bidang.find((b) => b.bidang.key === compare.bidang)!.series.find((s) => s.indicator.id === compare.id)!.values[yi],
    }))
    .sort((a, b) => (compareInd.better === "down" ? a.value - b.value : b.value - a.value));
  const maxRank = Math.max(...ranking.map((r) => Math.abs(r.value)), 1e-9);
  const rankOf = ranking.findIndex((r) => r.ticker === ticker) + 1;

  // One line per function: its strongest improvement and its weakest spot.
  const highlights = report.bidang.map(({ bidang, series }) => {
    const ranked = [...series].filter((s) => s.indicator.better !== "none").sort((a, b) => goodness(b, yi) - goodness(a, yi));
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];
    const line = (s: IndicatorSeries) =>
      `${s.indicator.label.toLowerCase()} ${formatIndicator(s.indicator, s.values[yi])} (${indicatorChange(s.indicator, s.values[yi], s.values[yi - 1]).text})`;
    return {
      bidang,
      text:
        goodness(worst, yi) < 0
          ? `Terbaik: ${line(best)}. Perlu perhatian: ${line(worst)}.`
          : `Seluruh indikator membaik; terkuat ${line(best)}.`,
      concern: goodness(worst, yi) < 0,
    };
  });
  const concerns = highlights.filter((h) => h.concern).length;

  return (
    <Shell
      subtitle="Kinerja per Bidang — Laporan Tahunan"
      meta={`LAPORAN TAHUNAN ${year} · ${report.ticker} · ${BIDANG.length} BIDANG · ${TOTAL_INDICATORS} INDIKATOR`}
      sync={`Laporan Tahunan ${year} · diekstrak dari PDF emiten`}
    >
      <main className="main-grid" style={{ "--col-left": "250px", "--col-right": "300px" } as React.CSSProperties}>
        {/* ---------------- left ---------------- */}
        <div className="col col-left">
          <Panel title="Emiten Portofolio" chip="URUT: NILAI" style={{ height: 402 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
            <EmitenList
              selected={report.ticker}
              onSelect={(t) => router.replace(`/laporan-tahunan?emiten=${t}`, { scroll: false })}
              metric={(h) => ({ text: SECTOR_SHORT[h.sector], tone: "dim" })}
            />
          </Panel>

          <Panel title={<Term k="Laporan Tahunan" label="Tahun Buku" />} chip={report.ticker} style={{ height: 150 }} bodyStyle={{ overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {SELECTABLE_YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    aria-pressed={year === y}
                    className="mono tap"
                    style={{
                      flexGrow: 1,
                      height: 26,
                      fontSize: "calc(11px * var(--fs-scale))",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "1px solid var(--border-hairline)",
                      background: year === y ? "var(--accent-amber)" : "transparent",
                      color: year === y ? "var(--text-on-accent)" : "var(--text-secondary)",
                    }}
                  >
                    FY{y}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px 10px" }}>
                {[
                  ["Dokumen", `LT ${year} ${report.ticker}`],
                  ["Terbit", year === 2025 ? report.published : `Mar ${year + 1}`],
                  ["Halaman", `${report.pages}`],
                  ["Status", year === 2025 ? "Terbaru" : "Arsip"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                    <span className="dim" style={{ fontSize: "calc(9px * var(--fs-scale))", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {k}
                    </span>
                    <span className="mono truncate" style={{ fontSize: "calc(11.5px * var(--fs-scale))", fontWeight: 600 }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Cakupan Data" chip={`${BIDANG.length} BAB`} className="panel-grow" bodyStyle={{ padding: 10, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {BIDANG.map((b) => (
                <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 6, height: 6, background: b.color, flexShrink: 0 }} />
                  <span style={{ flexGrow: 1, fontSize: "calc(11px * var(--fs-scale))" }}>{b.title}</span>
                  <span className="mono dim truncate" style={{ fontSize: "calc(9px * var(--fs-scale))", maxWidth: 120 }}>
                    {b.chapter}
                  </span>
                </div>
              ))}
              <p className="dim" style={{ margin: "4px 0 0", fontSize: "calc(10.5px * var(--fs-scale))", lineHeight: 1.45 }}>
                Indikator non-keuangan disarikan dari laporan tahunan dan laporan keberlanjutan. Definisi tiap indikator belum dibakukan lintas emiten.
              </p>
            </div>
          </Panel>
        </div>

        {/* ---------------- centre ---------------- */}
        <div className="col col-main">
          <div className="bidang-grid">
            {report.bidang.map(({ bidang, series }) => {
              const hl = highlights.find((h) => h.bidang.key === bidang.key)!;
              return (
                <Panel
                  key={bidang.key}
                  title={bidang.title}
                  chip={bidang.chapter.split(" · ")[0].toUpperCase()}
                  style={{ borderTop: `2px solid ${bidang.color}` }}
                  bodyStyle={{ padding: 0 }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {series.map((s) => (
                      <IndicatorRow
                        key={s.indicator.id}
                        series={s}
                        yi={yi}
                        color={bidang.color}
                        active={compare.bidang === bidang.key && compare.id === s.indicator.id}
                        onCompare={() => setCompare({ bidang: bidang.key, id: s.indicator.id })}
                      />
                    ))}
                    <p
                      style={{
                        margin: 0,
                        padding: "7px 9px",
                        background: "var(--bg-row-alt)",
                        fontSize: "calc(10.5px * var(--fs-scale))",
                        lineHeight: 1.45,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {hl.text}
                    </p>
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>

        {/* ---------------- right ---------------- */}
        <div className="col col-right">
          <Panel
            title="Perbandingan Antar Emiten"
            chip={`FY${year}`}
            style={{ height: 470 }}
            bodyStyle={{ padding: 10, overflow: "auto" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: "calc(12px * var(--fs-scale))", fontWeight: 600 }}>
                  {compareInd.term ? <Term k={compareInd.term} label={compareInd.label} /> : compareInd.label}
                </span>
                <span className="dim" style={{ fontSize: "calc(10px * var(--fs-scale))" }}>
                  {report.ticker} peringkat {rankOf} dari {ranking.length}
                  {compareInd.better === "down" ? " · makin rendah makin baik" : compareInd.better === "up" ? " · makin tinggi makin baik" : ""}
                  {" · "}klik indikator lain untuk mengganti
                </span>
              </div>
              {ranking.map((r) => (
                <div key={r.ticker} style={{ opacity: r.ticker === ticker ? 1 : 0.72 }}>
                  <BarRow
                    label={<span className="mono" style={{ fontWeight: r.ticker === ticker ? 700 : 400 }}>{r.ticker}</span>}
                    value={formatIndicator(compareInd, r.value)}
                    fraction={Math.abs(r.value) / maxRank}
                    color={r.ticker === ticker ? "var(--accent-amber)" : "var(--text-secondary)"}
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Sorotan Otomatis" chip="DIBUAT AI" className="panel-grow" bodyStyle={{ padding: 10, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: 0, fontSize: "calc(11.5px * var(--fs-scale))", lineHeight: 1.5 }}>
                {concerns === 0
                  ? `Pada FY${year}, seluruh bidang ${report.ticker} mencatat perbaikan pada indikator utamanya.`
                  : `Pada FY${year}, ${BIDANG.length - concerns} dari ${BIDANG.length} bidang ${report.ticker} membaik menyeluruh; ${concerns} bidang punya setidaknya satu indikator yang memburuk.`}
              </p>
              {highlights
                .filter((h) => h.concern)
                .slice(0, 3)
                .map((h) => (
                  <div key={h.bidang.key} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span style={{ width: 6, height: 6, marginTop: 5, background: h.bidang.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "calc(10.5px * var(--fs-scale))", lineHeight: 1.45 }}>
                      <strong>{h.bidang.title}</strong> — {h.text.split("Perlu perhatian: ")[1] ?? h.text}
                    </span>
                  </div>
                ))}
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

/**
 * One indicator: label (with glossary tooltip where one exists) beside a
 * button holding the value, change and trend. The label and the button are
 * siblings because <Term> is itself a button.
 */
function IndicatorRow({
  series,
  yi,
  color,
  active,
  onCompare,
}: {
  series: IndicatorSeries;
  yi: number;
  color: string;
  active: boolean;
  onCompare: () => void;
}) {
  const ind: Indicator = series.indicator;
  const now = series.values[yi];
  const change = indicatorChange(ind, now, series.values[yi - 1]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 9px",
        borderBottom: "1px solid var(--border-row)",
        borderLeft: `2px solid ${active ? "var(--accent-amber)" : "transparent"}`,
        background: active ? "#1b212c" : "transparent",
      }}
    >
      <span style={{ flexGrow: 1, minWidth: 0, fontSize: "calc(11px * var(--fs-scale))", lineHeight: 1.3 }}>
        {ind.term ? <Term k={ind.term} label={ind.label} /> : ind.label}
      </span>
      <button
        type="button"
        onClick={onCompare}
        aria-pressed={active}
        aria-label={`${ind.label} ${formatIndicator(ind, now)}, ${change.text}. Bandingkan antar emiten.`}
        title="Bandingkan antar emiten"
        className="indicator-btn"
      >
        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
          <span className="mono" style={{ fontSize: "calc(12px * var(--fs-scale))", fontWeight: 600, whiteSpace: "nowrap" }}>
            {formatIndicator(ind, now)}
          </span>
          <span className={`mono ${change.tone}`} style={{ fontSize: "calc(9.5px * var(--fs-scale))", fontWeight: 600, whiteSpace: "nowrap" }}>
            {change.text} YoY
          </span>
        </span>
        <span style={{ width: 44, flexShrink: 0 }}>
          <Sparkline values={series.values.slice(0, yi + 1)} color={color} />
        </span>
      </button>
    </div>
  );
}
