"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GroupedBars } from "@/components/charts/MiniCharts";
import {
  ANSWERS,
  ATTACHMENT_LABEL,
  ATTACHMENT_LIMITS,
  DOCUMENT_EXTENSIONS,
  VIEWABLE_DOCUMENTS,
  formatBytes,
  type AnswerBlock,
  type AttachmentKind,
  type ChatAnswer,
} from "@/data/chat";
import { useChat, type Attachment } from "@/components/chat/ChatContext";
import { useSpeechInput } from "@/components/chat/useSpeechInput";

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
      className="chat-transcript"
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
              className={t.attachments?.length ? "chat-q chat-q-media" : "chat-q"}
              style={{
                maxWidth: compact ? "88%" : "76%",
                padding: "9px 12px",
                background: "#1b212c",
                border: "1px solid var(--border-hairline)",
                borderRight: "2px solid var(--accent-amber)",
              }}
            >
              {t.attachments && t.attachments.length > 0 && <MediaGrid files={t.attachments} />}
              {t.question && <p style={{ margin: 0, fontSize: "calc(12.5px * var(--fs-scale))", lineHeight: 1.5 }}>{t.question}</p>}
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

/** Attached media inside a question bubble, playable in place. */
function MediaGrid({ files }: { files: Attachment[] }) {
  return (
    <div className="chat-media">
      {files.map((f) => (
        <figure key={f.id} className={`chat-media-item chat-media-${f.kind}`}>
          {f.kind === "image" && (
            <a href={f.url} target="_blank" rel="noopener noreferrer" title={`Buka ${f.name} di tab baru`}>
              {/* Object URLs cannot go through next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.name} />
            </a>
          )}
          {f.kind === "video" && <video src={f.url} controls playsInline preload="metadata" />}
          {f.kind === "audio" && <audio src={f.url} controls preload="metadata" />}
          {f.kind === "document" && <DocumentLink file={f} />}
          {f.kind !== "document" && (
            <figcaption className="mono dim">
              <span className="truncate">{f.name}</span>
              <span>{formatBytes(f.size)}</span>
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

const extOf = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");

/** PDFs and plain text open in a tab; Office files can only be downloaded. */
function DocumentLink({ file }: { file: Attachment }) {
  const ext = extOf(file.name);
  const viewable = VIEWABLE_DOCUMENTS.includes(ext);
  return (
    <a
      className="chat-doc"
      href={file.url}
      {...(viewable ? { target: "_blank", rel: "noopener noreferrer" } : { download: file.name })}
      title={viewable ? `Buka ${file.name} di tab baru` : `Unduh ${file.name}`}
    >
      <DocBadge ext={ext} />
      <span className="chat-doc-meta">
        <span className="truncate">{file.name}</span>
        <span className="mono dim">
          {formatBytes(file.size)} · {viewable ? "BUKA" : "UNDUH"}
        </span>
      </span>
    </a>
  );
}

function DocBadge({ ext }: { ext: string }) {
  return <span className={`chat-doc-badge mono doc-${ext}`}>{(ext || "DOK").slice(0, 4).toUpperCase()}</span>;
}

function kindOf(file: File): AttachmentKind | null {
  const t = file.type.split("/")[0];
  if (t === "image" || t === "audio" || t === "video") return t;
  // Office files often arrive with an empty or vendor MIME type, so go by name.
  return DOCUMENT_EXTENSIONS.includes(extOf(file.name)) ? "document" : null;
}

const ACCEPT = ["image/*", "audio/*", "video/*", ...DOCUMENT_EXTENSIONS.map((e) => `.${e}`)].join(",");

/**
 * Suggestion chips, pending attachments and the question box. `docked` pins it
 * to the bottom of the viewport on screens where the transcript cannot fill
 * the window by itself (see `.is-docked` in globals.css).
 */
export function Composer({ compact = false, docked = false }: { compact?: boolean; docked?: boolean }) {
  const { ask } = useChat();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Attachment[]>([]);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  // Dictation appends to whatever was typed before the mic was switched on.
  const dictationBase = useRef("");
  const onDictation = useCallback((t: string) => setDraft(dictationBase.current + t), []);
  const speech = useSpeechInput(onDictation, setError);

  function toggleMic() {
    if (speech.listening) return speech.stop();
    dictationBase.current = draft.trim() ? `${draft.trim()} ` : "";
    setError("");
    speech.start();
  }

  // A docked composer floats over the page, so the page reserves its height.
  useEffect(() => {
    const el = rootRef.current;
    if (!docked || !el) return;
    const root = document.documentElement;
    const ro = new ResizeObserver(() => root.style.setProperty("--chat-dock-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--chat-dock-h");
    };
  }, [docked]);

  // Files left unsent when the composer goes away (popup closed) would keep
  // their object URLs alive for the rest of the session.
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  useEffect(() => () => pendingRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  function addFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    const room = ATTACHMENT_LIMITS.maxFiles - pending.length;
    const problems: string[] = [];
    const next: Attachment[] = [];
    for (const file of files) {
      const kind = kindOf(file);
      if (!kind) {
        problems.push(`${file.name} bukan gambar, suara, video, atau dokumen`);
      } else if (file.size > ATTACHMENT_LIMITS.maxBytes) {
        problems.push(`${file.name} melebihi ${formatBytes(ATTACHMENT_LIMITS.maxBytes)}`);
      } else if (next.length >= room) {
        problems.push(`maksimal ${ATTACHMENT_LIMITS.maxFiles} lampiran per pesan`);
        break;
      } else {
        seq.current += 1;
        next.push({ id: `att-${seq.current}`, name: file.name, kind, mime: file.type, size: file.size, url: URL.createObjectURL(file) });
      }
    }
    setPending((p) => [...p, ...next]);
    setError(problems.join(" · "));
  }

  function remove(id: string) {
    setPending((p) => {
      const gone = p.find((f) => f.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return p.filter((f) => f.id !== id);
    });
    setError("");
  }

  function submit(text: string) {
    if (!text.trim() && pending.length === 0) return;
    if (speech.listening) speech.stop();
    // Sent files now belong to the transcript; their URLs must stay valid.
    ask(text, pending);
    setDraft("");
    setPending([]);
    setError("");
  }

  return (
    <div
      ref={rootRef}
      className={["chat-composer", compact && "is-compact", docked && "is-docked", dragging && "is-drop"].filter(Boolean).join(" ")}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      <div className={compact ? "chat-chips chat-chips-compact" : "chat-chips"}>
        {ANSWERS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => submit(a.question)}
            className="tap"
            title={a.question}
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
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

      {pending.length > 0 && (
        <ul className="chat-tray" aria-label="Lampiran yang akan dikirim">
          {pending.map((f) => (
            <li key={f.id} className="chat-tray-item">
              <span className="chat-tray-thumb" aria-hidden="true">
                {f.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" />
                ) : f.kind === "video" ? (
                  <video src={f.url} muted preload="metadata" />
                ) : f.kind === "document" ? (
                  <DocBadge ext={extOf(f.name)} />
                ) : (
                  <AudioIcon />
                )}
              </span>
              <span className="chat-tray-meta">
                <span className="truncate" title={f.name}>
                  {f.name}
                </span>
                <span className="mono dim">
                  {ATTACHMENT_LABEL[f.kind].toUpperCase()} · {formatBytes(f.size)}
                </span>
              </span>
              <button type="button" className="chat-tray-x" onClick={() => remove(f.id)} aria-label={`Hapus ${f.name}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="chat-attach-error mono">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
        style={{ display: "flex", alignItems: "flex-end", gap: 8 }}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            // Lets the same file be picked again after removing it.
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="chat-attach-btn"
          onClick={() => fileRef.current?.click()}
          disabled={pending.length >= ATTACHMENT_LIMITS.maxFiles}
          aria-label="Lampirkan gambar, suara, video, atau dokumen"
          title={`Lampirkan gambar, suara, video, atau dokumen — PDF, Word, Excel, PowerPoint, CSV, TXT (maks. ${ATTACHMENT_LIMITS.maxFiles} file, ${formatBytes(ATTACHMENT_LIMITS.maxBytes)} per file). Bisa juga seret atau tempel ke sini.`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M10.5 4.5 5.6 9.4a1.4 1.4 0 0 0 2 2l5.2-5.2a2.8 2.8 0 0 0-4-4L3.6 7.4a4.2 4.2 0 0 0 6 6l4.4-4.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          {pending.length > 0 && <span className="chat-attach-count mono">{pending.length}</span>}
        </button>
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
          onPaste={(e) => {
            if (e.clipboardData.files.length === 0) return;
            e.preventDefault();
            addFiles(e.clipboardData.files);
          }}
          placeholder={
            speech.listening
              ? "Mendengarkan… silakan bicara"
              : pending.length
                ? "Tambahkan keterangan (opsional)…"
                : compact
                  ? "Ketik, bicara, atau lampirkan file…"
                  : "Tanyakan apa saja tentang harga saham, laporan keuangan, atau proyeksi portofolio — ketik, bicara, atau lampirkan file…"
          }
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
          type="button"
          className={speech.listening ? "chat-mic-btn is-on" : "chat-mic-btn"}
          onClick={toggleMic}
          disabled={!speech.supported}
          aria-pressed={speech.listening}
          aria-label={speech.listening ? "Hentikan input suara" : "Isi pertanyaan dengan suara"}
          title={
            !speech.supported
              ? "Browser ini belum mendukung input suara — gunakan Chrome, Edge, atau Safari"
              : speech.listening
                ? "Hentikan input suara"
                : "Isi pertanyaan dengan suara (Bahasa Indonesia). Suara diproses oleh layanan pengenalan suara browser."
          }
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" fill={speech.listening ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3" />
            <path d="M3 7.5a5 5 0 0 0 10 0M8 12.5v2.2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
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
      {!compact && (
        <p className="chat-hint mono dim" style={{ margin: 0, fontSize: "calc(9px * var(--fs-scale))" }}>
          LAMPIRAN: GAMBAR · SUARA · VIDEO · DOKUMEN — MAKS. {ATTACHMENT_LIMITS.maxFiles} FILE, {formatBytes(ATTACHMENT_LIMITS.maxBytes)} PER FILE. SERET, TEMPEL, ATAU KLIK
          IKON KLIP; FILE TIDAK MENINGGALKAN BROWSER ANDA. IKON MIKROFON: DIKTE PERTANYAAN.
        </p>
      )}
    </div>
  );
}

function AudioIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16">
      <path d="M2 6.5v3M5 4v8M8 2v12M11 5v6M14 7v2" stroke="var(--accent-amber)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
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
