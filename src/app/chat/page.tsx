"use client";

import { useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { Panel } from "@/components/Panel";
import { Term } from "@/components/Term";
import { GroupedBars } from "@/components/charts/MiniCharts";
import { ANSWERS, FALLBACK, type AnswerBlock, type ChatAnswer } from "@/data/chat";
import { KNOWLEDGE_SOURCES, CHAT_HISTORY, RETRIEVED_DOCS, LINEAGE, GENERATED_QUERY, TOKEN_USAGE } from "@/data/feed";

interface Turn {
  question: string;
  answer: ChatAnswer;
}

export default function ChatPage() {
  const [turns, setTurns] = useState<Turn[]>([{ question: ANSWERS[0].question, answer: ANSWERS[0] }]);
  const [draft, setDraft] = useState("");
  const [sources, setSources] = useState(
    Object.fromEntries(KNOWLEDGE_SOURCES.map((s) => [s.label, s.enabled])) as Record<string, boolean>,
  );

  function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    // Scripted: match a known question, else explain that this is a mockup.
    const hit = ANSWERS.find(
      (a) => a.question.toLowerCase() === text.toLowerCase() || a.question.toLowerCase().includes(text.toLowerCase()),
    );
    setTurns((t) => [...t, { question: text, answer: hit ?? { ...FALLBACK, question: text } }]);
    setDraft("");
  }

  const activeSources = Object.values(sources).filter(Boolean).length;

  return (
    <Shell
      subtitle="Asisten Riset Berbasis Pengetahuan"
      command=">AI CHAT · SUMBER: XBRL + IDX API + MODEL<GO>"
      meta="6.188 DOKUMEN TERINDEKS · JAWABAN SELALU BERSUMBER"
    >
      <main className="main-grid" style={{ gridTemplateColumns: "262px minmax(0, 1fr) 330px" }}>
        {/* ---------------- left ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <Panel title="Riwayat Percakapan" chip="BARU" style={{ height: 330 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {CHAT_HISTORY.map((g) => (
                <div key={g.group}>
                  <span className="mono dim" style={{ display: "block", marginTop: 8, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em" }}>
                    {g.group.toUpperCase()}
                  </span>
                  {g.items.map((item, i) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => ask(item)}
                      className="truncate"
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "5px 7px",
                        background: g.group === "Hari ini" && i === 0 ? "#1b212c" : "transparent",
                        borderLeft: `2px solid ${g.group === "Hari ini" && i === 0 ? "var(--accent-amber)" : "transparent"}`,
                        borderTop: 0,
                        borderRight: 0,
                        borderBottom: 0,
                        fontSize: 11,
                        color: g.group === "Hari ini" && i === 0 ? "var(--text-primary)" : "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Basis Pengetahuan" chip={`${activeSources} AKTIF`} style={{ height: 268 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {KNOWLEDGE_SOURCES.map((s) => (
                <label
                  key={s.label}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "5px 0",
                    borderBottom: "1px solid var(--border-row)",
                    cursor: s.locked ? "not-allowed" : "pointer",
                    opacity: s.locked ? 0.6 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={sources[s.label]}
                    disabled={s.locked}
                    onChange={() => setSources((v) => ({ ...v, [s.label]: !v[s.label] }))}
                    style={{ marginTop: 2, width: 12, height: 12, accentColor: "var(--accent-amber)" }}
                  />
                  <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11 }}>{s.label}</span>
                    <span className="mono dim" style={{ fontSize: 9 }}>
                      {s.meta}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Panel>

          <Panel title="Batasan Akses" chip={<Term k="RBAC" label="PERAN: ANALIS" />} style={{ flexGrow: 1, minHeight: 0 }} bodyStyle={{ padding: 10, overflow: "auto" }}>
            <p className="dim" style={{ margin: 0, fontSize: 11, lineHeight: 1.5 }}>
              Anda dapat membaca seluruh data pasar dan laporan publik. Notulen rapat internal dan proyeksi anggaran memerlukan persetujuan Direktur Investasi.
            </p>
          </Panel>
        </div>

        {/* ---------------- transcript ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <div
            style={{
              flexGrow: 1,
              minHeight: 0,
              overflow: "auto",
              padding: "12px 14px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-hairline)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {turns.map((t, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div
                    style={{
                      maxWidth: "76%",
                      padding: "9px 12px",
                      background: "#1b212c",
                      border: "1px solid var(--border-hairline)",
                      borderRight: "2px solid var(--accent-amber)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>{t.question}</p>
                    <span className="mono dim" style={{ display: "block", marginTop: 5, fontSize: 9, textAlign: "right" }}>
                      Analis Portofolio
                    </span>
                  </div>
                </div>
                <AnswerBubble answer={t.answer} />
              </div>
            ))}
          </div>

          <div
            style={{
              flexShrink: 0,
              padding: "9px 10px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-hairline)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {ANSWERS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => ask(a.question)}
                  style={{
                    textAlign: "left",
                    padding: "5px 8px",
                    fontSize: 10.5,
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
                ask(draft);
              }}
              style={{ display: "flex", alignItems: "flex-end", gap: 8 }}
            >
              <label htmlFor="prompt" className="sr-only">
                Tulis pertanyaan
              </label>
              <textarea
                id="prompt"
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(draft);
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
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                className="mono"
                style={{
                  height: 44,
                  padding: "0 18px",
                  fontSize: 11,
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
        </div>

        {/* ---------------- context ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <Panel title="Dokumen Terambil" chip="5 DARI 6.188" style={{ height: 280 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {RETRIEVED_DOCS.map((d) => (
                <div key={d.title} style={{ display: "flex", flexDirection: "column", gap: 3, padding: "7px 0", borderBottom: "1px solid var(--border-row)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      className="mono"
                      style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-on-accent)", background: "var(--text-secondary)", padding: "1px 4px" }}
                    >
                      {d.tag}
                    </span>
                    <span className="truncate" style={{ flexGrow: 1, fontSize: 11, fontWeight: 600, width: "100%" }}>
                      {d.title}
                    </span>
                    <span className="mono" style={{ fontSize: 9.5, fontWeight: 600, color: d.score > 0.85 ? "var(--status-positive)" : "var(--accent-amber)" }}>
                      {d.score.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <span className="truncate dim" style={{ fontSize: 10.5, width: "100%" }}>
                    {d.snippet}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Kueri yang Dihasilkan" chip="DAPAT DISUNTING" style={{ height: 216 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
            <pre
              className="mono"
              style={{
                margin: 0,
                padding: "9px 10px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-hairline)",
                fontSize: 10,
                lineHeight: 1.55,
                color: "var(--status-positive)",
                whiteSpace: "pre-wrap",
              }}
            >
              {GENERATED_QUERY}
            </pre>
          </Panel>

          <Panel title={<Term k="RAG" label="Jejak Penalaran" />} chip="DAPAT DIAUDIT" style={{ height: 196 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {LINEAGE.map((l, i) => (
                <div key={l.step} style={{ display: "flex", gap: 9 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--status-positive)", marginTop: 3 }} />
                    {i < LINEAGE.length - 1 && <span style={{ flexGrow: 1, width: 1, background: "var(--border-hairline)" }} />}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingBottom: i < LINEAGE.length - 1 ? 10 : 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{l.step}</span>
                    <span className="mono dim" style={{ fontSize: 9.5 }}>
                      {l.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Penggunaan Token" chip="SESI INI" style={{ flexGrow: 1, minHeight: 0 }} bodyStyle={{ padding: 10, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TOKEN_USAGE.map((t) => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="dim" style={{ width: 84, flexShrink: 0, fontSize: 10.5 }}>
                    {t.label}
                  </span>
                  <div style={{ flexGrow: 1, height: 7, background: "var(--bg-panel-header)" }}>
                    <div style={{ width: `${t.pct}%`, height: 7, background: "var(--accent-blue)" }} />
                  </div>
                  <span className="mono" style={{ width: 52, textAlign: "right", fontSize: 10 }}>
                    {t.value}
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

function AnswerBubble({ answer }: { answer: ChatAnswer }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-amber)" }}>
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 1.5 14 5v6l-6 3.5L2 11V5z" fill="none" stroke="var(--text-on-accent)" strokeWidth="1.3" />
          </svg>
        </span>
        <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--accent-amber)" }}>
          DANANTARA AI
        </span>
        <span className="mono dim" style={{ fontSize: 9 }}>
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
        }}
      >
        {answer.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}

        {answer.citations.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 9, borderTop: "1px solid var(--border-hairline)" }}>
            {answer.citations.map((c, i) => (
              <span key={c} className="mono dim" style={{ fontSize: 9, border: "1px solid var(--border-hairline)", padding: "2px 6px" }}>
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
      return <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55 }}>{block.text}</p>;

    case "note":
      return (
        <p className="dim" style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5 }}>
          {block.text}
        </p>
      );

    case "table":
      return (
        <div style={{ background: "var(--bg-input)", border: "1px solid var(--border-hairline)" }}>
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
                      style={{ fontFamily: i === 0 ? "var(--font-sans)" : undefined, fontSize: 11, fontWeight: i === 0 ? 400 : 600 }}
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 11px", background: "var(--bg-row-alt)", border: "1px solid var(--border-hairline)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span className="dim" style={{ fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {block.label}
            </span>
            <span className="mono" style={{ fontSize: 19, fontWeight: 600 }}>
              {block.value}{" "}
              {block.delta && (
                <span className="pos" style={{ fontSize: 12 }}>
                  {block.delta}
                </span>
              )}
            </span>
          </div>
          {block.interval && (
            <>
              <span style={{ width: 1, height: 34, background: "var(--border-hairline)" }} />
              <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <span className="dim" style={{ fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {block.intervalLabel}
                </span>
                <span className="mono" style={{ fontSize: 13 }}>
                  {block.interval}
                </span>
              </div>
            </>
          )}
          {block.href && (
            <Link
              href={block.href}
              className="mono"
              style={{ padding: "7px 11px", fontSize: 10, fontWeight: 600, textDecoration: "none", color: "var(--text-on-accent)", background: "var(--accent-amber)" }}
            >
              {block.cta}
            </Link>
          )}
        </div>
      );
  }
}
