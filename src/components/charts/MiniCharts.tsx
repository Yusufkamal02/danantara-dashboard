"use client";

import { useRef, useState } from "react";

/**
 * Maps a pointer position onto a data index inside an SVG that scales with its
 * container. Everything is computed in viewBox units so the chart can be laid
 * out fluidly without breaking hit testing.
 */
function useHoverIndex(count: number, viewWidth: number, plotWidth: number, padLeft = 0) {
  const ref = useRef<SVGSVGElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * viewWidth - padLeft;
    if (x < 0 || x > plotWidth) return setIndex(null);
    const i = Math.round((x / plotWidth) * (count - 1));
    setIndex(Math.max(0, Math.min(count - 1, i)));
  }

  // Returned as a tuple, not one object: bundling the ref together with the
  // hovered index makes every property read look like a ref read during render.
  return [ref, index, { onMouseMove, onMouseLeave: () => setIndex(null) }] as const;
}

const fmt1 = (n: number) => n.toFixed(1).replace(".", ",");

/** Tooltip bubble positioned by percentage of the chart width. */
function Bubble({
  left,
  title,
  rows,
}: {
  left: number;
  title: string;
  rows: { label: string; value: string; color?: string }[];
}) {
  const flip = left > 55;
  return (
    <div
      style={{
        position: "absolute",
        top: 4,
        [flip ? "right" : "left"]: `${flip ? 100 - left + 2 : left + 2}%`,
        minWidth: 104,
        padding: "6px 8px",
        background: "#11161f",
        border: "1px solid var(--border-hairline)",
        boxShadow: "0 6px 20px rgba(0,0,0,.55)",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <div
        className="mono"
        style={{ fontSize: "calc(9px * var(--fs-scale))", fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-amber)", marginBottom: 3 }}
      >
        {title}
      </div>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          <span className="mono dim" style={{ fontSize: "calc(9.5px * var(--fs-scale))" }}>
            {r.label}
          </span>
          <span
            className="mono"
            style={{ fontSize: "calc(10.5px * var(--fs-scale))", fontWeight: 600, flexGrow: 1, textAlign: "right", color: r.color }}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Aggregate revenue growth, YoY. Hovering a month reveals its value. */
export function YoYArea({ data }: { data: { label: string; value: number }[] }) {
  const W = 250;
  const H = 96;
  const lo = -3;
  const hi = 11;
  const [svgRef, hoverIndex, hoverHandlers] = useHoverIndex(data.length, W, W - 8, 4);

  const x = (i: number) => (i * (W - 8)) / (data.length - 1) + 4;
  const y = (v: number) => H - 16 - ((v - lo) / (hi - lo)) * (H - 26);
  const zero = y(0);
  const line = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        role="img"
        aria-label="Pertumbuhan pendapatan YoY portofolio"
        {...hoverHandlers}
        style={{ display: "block", cursor: "crosshair" }}
      >
        <polygon points={`${x(0)},${zero} ${line} ${x(data.length - 1)},${zero}`} fill="var(--accent-amber)" opacity={0.22} />
        <polyline points={line} fill="none" stroke="var(--accent-amber)" strokeWidth={1.6} />
        <line x1={4} y1={zero} x2={W - 4} y2={zero} stroke="var(--border-hairline)" strokeWidth={0.8} />
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r={hoverIndex === i ? 3 : 1.8} fill="var(--accent-amber)" />
        ))}
        {data.map((d, i) =>
          i % 2 === 0 ? (
            <text key={d.label} x={x(i)} y={H - 3} textAnchor="middle" className="mono" fontSize={8} fill="var(--text-secondary)">
              {d.label}
            </text>
          ) : null,
        )}
        {hoverIndex !== null && (
          <line x1={x(hoverIndex)} y1={4} x2={x(hoverIndex)} y2={H - 14} stroke="var(--text-secondary)" strokeWidth={0.7} strokeDasharray="2 3" />
        )}
        {hoverIndex === null && (
          <text x={W - 4} y={y(data[data.length - 1].value) - 6} textAnchor="end" className="mono" fontSize={10} fontWeight={700} fill="var(--status-positive)">
            +{fmt1(data[data.length - 1].value)}%
          </text>
        )}
      </svg>
      {hoverIndex !== null && (
        <Bubble
          left={(x(hoverIndex) / W) * 100}
          title={data[hoverIndex].label}
          rows={[
            {
              label: "YoY",
              value: `${data[hoverIndex].value >= 0 ? "+" : ""}${fmt1(data[hoverIndex].value)}%`,
              color: data[hoverIndex].value >= 0 ? "var(--status-positive)" : "var(--status-negative)",
            },
          ]}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Profitability ratios over nine quarters; hover reads all three series. */
export function RatioTrend({
  quarters,
  series,
}: {
  quarters: string[];
  series: { key: string; color: string; values: number[] }[];
}) {
  const W = 880;
  const H = 212;
  // 0–20% fits the healthy issuers; loss-makers and high-ROE names widen the
  // axis in steps of 5 so gridlines stay on round numbers.
  const all = series.flatMap((s) => s.values);
  const lo = Math.min(0, Math.floor(Math.min(...all) / 5) * 5);
  const hi = Math.max(20, Math.ceil(Math.max(...all) / 5) * 5);
  const plotW = W - 70;
  const [svgRef, hoverIndex, hoverHandlers] = useHoverIndex(quarters.length, W, plotW, 8);

  const x = (i: number) => (i * plotW) / (quarters.length - 1) + 8;
  const y = (v: number) => 8 + (H - 30) * ((hi - v) / (hi - lo));

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="chart-wide"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        role="img"
        aria-label="Tren ROE, ROA dan ROI sembilan kuartal terakhir"
        {...hoverHandlers}
        style={{ display: "block", cursor: "crosshair" }}
      >
        {[0, 1, 2, 3, 4].map((k) => {
          const gy = 8 + ((H - 30) * k) / 4;
          return (
            <g key={k}>
              <line x1={8} y1={gy} x2={W - 56} y2={gy} stroke="var(--border-hairline)" strokeWidth={0.6} />
              <text x={W - 50} y={gy + 3.4} className="mono" fontSize={9} fill="var(--text-secondary)">
                {fmt1(hi - (hi - lo) * (k / 4)).replace(",0", "")}%
              </text>
            </g>
          );
        })}

        {hoverIndex !== null && (
          <line x1={x(hoverIndex)} y1={8} x2={x(hoverIndex)} y2={H - 22} stroke="var(--text-secondary)" strokeWidth={0.7} strokeDasharray="2 3" />
        )}

        {series.map((s) => (
          <g key={s.key}>
            <polyline
              points={s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={1.8}
            />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(v)}
                r={hoverIndex === i ? 3.4 : 2.4}
                fill="var(--bg-base)"
                stroke={s.color}
                strokeWidth={1.4}
              />
            ))}
            <text x={x(s.values.length - 1) + 6} y={y(s.values[s.values.length - 1]) + 3.4} className="mono" fontSize={10} fontWeight={700} fill={s.color}>
              {s.key}
            </text>
          </g>
        ))}

        <g className="x-ticks">
          {quarters.map((q, i) => (
            <text key={q} x={x(i)} y={H - 4} textAnchor="middle" className="mono" fontSize={9} fill="var(--text-secondary)">
              {q}
            </text>
          ))}
        </g>
      </svg>

      {hoverIndex !== null && (
        <Bubble
          left={(x(hoverIndex) / W) * 100}
          title={quarters[hoverIndex]}
          rows={series.map((s) => ({
            label: s.key,
            value: `${fmt1(s.values[hoverIndex!])}%`,
            color: s.color,
          }))}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Donut with centre total and an external legend. Hovering (or focusing) a
 * slice or its legend row puts that slice's code, share and value in the
 * centre and dims the rest.
 */
export function Donut({
  slices,
  centre,
  caption,
  unit = "",
}: {
  slices: { name: string; pct: number; color: string; value?: number }[];
  centre: string;
  caption: string;
  /** Formats a slice's `value` for the centre readout. */
  unit?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const r = 44;
  const c = 66;
  const circ = 2 * Math.PI * r;

  // Each slice's dash offset is the sum of the arcs before it. Computed as a
  // prefix sum rather than a running counter, which React's compiler rules
  // disallow mutating during render. The slice count is tiny, so the repeated
  // reduce costs nothing.
  const arcs = slices.map((s, i) => ({
    ...s,
    len: (circ * s.pct) / 100,
    offset: slices.slice(0, i).reduce((sum, prev) => sum + (circ * prev.pct) / 100, 0),
  }));
  const hot = active !== null ? slices[active] : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, height: "100%" }} onMouseLeave={() => setActive(null)}>
      <svg viewBox="0 0 132 132" width={132} height={132} role="img" aria-label={caption} style={{ flexShrink: 0 }}>
        {arcs.map((s, i) => (
          <circle
            key={s.name}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={active === i ? 22 : 17}
            strokeDasharray={`${s.len - 2.5} ${circ - s.len + 2.5}`}
            strokeDashoffset={-s.offset}
            transform={`rotate(-90 ${c} ${c})`}
            opacity={active === null || active === i ? 1 : 0.3}
            onMouseEnter={() => setActive(i)}
            style={{ cursor: "pointer", transition: "stroke-width 120ms, opacity 120ms" }}
          >
            <title>{`${s.name} · ${String(s.pct)}%${s.value !== undefined ? ` · Rp ${s.value.toLocaleString("id-ID")}${unit}` : ""}`}</title>
          </circle>
        ))}
        {hot ? (
          <>
            <text x={c} y={c - 10} textAnchor="middle" className="mono" fontSize={13} fontWeight={700} fill={hot.color}>
              {hot.name}
            </text>
            <text x={c} y={c + 5} textAnchor="middle" className="mono" fontSize={14} fontWeight={700} fill="var(--text-primary)">
              {hot.pct}%
            </text>
            {hot.value !== undefined && (
              <text x={c} y={c + 18} textAnchor="middle" className="mono" fontSize={8.5} fill="var(--text-secondary)">
                Rp {hot.value.toLocaleString("id-ID")}
                {unit}
              </text>
            )}
          </>
        ) : (
          <>
            <text x={c} y={c - 2} textAnchor="middle" className="mono" fontSize={12} fontWeight={700} fill="var(--text-primary)">
              {centre}
            </text>
            <text x={c} y={c + 11} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">
              {caption}
            </text>
          </>
        )}
      </svg>
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        {slices.map((s, i) => (
          <button
            key={s.name}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 4px",
              border: 0,
              background: active === i ? "var(--bg-row-alt)" : "transparent",
              opacity: active === null || active === i ? 1 : 0.5,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ width: 9, height: 9, background: s.color, flexShrink: 0 }} />
            <span className="mono" style={{ flexGrow: 1, fontSize: "calc(11px * var(--fs-scale))", fontWeight: 600 }}>
              {s.name}
            </span>
            <span className="mono dim" style={{ fontSize: "calc(11px * var(--fs-scale))" }}>
              {s.pct}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Tiny trend line inside a ratio tile. */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 112;
  const H = 24;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const x = (i: number) => (i * (W - 2)) / (values.length - 1) + 1;
  const y = (v: number) => H - 3 - ((v - lo) / span) * (H - 6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} fill="none" stroke={color} strokeWidth={1.4} />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={2} fill={color} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

/** Grouped bars used inside scripted chat answers. */
export function GroupedBars({
  labels,
  series,
  max,
  unit,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  max: number;
  unit: string;
}) {
  const W = 420;
  const H = 118;
  const groupW = W / labels.length;
  const barW = (groupW * 0.62) / series.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label={`Perbandingan ${series.map((s) => s.name).join(" dan ")}`}>
      {[0, 1, 2, 3].map((k) => (
        <line key={k} x1={0} y1={8 + ((H - 30) * k) / 3} x2={W} y2={8 + ((H - 30) * k) / 3} stroke="var(--border-hairline)" strokeWidth={0.5} />
      ))}
      {labels.map((label, i) => (
        <g key={label}>
          {series.map((s, j) => {
            const h = (s.values[i] / max) * (H - 30);
            const bx = i * groupW + groupW * 0.19 + j * (barW + 3);
            return (
              <g key={s.name}>
                <rect x={bx} y={H - 22 - h} width={barW} height={h} fill={s.color} />
                <text x={bx + barW / 2} y={H - 26 - h} textAnchor="middle" className="mono" fontSize={8.5} fontWeight={600} fill={s.color}>
                  {fmt1(s.values[i])}
                </text>
              </g>
            );
          })}
          <text x={i * groupW + groupW / 2} y={H - 8} textAnchor="middle" className="mono" fontSize={9} fill="var(--text-secondary)">
            {label}
          </text>
        </g>
      ))}
      {series.map((s, j) => (
        <g key={s.name}>
          <rect x={W - 116 + j * 56} y={4} width={8} height={8} fill={s.color} />
          <text x={W - 104 + j * 56} y={11} fontSize={9} fill="var(--text-secondary)">
            {s.name}
          </text>
        </g>
      ))}
      <text x={2} y={11} className="mono" fontSize={8} fill="var(--text-secondary)">
        {unit}
      </text>
    </svg>
  );
}
