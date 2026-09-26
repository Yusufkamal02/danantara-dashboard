import type { ReactNode, CSSProperties } from "react";

/** Terminal panel: 22px header strip over a padded body. */
export function Panel({
  title,
  chip,
  extra,
  children,
  bodyStyle,
  style,
  className,
}: {
  title: ReactNode;
  chip?: ReactNode;
  /** Optional right-aligned element after the chip, e.g. a live quote. */
  extra?: ReactNode;
  children: ReactNode;
  bodyStyle?: CSSProperties;
  style?: CSSProperties;
  /** Layout classes such as `panel-grow`, which media queries can target. */
  className?: string;
}) {
  return (
    <section className={className ? `panel ${className}` : "panel"} style={style}>
      <div className="panel-head">
        <span className="panel-title">{title}</span>
        <span style={{ flexGrow: 1 }} />
        {chip && <span className="chip">{chip}</span>}
        {extra}
      </div>
      <div className="panel-body" style={bodyStyle}>
        {children}
      </div>
    </section>
  );
}

/** KPI card with a coloured rule on top showing direction. */
export function KpiTile({
  label,
  value,
  delta,
  foot,
  up,
}: {
  label: ReactNode;
  value: string;
  delta: ReactNode;
  foot: ReactNode;
  up: boolean;
}) {
  const color = up ? "var(--status-positive)" : "var(--status-negative)";
  return (
    <div
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
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
      <span className="mono" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.05 }}>
        {value}
      </span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color, whiteSpace: "nowrap" }}>
          {delta}
        </span>
        <span
          className="dim"
          style={{ fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {foot}
        </span>
      </span>
    </div>
  );
}

/** Label + value + proportional bar, used for sector and peer breakdowns. */
export function BarRow({
  label,
  value,
  fraction,
  color,
}: {
  label: ReactNode;
  value: string;
  /** 0–1 share of the full track width. */
  fraction: number;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ flexGrow: 1, fontSize: 11, minWidth: 0 }}>{label}</span>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color }}>
          {value}
        </span>
      </div>
      <div style={{ height: 7, background: "var(--bg-panel-header)" }}>
        <div
          style={{
            width: `${Math.max(2, fraction * 100)}%`,
            height: 7,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

const LEVEL_COLOR = {
  kritis: "var(--status-negative)",
  perhatian: "var(--accent-amber)",
  info: "var(--accent-blue)",
} as const;

/** Status pill + wrapping body text, used for alerts and follow-ups. */
export function AlertRow({
  level,
  label,
  children,
}: {
  level: keyof typeof LEVEL_COLOR;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 7,
        alignItems: "flex-start",
        paddingBottom: 7,
        borderBottom: "1px solid var(--border-row)",
      }}
    >
      <span
        className="mono"
        style={{
          flexShrink: 0,
          marginTop: 1,
          padding: "2px 4px",
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: "var(--text-on-accent)",
          background: LEVEL_COLOR[level],
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 11, lineHeight: 1.35 }}>{children}</span>
    </div>
  );
}

/** Proportional treemap laid out as two rows of fixed-share cells. */
export function Treemap({
  rows,
  labelSize = 10,
}: {
  rows: { name: string; pct: number; color: string; flex: number }[][];
  labelSize?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 2, flexGrow: i === 0 ? 1.35 : 1, minHeight: 0 }}>
          {row.map((cell) => (
            <div
              key={cell.name}
              style={{
                flexGrow: cell.flex,
                flexBasis: 0,
                minWidth: 0,
                padding: "5px 6px",
                background: cell.color,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: labelSize,
                  fontWeight: 600,
                  color: "var(--text-on-accent)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {cell.name}
              </span>
              <span
                className="mono"
                style={{ fontSize: labelSize + 1, fontWeight: 700, color: "var(--text-on-accent)" }}
              >
                {cell.pct}%
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
