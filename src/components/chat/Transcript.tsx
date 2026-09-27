"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GroupedBars } from "@/components/charts/MiniCharts";
import { ANSWERS, type AnswerBlock, type ChatAnswer } from "@/data/chat";
import { useChat } from "@/components/chat/ChatContext";

/**
 * The running conversation. Scrolls the newest question into view when a turn
 * is added, and back to the top when a different conversation is opened —
 * without that, clicking a history item looked like it did nothing because
 * the change happened below the fold.
 */
export function Transcript({ compact = false }: { compact?: boolean }) {
  const { turns, activeId } = useChat();
  const boxRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);
  const seen = useRef({ id: activeId, count: turns.length });

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (seen.current.id !== activeId) {
      box.scrollTo({ top: 0 });
    } else if (turns.length > seen.current.count && lastRef.current) {
      box.scrollTo({ top: lastRef.current.offsetTop - 8, behavior: "smooth" });
    }
    seen.current = { id: activeId, count: turns.length };
  }, [activeId, turns.length]);

  return (
    <div
      ref={boxRef}
      style={{
        position: "relative",
        flexGrow: 1,
        minHeight: 0,
        overflow: "auto",
        padding: compact ? "10px 10px" : "12px 14px",
        background: "var(--bg-surface)",
        border: compact ? 0 : "1px solid var(--border-hairline)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {turns.length === 0 && (
        <p className="dim" style={{ margin: 0, fontSize: "calc(12px * var(--fs-scale))", lineHeight: 1.5 }}>
          Percakapan baru. Pilih salah satu pertanyaan contoh di bawah, atau tulis pertanyaan Anda sendiri.
        </p>
      )}
      {turns.map((t, i) => (
        <div key={i} ref={i === turns.length - 1 ? lastRef : undefined} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                maxWidth: compact ? "88%" : "76%",
                padding: "9px 12px",
                background: "#1b212c",
                border: "1px solid var(--border-hairline)",
                borderRight: "2px solid var(--accent-amber)",
              }}
            >
              <p style={{ margin: 0, fontSize: "calc(12.5px * var(--fs-scale))", lineHeight: 1.5 }}>{t.question}</p>
              <span className="mono dim" style={{ display: "block", marginTop: 5, fontSize: "calc(9px * var(--fs-scale))", textAlign: "right" }}>
                Analis Portofolio
              </span>
            </div>
          </div>
          <AnswerBubble answer={t.answer} />
        </div>
      ))}
    </div>
  );
}

/** Suggestion chips and the question box. */
export function Composer({ compact = false }: { compact?: boolean }) {
  const { ask } = useChat();
  const [draft, setDraft] = useState("");

  function submit(text: string) {
    ask(text);
    setDraft("");
  }

  return (
    <div
      style={{
        flexShrink: 0,
        padding: "9px 10px",
        background: "var(--bg-surface)",
        border: compact ? 0 : "1px solid var(--border-hairline)",
        borderTop: "1px solid var(--border-hairline)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div className={compact ? "chat-chips-compact" : undefined} style={{ display: "flex", gap: 7, flexWrap: compact ? "nowrap" : "wrap" }}>
        {ANSWERS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => submit(a.question)}
            className="tap"
            title={a.question}
            style={{
              flexShrink: compact ? 0 : undefined,
              maxWidth: compact ? 220 : undefined,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: compact ? "nowrap" : undefined,
              textAlign: "left",
              padding: "5px 8px",
              fontSize: "calc(10.5px * var(--fs-scale))",
              color: "var(--text-secondary)",
              background: "transparent",
              border: "1px solid var(--border-hairline)",
              cursor: "pointer",
            }}
          >
            {a.question}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
        style={{ display: "flex", alignItems: "flex-end", gap: 8 }}
      >
        <label htmlFor={compact ? "prompt-popup" : "prompt"} className="sr-only">
          Tulis pertanyaan
        </label>
        <textarea
          id={compact ? "prompt-popup" : "prompt"}
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(draft);
            }
          }}
          placeholder="Tanyakan apa saja tentang harga saham, laporan keuangan, atau proyeksi portofolio…"
          style={{
            flexGrow: 1,
            minWidth: 0,
            padding: "8px 10px",
            resize: "none",
            background: "var(--bg-input)",
            border: "1px solid var(--border-hairline)",
            outline: "none",
            fontFamily: "var(--font-sans)",
            fontSize: "calc(12px * var(--fs-scale))",
            lineHeight: 1.45,
            color: "var(--text-primary)",
          }}
        />
        <button
          type="submit"
          className="mono"
          style={{
            height: 44,
            padding: compact ? "0 12px" : "0 18px",
            fontSize: "calc(11px * var(--fs-scale))",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--text-on-accent)",
            background: "var(--accent-amber)",
            border: 0,
            cursor: "pointer",
          }}
        >
          KIRIM
        </button>
      </form>
    </div>
  );
}

function AnswerBubble({ answer }: { answer: ChatAnswer }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-amber)", flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1.5 14 5v6l-6 3.5L2 11V5z" fill="none" stroke="var(--text-on-accent)" strokeWidth="1.3" />
          </svg>
        </span>
        <span className="mono" style={{ fontSize: "calc(10px * var(--fs-scale))", fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-amber)" }}>
          DANANTARA AI
        </span>
        <span className="mono dim" style={{ fontSize: "calc(9px * var(--fs-scale))" }}>
          dijawab dalam {answer.seconds} dtk · terskrip
        </span>
      </div>

      <div
        style={{
          padding: "11px 13px",
          background: "var(--bg-base)",
          border: "1px solid var(--border-hairline)",
          borderLeft: "2px solid var(--accent-amber)",
          display: "flex",
          flexDirection: "column",
          gap: 11,
          minWidth: 0,
        }}
      >
        {answer.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}

        {answer.citations.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 9, borderTop: "1px solid var(--border-hairline)" }}>
            {answer.citations.map((c, i) => (
              <span key={c} className="mono dim" style={{ fontSize: "calc(9px * var(--fs-scale))", border: "1px solid var(--border-hairline)", padding: "2px 6px" }}>
                {i + 1}. {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Block({ block }: { block: AnswerBlock }) {
  switch (block.type) {
    case "text":
      return <p style={{ margin: 0, fontSize: "calc(12.5px * var(--fs-scale))", lineHeight: 1.55 }}>{block.text}</p>;

    case "note":
      return (
        <p className="dim" style={{ margin: 0, fontSize: "calc(11.5px * var(--fs-scale))", lineHeight: 1.5 }}>
          {block.text}
        </p>
      );

    case "table":
      return (
        <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-hairline)", overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th key={h} className={i === 0 ? "left" : undefined} style={{ background: "var(--bg-input)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r) => (
                <tr key={r.cells[0]} style={{ background: "transparent" }}>
                  {r.cells.map((c, i) => (
                    <td
                      key={i}
                      className={i === 0 ? "left" : r.tone === "neg" ? "neg" : undefined}
                      style={{ fontFamily: i === 0 ? "var(--font-sans)" : undefined, fontSize: "calc(11px * var(--fs-scale))", fontWeight: i === 0 ? 400 : 600 }}
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "bars":
      return <GroupedBars labels={block.labels} series={block.series} max={block.max} unit={block.unit} />;

    case "callout":
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            padding: "9px 11px",
            background: "var(--bg-row-alt)",
            border: "1px solid var(--border-hairline)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span className="dim" style={{ fontSize: "calc(9.5px * var(--fs-scale))", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {block.label}
            </span>
            <span className="mono" style={{ fontSize: "calc(19px * var(--fs-scale))", fontWeight: 600 }}>
              {block.value}{" "}
              {block.delta && (
                <span className="pos" style={{ fontSize: "calc(12px * var(--fs-scale))" }}>
                  {block.delta}
                </span>
              )}
            </span>
          </div>
          {block.interval && (
            <>
              <span style={{ width: 1, height: 34, background: "var(--border-hairline)" }} />
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <span className="dim" style={{ fontSize: "calc(9.5px * var(--fs-scale))", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {block.intervalLabel}
                </span>
                <span className="mono" style={{ fontSize: "calc(13px * var(--fs-scale))" }}>
                  {block.interval}
                </span>
              </div>
            </>
          )}
          {block.href && (
            <Link
              href={block.href}
              className="mono"
              style={{ padding: "7px 11px", fontSize: "calc(10px * var(--fs-scale))", fontWeight: 600, textDecoration: "none", color: "var(--text-on-accent)", background: "var(--accent-amber)" }}
            >
              {block.cta}
            </Link>
          )}
        </div>
      );
  }
}
