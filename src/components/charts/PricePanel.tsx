"use client";

import { useMemo, useRef, useState } from "react";
import { Panel } from "@/components/Panel";
import { Term } from "@/components/Term";
import { buildSeries, sma, RANGES, type RangeKey, type Candle } from "@/data/market";

const W = 856;
const H = 380;
const PLOT_W = 786; // leaves room for the right-hand price axis
const PRICE_TOP = 6;
const PRICE_BOT = 214;
const VOL_TOP = 226;
const VOL_BOT = 280;
const RSI_TOP = 294;
const RSI_BOT = 338;
const MACD_TOP = 348;
const MACD_BOT = 376;

const id = (n: number) => n.toLocaleString("id-ID");

export function PricePanel() {
  const [range, setRange] = useState<RangeKey>("1T");
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const points = RANGES.find((r) => r.key === range)!.points;
  const candles = useMemo(() => buildSeries(points), [points]);

  const step = PLOT_W / candles.length;
  const bodyW = step * 0.62;

  const { top, bot } = useMemo(() => {
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    return { top: Math.max(...highs) * 1.01, bot: Math.min(...lows) * 0.99 };
  }, [candles]);

  const py = (v: number) => PRICE_BOT - ((v - bot) / (top - bot)) * (PRICE_BOT - PRICE_TOP);
  const cx = (i: number) => i * step + step / 2;

  const closes = candles.map((c) => c.close);
  const ma9 = useMemo(() => sma(closes, 9), [closes]);
  const ma30 = useMemo(() => sma(closes, 30), [closes]);

  const volMax = Math.max(...candles.map((c) => c.volume));
  const macdMax = Math.max(...candles.map((c) => Math.abs(c.macd)));
  const macdMid = (MACD_TOP + MACD_BOT) / 2;

  const last = candles[candles.length - 1];
  const active: Candle | null = hover !== null ? candles[hover] : null;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xInView = ((e.clientX - rect.left) / rect.width) * W;
    if (xInView > PLOT_W) return setHover(null);
    const i = Math.floor(xInView / step);
    setHover(i >= 0 && i < candles.length ? i : null);
  }

  return (
    <Panel
      // Without flex-grow the panel shrinks to the SVG's intrinsic width (the
      // 856px viewBox) and leaves a gap once the column is wider than that.
      style={{ flexGrow: 1, minWidth: 0 }}
      title="BBRI IJ EQUITY — Bank Rakyat Indonesia · Harian"
      extra={
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "flex", gap: 2 }}>
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                aria-pressed={range === r.key}
                className="mono"
                style={{
                  padding: "1px 6px",
                  fontSize: 9.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid var(--border-hairline)",
                  background: range === r.key ? "var(--accent-amber)" : "transparent",
                  color: range === r.key ? "var(--text-on-accent)" : "var(--text-secondary)",
                }}
              >
                {r.label}
              </button>
            ))}
          </span>
          <span className="mono pos" style={{ fontSize: 10, fontWeight: 700 }}>
            {id(last.close)} +60 (+1,26%)
          </span>
        </span>
      }
      bodyStyle={{ position: "relative" }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        role="img"
        aria-label="Grafik harga harian BBRI dengan volume, RSI dan MACD. Arahkan kursor untuk melihat nilai OHLC."
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: "block", cursor: "crosshair" }}
      >
        {/* price grid + right axis */}
        {[0, 1, 2, 3, 4].map((k) => {
          const y = PRICE_TOP + ((PRICE_BOT - PRICE_TOP) * k) / 4;
          const val = top - ((top - bot) * k) / 4;
          return (
            <g key={k}>
              <line x1={0} y1={y} x2={PLOT_W} y2={y} stroke="var(--border-hairline)" strokeWidth={0.6} />
              <text x={PLOT_W + 6} y={y + 3.2} className="mono" fontSize={9} fill="var(--text-secondary)">
                {id(Math.round(val))}
              </text>
            </g>
          );
        })}

        {/* candles */}
        {candles.map((c, i) => {
          const up = c.close >= c.open;
          const col = up ? "var(--status-positive)" : "var(--status-negative)";
          const yTop = py(Math.max(c.open, c.close));
          const yBot = py(Math.min(c.open, c.close));
          return (
            <g key={i}>
              <line x1={cx(i)} y1={py(c.high)} x2={cx(i)} y2={py(c.low)} stroke={col} strokeWidth={0.9} />
              <rect
                x={cx(i) - bodyW / 2}
                y={yTop}
                width={bodyW}
                height={Math.max(1.2, yBot - yTop)}
                fill={col}
              />
            </g>
          );
        })}

        {/* moving averages */}
        {[
          { data: ma9, color: "var(--accent-amber)" },
          { data: ma30, color: "var(--accent-blue)" },
        ].map((line, k) => (
          <polyline
            key={k}
            fill="none"
            stroke={line.color}
            strokeWidth={1.3}
            points={line.data
              .map((v, i) => (v === null ? null : `${cx(i).toFixed(1)},${py(v).toFixed(1)}`))
              .filter(Boolean)
              .join(" ")}
          />
        ))}

        {/* last price tag */}
        <rect x={PLOT_W + 2} y={py(last.close) - 7} width={62} height={14} fill="var(--status-positive)" />
        <text
          x={PLOT_W + 6}
          y={py(last.close) + 3.4}
          className="mono"
          fontSize={9.5}
          fontWeight={700}
          fill="var(--text-on-accent)"
        >
          {id(last.close)}
        </text>

        {/* volume */}
        <text x={4} y={VOL_TOP + 9} className="mono" fontSize={9} fontWeight={600} fill="var(--text-secondary)">
          VOLUME (lot)
        </text>
        {candles.map((c, i) => {
          const h = (c.volume / volMax) * (VOL_BOT - VOL_TOP);
          const up = c.close >= c.open;
          return (
            <rect
              key={i}
              x={cx(i) - bodyW / 2}
              y={VOL_BOT - h}
              width={bodyW}
              height={h}
              fill={up ? "var(--chart-volume-up)" : "var(--chart-volume-down)"}
            />
          );
        })}
        <line x1={0} y1={VOL_BOT} x2={PLOT_W} y2={VOL_BOT} stroke="var(--border-hairline)" strokeWidth={0.6} />

        {/* RSI */}
        {[70, 30].map((lvl) => {
          const y = RSI_BOT - (lvl / 100) * (RSI_BOT - RSI_TOP);
          return (
            <line
              key={lvl}
              x1={0}
              y1={y}
              x2={PLOT_W}
              y2={y}
              stroke={lvl === 70 ? "#5b3a3a" : "#3a5b46"}
              strokeWidth={0.8}
              strokeDasharray="3 3"
            />
          );
        })}
        <polyline
          fill="none"
          stroke="var(--accent-violet)"
          strokeWidth={1.2}
          points={candles
            .map((c, i) => `${cx(i).toFixed(1)},${(RSI_BOT - (c.rsi / 100) * (RSI_BOT - RSI_TOP)).toFixed(1)}`)
            .join(" ")}
        />
        <text x={4} y={RSI_TOP + 9} className="mono" fontSize={9} fontWeight={600} fill="var(--text-secondary)">
          RSI (14) — {(active ?? last).rsi.toFixed(1).replace(".", ",")}
        </text>

        {/* MACD */}
        {candles.map((c, i) => {
          const h = (Math.abs(c.macd) / macdMax) * ((MACD_BOT - MACD_TOP) / 2);
          return (
            <rect
              key={i}
              x={cx(i) - bodyW / 2}
              y={c.macd >= 0 ? macdMid - h : macdMid}
              width={bodyW}
              height={Math.max(0.8, h)}
              fill={c.macd >= 0 ? "var(--status-positive)" : "var(--status-negative)"}
              opacity={0.75}
            />
          );
        })}
        <line x1={0} y1={macdMid} x2={PLOT_W} y2={macdMid} stroke="var(--border-hairline)" strokeWidth={0.6} />
        <text x={4} y={MACD_TOP + 8} className="mono" fontSize={9} fontWeight={600} fill="var(--text-secondary)">
          MACD (12,26,9)
        </text>

        {/* month ticks */}
        {candles.map((c, i) =>
          i % Math.ceil(candles.length / 12) === 0 ? (
            <text key={i} x={cx(i)} y={220} className="mono" fontSize={9} fill="var(--text-secondary)">
              {c.label}
            </text>
          ) : null,
        )}

        {/* crosshair */}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={cx(hover)} y1={PRICE_TOP} x2={cx(hover)} y2={MACD_BOT} stroke="var(--text-secondary)" strokeWidth={0.7} strokeDasharray="2 3" />
            <circle cx={cx(hover)} cy={py(candles[hover].close)} r={2.6} fill="var(--accent-amber)" />
          </g>
        )}
      </svg>

      {active && hover !== null && (
        <Readout candle={active} left={(cx(hover) / W) * 100} />
      )}
    </Panel>
  );
}

function Readout({ candle, left }: { candle: Candle; left: number }) {
  const flip = left > 60;
  const up = candle.close >= candle.open;
  const rows: [string, string, string?][] = [
    ["O", id(candle.open), ""],
    ["H", id(candle.high), ""],
    ["L", id(candle.low), ""],
    ["C", id(candle.close), up ? "pos" : "neg"],
    ["Vol", `${id(candle.volume)} lot`, ""],
    ["RSI", candle.rsi.toFixed(1).replace(".", ","), ""],
    ["MACD", candle.macd.toFixed(2).replace(".", ","), candle.macd >= 0 ? "pos" : "neg"],
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        [flip ? "right" : "left"]: `${flip ? 100 - left + 1 : left + 1}%`,
        minWidth: 132,
        padding: "7px 9px",
        background: "#11161f",
        border: "1px solid var(--border-hairline)",
        boxShadow: "0 6px 20px rgba(0,0,0,.55)",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <div
        className="mono"
        style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-amber)", marginBottom: 4 }}
      >
        BBRI · {candle.label}
      </div>
      {rows.map(([k, v, tone]) => (
        <div key={k} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          <span className="mono dim" style={{ fontSize: 9.5, width: 30 }}>
            {k}
          </span>
          <span className={`mono ${tone ?? ""}`} style={{ fontSize: 10.5, fontWeight: 600, flexGrow: 1, textAlign: "right" }}>
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Legend shown under the chart panel, with glossary terms. */
export function ChartLegend() {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 10 }} className="dim">
      <span>
        <Term k="Volume" /> · <Term k="RSI" /> · <Term k="MACD" />
      </span>
    </div>
  );
}
