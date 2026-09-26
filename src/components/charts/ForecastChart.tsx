"use client";

import { useMemo, useRef, useState } from "react";
import { buildForecast } from "@/data/forecast";

const W = 880;
const H = 340;
const PLOT_W = W - 64;
const LO = 2900;
const HI = 7600;

const id = (n: number) => n.toLocaleString("id-ID");

/**
 * Fan chart: realised history, central projection, and 50% / 80% intervals.
 * Hovering any month reads out the value and, on the forecast leg, the bounds.
 */
export function ForecastChart() {
  const { points, splitIndex, target } = useMemo(() => buildForecast(), []);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const x = (i: number) => (i * PLOT_W) / (points.length - 1) + 8;
  const y = (v: number) => 10 + (H - 46) * ((HI - v) / (HI - LO));

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W - 8;
    if (px < 0 || px > PLOT_W) return setHover(null);
    const i = Math.round((px / PLOT_W) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  }

  const band = (loKey: "lo50" | "lo80", hiKey: "hi50" | "hi80") => {
    const leg = points.slice(splitIndex);
    const up = leg.map((p, i) => `${x(splitIndex + i).toFixed(1)},${y(p[hiKey]!).toFixed(1)}`);
    const down = leg
      .slice()
      .reverse()
      .map((p, i) => `${x(points.length - 1 - i).toFixed(1)},${y(p[loKey]!).toFixed(1)}`);
    return [...up, ...down].join(" ");
  };

  const historyLine = points
    .slice(0, splitIndex + 1)
    .map((p, i) => `${x(i).toFixed(1)},${y(p.actual!).toFixed(1)}`)
    .join(" ");

  const forecastLine = points
    .slice(splitIndex)
    .map((p, i) => `${x(splitIndex + i).toFixed(1)},${y(p.base!).toFixed(1)}`)
    .join(" ");

  const active = hover !== null ? points[hover] : null;
  const axisLabels = Array.from(new Set(points.map((p) => p.label)));

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        role="img"
        aria-label="Proyeksi harga BBRI 14 bulan ke depan dengan interval keyakinan. Arahkan kursor untuk melihat angka."
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: "block", cursor: "crosshair" }}
      >
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const gy = 10 + ((H - 46) * k) / 5;
          return (
            <g key={k}>
              <line x1={8} y1={gy} x2={W - 56} y2={gy} stroke="var(--border-hairline)" strokeWidth={0.6} />
              <text x={W - 50} y={gy + 3.4} className="mono" fontSize={9} fill="var(--text-secondary)">
                {id(Math.round(HI - ((HI - LO) * k) / 5))}
              </text>
            </g>
          );
        })}

        <polygon points={band("lo80", "hi80")} fill="var(--accent-amber)" opacity={0.13} />
        <polygon points={band("lo50", "hi50")} fill="var(--accent-amber)" opacity={0.22} />

        <line x1={x(splitIndex)} y1={10} x2={x(splitIndex)} y2={H - 36} stroke="var(--text-secondary)" strokeWidth={0.9} strokeDasharray="4 4" />
        <text x={x(splitIndex) + 6} y={24} className="mono" fontSize={9} fontWeight={700} fill="var(--text-secondary)">
          PROYEKSI →
        </text>
        <text x={x(splitIndex) - 6} y={24} textAnchor="end" className="mono" fontSize={9} fontWeight={700} fill="var(--text-secondary)">
          ← REALISASI
        </text>

        <polyline points={historyLine} fill="none" stroke="var(--text-primary)" strokeWidth={1.7} />
        <polyline points={forecastLine} fill="none" stroke="var(--accent-amber)" strokeWidth={1.9} strokeDasharray="5 3" />

        <circle cx={x(points.length - 1)} cy={y(target)} r={3.2} fill="var(--accent-amber)" />
        <rect x={x(points.length - 1) - 34} y={y(target) - 26} width={72} height={17} fill="var(--accent-amber)" />
        <text x={x(points.length - 1) + 2} y={y(target) - 14} textAnchor="middle" className="mono" fontSize={10} fontWeight={700} fill="var(--text-on-accent)">
          {id(target)}
        </text>

        {axisLabels.map((label) => {
          const i = points.findIndex((p) => p.label === label);
          return (
            <text key={label} x={x(i)} y={H - 18} textAnchor="middle" className="mono" fontSize={9} fill="var(--text-secondary)">
              {label}
            </text>
          );
        })}

        {[
          { name: "Realisasi", color: "var(--text-primary)" },
          { name: "Proyeksi dasar", color: "var(--accent-amber)" },
          { name: "Interval 50%", color: "#7a5a1a" },
          { name: "Interval 80%", color: "#4a3a16" },
        ].map((l, i) => (
          <g key={l.name}>
            <rect x={10 + i * 118} y={H - 11} width={10} height={4} fill={l.color} />
            <text x={24 + i * 118} y={H - 7} fontSize={9.5} fill="var(--text-secondary)">
              {l.name}
            </text>
          </g>
        ))}

        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} y1={10} x2={x(hover)} y2={H - 36} stroke="var(--text-secondary)" strokeWidth={0.7} strokeDasharray="2 3" />
            <circle
              cx={x(hover)}
              cy={y((points[hover].actual ?? points[hover].base)!)}
              r={3}
              fill={points[hover].actual !== undefined ? "var(--text-primary)" : "var(--accent-amber)"}
            />
          </g>
        )}
      </svg>

      {active && hover !== null && (
        <div
          style={{
            position: "absolute",
            top: 8,
            [(x(hover) / W) * 100 > 55 ? "right" : "left"]:
              `${(x(hover) / W) * 100 > 55 ? 100 - (x(hover) / W) * 100 + 2 : (x(hover) / W) * 100 + 2}%`,
            minWidth: 150,
            padding: "7px 9px",
            background: "#11161f",
            border: "1px solid var(--border-hairline)",
            boxShadow: "0 6px 20px rgba(0,0,0,.55)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          <div className="mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-amber)", marginBottom: 4 }}>
            {active.label} · {active.actual !== undefined ? "REALISASI" : "PROYEKSI"}
          </div>
          {active.actual !== undefined ? (
            <Row label="Harga" value={id(active.actual)} />
          ) : (
            <>
              <Row label="Dasar" value={id(active.base!)} color="var(--accent-amber)" />
              <Row label="Interval 50%" value={`${id(active.lo50!)} – ${id(active.hi50!)}`} />
              <Row label="Interval 80%" value={`${id(active.lo80!)} – ${id(active.hi80!)}`} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
      <span className="mono dim" style={{ fontSize: 9.5 }}>
        {label}
      </span>
      <span className="mono" style={{ fontSize: 10.5, fontWeight: 600, flexGrow: 1, textAlign: "right", color }}>
        {value}
      </span>
    </div>
  );
}
