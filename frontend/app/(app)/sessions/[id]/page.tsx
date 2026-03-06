"use client";

import { use } from "react";
import Link from "next/link";

import { useFetchedSessionDetail } from "@/lib/api/calls";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import type { SessionDetail } from "@/lib/types";

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, error, isLoading } = useFetchedSessionDetail(id);
  const session = data as SessionDetail | undefined;

  if (isLoading) {
    return <p className="text-muted-foreground">Loading session…</p>;
  }

  if (error || !session) {
    return (
      <div className="space-y-4">
        <Card className="p-4 border-destructive bg-destructive/10 text-destructive">
          <p className="text-sm">Session not found or failed to load.</p>
        </Card>
        <Link href="/sessions">
          <Button variant="outline">← Back to sessions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Session Detail
        </h1>
        <Link href="/sessions">
          <Button variant="outline" size="sm">
            ← Back
          </Button>
        </Link>
      </div>

      {/* Metadata */}
      <Card className="p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Status</p>
            <Badge
              variant={
                session.status === "completed" ? "default" : "secondary"
              }
              className="mt-1"
            >
              {session.status}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Word Count</p>
            <p className="font-semibold mt-1">
              {session.word_count ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="font-semibold mt-1">
              {formatDuration(session.duration)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Language</p>
            <p className="font-semibold mt-1 uppercase">{session.language}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="mt-1">
              {new Date(session.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Session ID</p>
            <p className="mt-1 font-mono text-xs break-all">{session.id}</p>
          </div>
        </div>
      </Card>

      {/* Transcript */}
      <Card className="p-4 md:p-6">
        <h2 className="font-semibold mb-4">Transcript</h2>
        {session.transcript ? (
          <p className="leading-relaxed whitespace-pre-wrap">
            {session.transcript}
          </p>
        ) : (
          <p className="text-muted-foreground italic">
            No transcript available.
          </p>
        )}
      </Card>
    </div>
  );
}
