"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* The Web Speech API is not in TypeScript's DOM lib; this is the slice used. */
interface RecognitionResult {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}
interface RecognitionEvent {
  readonly resultIndex: number;
  readonly results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noSubscribe = () => () => {};

const ERRORS: Record<string, string> = {
  "not-allowed": "Izin mikrofon ditolak — izinkan di pengaturan browser",
  "service-not-allowed": "Izin mikrofon ditolak — izinkan di pengaturan browser",
  "no-speech": "Tidak ada suara terdeteksi",
  "audio-capture": "Mikrofon tidak ditemukan",
  network: "Pengenalan suara butuh koneksi internet",
};

/**
 * Dictation into the prompt box. `onText` receives the full transcript of the
 * current recording (final + interim) each time it changes; the caller decides
 * how to merge it with what was already typed.
 */
export function useSpeechInput(onText: (transcript: string) => void, onError: (message: string) => void) {
  // false on the server and in browsers without the API (Firefox), so the
  // static HTML and the first client render agree.
  const supported = useSyncExternalStore(noSubscribe, () => recognitionCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const handlers = useRef({ onText, onError });
  useEffect(() => {
    handlers.current = { onText, onError };
  }, [onText, onError]);

  const stop = useCallback(() => recRef.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor || recRef.current) return;
    const rec = new Ctor();
    rec.lang = "id-ID";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      handlers.current.onText(text.trim());
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") handlers.current.onError(ERRORS[e.error] ?? `Input suara gagal (${e.error})`);
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, start, stop };
}
