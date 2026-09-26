"use client";

import { useId, useState } from "react";
import { GLOSSARY } from "@/data/glossary";

/**
 * A dashboard term with its knowledge-base definition on hover and focus.
 *
 * Keyboard users reach it by Tab (it is a real button), so the tooltip is not
 * mouse-only. `label` overrides the visible text when it differs from the
 * glossary key — e.g. <Term k="pp" label="-0,7 pp QoQ" />.
 */
export function Term({
  k,
  label,
  className,
}: {
  k: string;
  label?: React.ReactNode;
  className?: string;
}) {
  const entry = GLOSSARY[k];
  const [open, setOpen] = useState(false);
  const id = useId();

  // An unknown key renders as plain text rather than a dead tooltip trigger.
  if (!entry) return <>{label ?? k}</>;

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className={`term ${className ?? ""}`}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: 0,
          background: "none",
          border: 0,
          borderBottom: "1px dotted var(--text-secondary)",
          font: "inherit",
          color: "inherit",
          cursor: "help",
        }}
      >
        {label ?? k}
      </button>

      {open && (
        <span id={id} role="tooltip" className="term-tip">
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-mono)",
              fontSize: "calc(10px * var(--fs-scale))",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "var(--accent-amber)",
            }}
          >
            {k}
            {entry.full ? ` — ${entry.full}` : ""}
          </span>
          <span
            style={{
              display: "block",
              marginTop: 4,
              fontFamily: "var(--font-sans)",
              fontSize: "calc(11.5px * var(--fs-scale))",
              lineHeight: 1.45,
              color: "var(--text-primary)",
            }}
          >
            {entry.body}
          </span>
          <span
            style={{
              display: "block",
              marginTop: 6,
              fontFamily: "var(--font-mono)",
              fontSize: "calc(9px * var(--fs-scale))",
              color: "var(--text-secondary)",
            }}
          >
            Knowledge Base {entry.ref}
            {entry.undefinedFormula ? " · formula belum ditetapkan" : ""}
          </span>
        </span>
      )}
    </span>
  );
}
