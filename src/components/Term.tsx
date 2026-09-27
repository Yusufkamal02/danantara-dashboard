"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY } from "@/data/glossary";

/** Gap between the tooltip and the viewport edge, and between it and the cursor. */
const EDGE = 8;
const CURSOR_GAP = 14;

type Anchor =
  /** Mouse: follow the pointer. */
  | { kind: "point"; x: number; y: number }
  /** Keyboard focus or tap: sit under the trigger itself. */
  | { kind: "rect"; rect: DOMRect };

/**
 * Places a box of size w×h next to the anchor without leaving the viewport.
 * Prefers below-right of the cursor; flips to the left and/or above when the
 * preferred side would overflow, then clamps as a last resort (a tooltip wider
 * or taller than the screen itself).
 */
function place(anchor: Anchor, w: number, h: number): { left: number; top: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left: number;
  let top: number;
  if (anchor.kind === "point") {
    left = anchor.x + CURSOR_GAP;
    if (left + w > vw - EDGE) left = anchor.x - CURSOR_GAP - w;
    top = anchor.y + CURSOR_GAP;
    if (top + h > vh - EDGE) top = anchor.y - CURSOR_GAP - h;
  } else {
    const r = anchor.rect;
    left = r.left;
    if (left + w > vw - EDGE) left = r.right - w;
    top = r.bottom + 6;
    if (top + h > vh - EDGE) top = r.top - 6 - h;
  }

  left = Math.min(Math.max(EDGE, left), Math.max(EDGE, vw - EDGE - w));
  top = Math.min(Math.max(EDGE, top), Math.max(EDGE, vh - EDGE - h));
  return { left, top };
}

/**
 * A dashboard term with its knowledge-base definition on hover and focus.
 *
 * Keyboard users reach it by Tab (it is a real button), so the tooltip is not
 * mouse-only. `label` overrides the visible text when it differs from the
 * glossary key — e.g. <Term k="pp" label="-0,7 pp QoQ" />.
 *
 * The tooltip is portalled to <body> with fixed positioning: panels clip their
 * overflow, and a tooltip rendered inside one would be cut off at its edge.
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
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const id = useId();
  const open = anchor !== null;

  // Measure after render, before paint, so the box never flashes off-screen.
  useLayoutEffect(() => {
    if (!anchor || !tipRef.current) return;
    const { width, height } = tipRef.current.getBoundingClientRect();
    setPos(place(anchor, width, height));
  }, [anchor]);

  // A fixed tooltip would drift away from its trigger on scroll; close it.
  useLayoutEffect(() => {
    if (!open) return;
    const close = () => setAnchor(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  // An unknown key renders as plain text rather than a dead tooltip trigger.
  if (!entry) return <>{label ?? k}</>;

  const hide = () => {
    setAnchor(null);
    setPos(null);
  };

  return (
    <>
      <button
        type="button"
        className={`term ${className ?? ""}`}
        aria-describedby={open ? id : undefined}
        onMouseEnter={(e) => setAnchor({ kind: "point", x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => setAnchor({ kind: "point", x: e.clientX, y: e.clientY })}
        onMouseLeave={hide}
        onFocus={(e) => {
          // Mouse clicks also focus the button; keep following the cursor then.
          if (!open) setAnchor({ kind: "rect", rect: e.currentTarget.getBoundingClientRect() });
        }}
        onBlur={hide}
        onClick={(e) => {
          if (e.detail === 0 || !open) setAnchor({ kind: "rect", rect: e.currentTarget.getBoundingClientRect() });
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") hide();
        }}
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

      {open &&
        createPortal(
          <span
            ref={tipRef}
            id={id}
            role="tooltip"
            className="term-tip"
            style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden" }}
          >
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
              {entry.ref ? `Knowledge Base ${entry.ref}` : "Istilah tambahan PoC · belum ada di Knowledge Base"}
              {entry.undefinedFormula ? " · formula belum ditetapkan" : ""}
            </span>
          </span>,
          document.body,
        )}
    </>
  );
}
