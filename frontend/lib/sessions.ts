import api from "./api";

export interface TranscriptionSession {
  id: string;
  transcript: string | null;
  duration: number | null;
  word_count: number | null;
  language: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SessionListItem {
  id: string;
  duration: number | null;
  word_count: number | null;
  language: string;
  status: string;
  created_at: string;
}

export interface SessionsListResponse {
  count: number;
  sessions: SessionListItem[];
}

export async function fetchSessions(): Promise<SessionsListResponse> {
  const { data } = await api.get<SessionsListResponse>("/sessions");
  return data;
}

export async function fetchSession(id: string): Promise<TranscriptionSession> {
  const { data } = await api.get<TranscriptionSession>(`/sessions/${id}`);
  return data;
}
