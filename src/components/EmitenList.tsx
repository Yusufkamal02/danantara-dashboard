"use client";

import { HOLDINGS, type Holding } from "@/data/holdings";

/**
 * Selectable list of portfolio issuers, sorted by position value. Each row is
 * a real button so it can be reached and chosen from the keyboard.
 */
export function EmitenList({
  selected,
  onSelect,
  metric,
}: {
  selected: string;
  onSelect: (ticker: string) => void;
  /** Right-hand figure for each row. */
  metric: (h: Holding) => { text: string; tone?: "pos" | "neg" | "dim" };
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }} role="listbox" aria-label="Emiten portofolio">
      {HOLDINGS.map((e) => {
        const on = e.ticker === selected;
        const m = metric(e);
        return (
          <button
            key={e.ticker}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => onSelect(e.ticker)}
            className="tap history-item"
            style={{
              display: "grid",
              gridTemplateColumns: "48px minmax(0,1fr) auto",
              gap: 6,
              alignItems: "center",
              width: "100%",
              textAlign: "left",
              padding: "5px 6px",
              background: on ? "#1b212c" : "transparent",
              border: 0,
              borderLeft: `2px solid ${on ? "var(--accent-amber)" : "transparent"}`,
              borderBottom: "1px solid var(--border-row)",
              color: on ? "var(--text-primary)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <span className="mono" style={{ fontSize: "calc(11px * var(--fs-scale))", fontWeight: 700 }}>
              {e.ticker}
            </span>
            <span className="truncate" style={{ fontSize: "calc(11px * var(--fs-scale))" }}>
              {e.name}
            </span>
            <span className={`mono ${m.tone ?? ""}`} style={{ fontSize: "calc(10px * var(--fs-scale))", fontWeight: 600, textAlign: "right" }}>
              {m.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}
