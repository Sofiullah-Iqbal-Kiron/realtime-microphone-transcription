"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mic02Icon, StopIcon as HugeStopIcon, Loading03Icon } from "@hugeicons/core-free-icons";

import { useTranscriptionStore } from "@/lib/store";
import { useAudioTranscription } from "@/hooks/use-audio-transcription";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

export default function RecordPage() {
  const { startRecording, stopRecording } = useAudioTranscription();
  const {
    status,
    sessionId,
    partialText,
    finalText,
    wordCount,
    duration,
    error,
    reset,
  } = useTranscriptionStore();

  const isRecording = status === "recording";
  const isCompleted = status === "completed";
  const isConnecting = status === "connecting";
  const isStopping = status === "stopping";
  const isIdle = status === "idle";
  const hasError = status === "error";

  const displayText = isCompleted ? finalText : partialText;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Real-Time Transcription
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Click the microphone button to start recording. Your speech will be
          transcribed in real time.
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {(isIdle || hasError) && (
          <Button size="lg" onClick={startRecording} className="gap-2 px-8">
            <HugeiconsIcon icon={Mic02Icon} strokeWidth={2} size={18} />
            Start Recording
          </Button>
        )}

        {isConnecting && (
          <Button size="lg" disabled className="gap-2 px-8">
            <HugeiconsIcon
              icon={Loading03Icon}
              strokeWidth={2}
              size={18}
              className="animate-spin"
            />
            Connecting…
          </Button>
        )}

        {isRecording && (
          <Button
            size="lg"
            variant="destructive"
            onClick={stopRecording}
            className="gap-2 px-8"
          >
            <HugeiconsIcon icon={HugeStopIcon} strokeWidth={2} size={18} />
            Stop Recording
          </Button>
        )}

        {isStopping && (
          <Button size="lg" disabled className="gap-2 px-8">
            <HugeiconsIcon
              icon={Loading03Icon}
              strokeWidth={2}
              size={18}
              className="animate-spin"
            />
            Finalizing…
          </Button>
        )}

        {isCompleted && (
          <Button size="lg" onClick={reset} className="gap-2 px-8">
            <HugeiconsIcon icon={Mic02Icon} strokeWidth={2} size={18} />
            New Recording
          </Button>
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 text-red-500">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="text-sm font-medium">Recording…</span>
        </div>
      )}

      {/* Error */}
      {hasError && error && (
        <Card className="p-4 border-destructive bg-destructive/10 text-destructive">
          <p className="text-sm font-medium">Error: {error}</p>
        </Card>
      )}

      {/* Transcription output */}
      <Card className="p-4 md:p-6 min-h-[200px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Transcript</h2>
          {isCompleted && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{wordCount} words</span>
              <span>{formatDuration(duration)}</span>
            </div>
          )}
        </div>
        {displayText ? (
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {displayText}
          </p>
        ) : (
          <p className="text-muted-foreground italic">
            {isRecording
              ? "Listening… speak into your microphone."
              : "Transcript will appear here."}
          </p>
        )}
      </Card>

      {/* Session link */}
      {isCompleted && sessionId && (
        <div className="text-center text-sm text-muted-foreground">
          Session saved.{" "}
          <Link
            href={`/sessions/${sessionId}`}
            className="text-primary underline"
          >
            View session details →
          </Link>
        </div>
      )}
    </div>
  );
}
