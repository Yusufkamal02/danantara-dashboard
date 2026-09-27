"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { ALL_ANSWERS, CONVERSATIONS, FALLBACK, type ChatAnswer } from "@/data/chat";

export interface Turn {
  question: string;
  answer: ChatAnswer;
}

export interface Thread {
  id: string;
  title: string;
}

interface ChatState {
  /** Turns of the conversation on screen. */
  turns: Turn[];
  activeId: string;
  /** Conversations started in this browser session, newest first. */
  sessionThreads: Thread[];
  ask: (question: string) => void;
  open: (id: string) => void;
  startNew: () => void;
  popupOpen: boolean;
  setPopupOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatState | null>(null);

const norm = (s: string) => s.trim().toLowerCase();

/** Scripted: match a known question or history title, else explain the mockup. */
function answerFor(text: string): ChatAnswer {
  const q = norm(text);
  const byQuestion = ALL_ANSWERS.find((a) => norm(a.question) === q || norm(a.question).includes(q));
  if (byQuestion) return byQuestion;
  const byTitle = CONVERSATIONS.find((c) => norm(c.title) === q);
  const first = byTitle && ALL_ANSWERS.find((a) => a.id === byTitle.answerIds[0]);
  return first ?? { ...FALLBACK, question: text };
}

function replay(conversationId: string): Turn[] {
  const c = CONVERSATIONS.find((x) => x.id === conversationId);
  if (!c) return [];
  return c.answerIds
    .map((id) => ALL_ANSWERS.find((a) => a.id === id))
    .filter((a): a is ChatAnswer => a !== undefined)
    .map((a) => ({ question: a.question, answer: a }));
}

/**
 * One conversation store for the whole app, mounted in the root layout so the
 * floating assistant and the full Chat AI screen show the same transcript and
 * survive navigation between tabs.
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<Record<string, Turn[]>>(() => ({ [CONVERSATIONS[0].id]: replay(CONVERSATIONS[0].id) }));
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id);
  const [sessionThreads, setSessionThreads] = useState<Thread[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const counter = useRef(0);

  const ask = useCallback(
    (question: string) => {
      const text = question.trim();
      if (!text) return;
      const turn = { question: text, answer: answerFor(text) };
      setThreads((t) => ({ ...t, [activeId]: [...(t[activeId] ?? []), turn] }));
      // A new conversation earns a history entry on its first question.
      if (!CONVERSATIONS.some((c) => c.id === activeId)) {
        setSessionThreads((s) => (s.some((x) => x.id === activeId) ? s : [{ id: activeId, title: text }, ...s]));
      }
    },
    [activeId],
  );

  const open = useCallback((id: string) => {
    setThreads((t) => (t[id] ? t : { ...t, [id]: replay(id) }));
    setActiveId(id);
  }, []);

  const startNew = useCallback(() => {
    counter.current += 1;
    const id = `baru-${counter.current}`;
    setThreads((t) => ({ ...t, [id]: [] }));
    setActiveId(id);
  }, []);

  const value = useMemo(
    () => ({ turns: threads[activeId] ?? [], activeId, sessionThreads, ask, open, startNew, popupOpen, setPopupOpen }),
    [threads, activeId, sessionThreads, ask, open, startNew, popupOpen],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatState {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}
