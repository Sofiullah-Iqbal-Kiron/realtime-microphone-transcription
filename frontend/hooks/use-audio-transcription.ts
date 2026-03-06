"use client";

import { useRef, useCallback } from "react";
import { useTranscriptionStore, useAuthStore } from "@/lib/store";
import { WS_BASE_URL } from "@/lib/config";

/**
 * Custom hook that manages the WebSocket connection and
 * AudioContext for real-time audio transcription.
 *
 * Passes the access token as a query parameter for authentication:
 *   ws://.../ws/transcribe?token=<access_token>
 */
export function useAudioTranscription() {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const {
    status,
    setStatus,
    setSessionId,
    setPartialText,
    setFinalResult,
    setError,
    reset,
  } = useTranscriptionStore();

  const startRecording = useCallback(async () => {
    try {
      reset();
      setStatus("connecting");

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // Setup AudioContext for raw PCM extraction
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // ScriptProcessorNode to capture raw audio
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Open WebSocket with auth token
      const accessToken = useAuthStore.getState().accessToken;
      const wsUrl = `${WS_BASE_URL}/ws/transcribe?token=${encodeURIComponent(accessToken || "")}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("recording");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case "session_created":
              setSessionId(msg.session_id);
              break;
            case "partial":
              setPartialText(msg.text);
              break;
            case "final":
              setFinalResult(msg.text, msg.word_count, msg.duration);
              cleanup();
              break;
            case "error":
              setError(msg.text);
              cleanup();
              break;
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection error");
        cleanup();
      };

      ws.onclose = () => {
        if (useTranscriptionStore.getState().status === "recording") {
          // unexpected close
          setStatus("idle");
          cleanup();
        }
      };

      // Send audio data via WebSocket
      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const float32 = e.inputBuffer.getChannelData(0);
          // Convert float32 to int16 PCM
          const int16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            const s = Math.max(-1, Math.min(1, float32[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          ws.send(int16.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to start recording";
      setError(message);
    }
  }, [reset, setStatus, setSessionId, setPartialText, setFinalResult, setError]);

  const stopRecording = useCallback(() => {
    setStatus("stopping");
    // Send stop signal
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
    }
  }, [setStatus]);

  const cleanup = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  return { startRecording, stopRecording, status };
}
