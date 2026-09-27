"use client";

import { useState } from "react";
import { Shell } from "@/components/Shell";
import { Panel } from "@/components/Panel";
import { Term } from "@/components/Term";
import { useChat } from "@/components/chat/ChatContext";
import { Transcript, Composer } from "@/components/chat/Transcript";
import { CONVERSATIONS } from "@/data/chat";
import { KNOWLEDGE_SOURCES, RETRIEVED_DOCS, LINEAGE, GENERATED_QUERY, TOKEN_USAGE } from "@/data/feed";

/** History panel groups: this session's new chats first, then the stored ones. */
const GROUPS = Array.from(new Set(CONVERSATIONS.map((c) => c.group)));

export default function ChatPage() {
  const { activeId, sessionThreads, open, startNew } = useChat();
  const [sources, setSources] = useState(
    Object.fromEntries(KNOWLEDGE_SOURCES.map((s) => [s.label, s.enabled])) as Record<string, boolean>,
  );

  const history = [
    ...(sessionThreads.length ? [{ group: "Sesi ini", items: sessionThreads }] : []),
    ...GROUPS.map((g) => ({ group: g, items: CONVERSATIONS.filter((c) => c.group === g) })),
  ];

  const activeSources = Object.values(sources).filter(Boolean).length;

  return (
    <Shell
      subtitle="Asisten Riset Berbasis Pengetahuan"
      meta="AI CHAT · SUMBER: XBRL + IDX API + MODEL · 6.188 DOKUMEN TERINDEKS · JAWABAN SELALU BERSUMBER"
    >
      <main
        className="main-grid"
        style={{ "--col-left": "262px", "--col-right": "330px" } as React.CSSProperties}
      >
        {/* ---------------- left ---------------- */}
        <div className="col col-left">
          <Panel
            title="Riwayat Percakapan"
            extra={
              <button type="button" className="chat-pop-btn mono" onClick={startNew} title="Mulai percakapan baru">
                + BARU
              </button>
            }
            style={{ height: 330 }}
            bodyStyle={{ padding: 8, overflow: "auto" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {history.map((g) => (
                <div key={g.group}>
                  <span className="mono dim" style={{ display: "block", marginTop: 8, fontSize: "calc(9px * var(--fs-scale))", fontWeight: 600, letterSpacing: "0.08em" }}>
                    {g.group.toUpperCase()}
                  </span>
                  {g.items.map((item) => {
                    const on = item.id === activeId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => open(item.id)}
                        aria-current={on ? "true" : undefined}
                        className="truncate tap history-item"
                        title={item.title}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "5px 7px",
                          background: on ? "#1b212c" : "transparent",
                          borderLeft: `2px solid ${on ? "var(--accent-amber)" : "transparent"}`,
                          borderTop: 0,
                          borderRight: 0,
                          borderBottom: 0,
                          fontSize: "calc(11px * var(--fs-scale))",
                          color: on ? "var(--text-primary)" : "var(--text-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        {item.title}
                      </button>
                    );
                  })}
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
                    <span style={{ fontSize: "calc(11px * var(--fs-scale))" }}>{s.label}</span>
                    <span className="mono dim" style={{ fontSize: "calc(9px * var(--fs-scale))" }}>
                      {s.meta}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Panel>

          <Panel title="Batasan Akses" chip={<Term k="RBAC" label="PERAN: ANALIS" />} className="panel-grow" bodyStyle={{ padding: 10, overflow: "auto" }}>
            <p className="dim" style={{ margin: 0, fontSize: "calc(11px * var(--fs-scale))", lineHeight: 1.5 }}>
              Anda dapat membaca seluruh data pasar dan laporan publik. Notulen rapat internal dan proyeksi anggaran memerlukan persetujuan Direktur Investasi.
            </p>
          </Panel>
        </div>

        {/* ---------------- transcript ---------------- */}
        <div className="col col-main">
          <Transcript />
          <Composer />
        </div>

        {/* ---------------- context ---------------- */}
        <div className="col col-right">
          <Panel title="Dokumen Terambil" chip="5 DARI 6.188" style={{ height: 280 }} bodyStyle={{ padding: 8, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {RETRIEVED_DOCS.map((d) => (
                <div key={d.title} style={{ display: "flex", flexDirection: "column", gap: 3, padding: "7px 0", borderBottom: "1px solid var(--border-row)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      className="mono"
                      style={{ fontSize: "calc(8px * var(--fs-scale))", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-on-accent)", background: "var(--text-secondary)", padding: "1px 4px" }}
                    >
                      {d.tag}
                    </span>
                    <span className="truncate" style={{ flexGrow: 1, fontSize: "calc(11px * var(--fs-scale))", fontWeight: 600, width: "100%" }}>
                      {d.title}
                    </span>
                    <span className="mono" style={{ fontSize: "calc(9.5px * var(--fs-scale))", fontWeight: 600, color: d.score > 0.85 ? "var(--status-positive)" : "var(--accent-amber)" }}>
                      {d.score.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <span className="truncate dim" style={{ fontSize: "calc(10.5px * var(--fs-scale))", width: "100%" }}>
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
                fontSize: "calc(10px * var(--fs-scale))",
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
                    <span style={{ fontSize: "calc(11px * var(--fs-scale))", fontWeight: 600 }}>{l.step}</span>
                    <span className="mono dim" style={{ fontSize: "calc(9.5px * var(--fs-scale))" }}>
                      {l.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Penggunaan Token" chip="SESI INI" className="panel-grow" bodyStyle={{ padding: 10, overflow: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TOKEN_USAGE.map((t) => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="dim" style={{ width: 84, flexShrink: 0, fontSize: "calc(10.5px * var(--fs-scale))" }}>
                    {t.label}
                  </span>
                  <div style={{ flexGrow: 1, height: 7, background: "var(--bg-panel-header)" }}>
                    <div style={{ width: `${t.pct}%`, height: 7, background: "var(--accent-blue)" }} />
                  </div>
                  <span className="mono" style={{ width: 52, textAlign: "right", fontSize: "calc(10px * var(--fs-scale))" }}>
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
