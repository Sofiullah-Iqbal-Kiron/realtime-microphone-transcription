import { create } from "zustand";

export type TranscriptionStatus =
  | "idle"
  | "connecting"
  | "recording"
  | "stopping"
  | "completed"
  | "error";

interface TranscriptionState {
  status: TranscriptionStatus;
  sessionId: string | null;
  partialText: string;
  finalText: string;
  wordCount: number;
  duration: number;
  error: string | null;

  // Actions
  setStatus: (status: TranscriptionStatus) => void;
  setSessionId: (id: string) => void;
  setPartialText: (text: string) => void;
  setFinalResult: (text: string, wordCount: number, duration: number) => void;
  setError: (error: string) => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as TranscriptionStatus,
  sessionId: null,
  partialText: "",
  finalText: "",
  wordCount: 0,
  duration: 0,
  error: null,
};

export const useTranscriptionStore = create<TranscriptionState>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),
  setSessionId: (sessionId) => set({ sessionId }),
  setPartialText: (partialText) => set({ partialText }),
  setFinalResult: (finalText, wordCount, duration) =>
    set({ finalText, wordCount, duration, status: "completed" }),
  setError: (error) => set({ error, status: "error" }),
  reset: () => set(initialState),
}));
