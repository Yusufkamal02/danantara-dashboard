"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChat } from "@/components/chat/ChatContext";
import { Transcript, Composer } from "@/components/chat/Transcript";

/**
 * Floating assistant available on every screen. It shares its transcript with
 * the full Chat AI screen, where it hides itself — the conversation is already
 * on the page there.
 */
export function ChatPopup() {
  const pathname = usePathname();
  const { popupOpen, setPopupOpen, startNew } = useChat();
  const onChatScreen = pathname === "/chat";

  useEffect(() => {
    if (!popupOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopupOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popupOpen, setPopupOpen]);

  if (onChatScreen) return null;

  return (
    <>
      {popupOpen && (
        <section className="chat-pop" role="dialog" aria-label="Chat AI Danantara">
          <div className="panel-head" style={{ minHeight: 30 }}>
            <span className="panel-title">Chat AI · terskrip</span>
            <span style={{ flexGrow: 1 }} />
            <button type="button" className="chat-pop-btn mono" onClick={startNew} title="Mulai percakapan baru">
              + BARU
            </button>
            <Link href="/chat" className="chat-pop-btn mono" onClick={() => setPopupOpen(false)} title="Buka layar Chat AI lengkap">
              LAYAR PENUH
            </Link>
            <button type="button" className="chat-pop-btn mono" onClick={() => setPopupOpen(false)} aria-label="Tutup chat">
              ✕
            </button>
          </div>
          <Transcript compact />
          <Composer compact />
        </section>
      )}

      <button
        type="button"
        className="chat-fab mono"
        aria-expanded={popupOpen}
        onClick={() => setPopupOpen(!popupOpen)}
        title={popupOpen ? "Tutup Chat AI" : "Buka Chat AI"}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 1.5 14 5v6l-6 3.5L2 11V5z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        {popupOpen ? "TUTUP" : "TANYA AI"}
      </button>
    </>
  );
}
