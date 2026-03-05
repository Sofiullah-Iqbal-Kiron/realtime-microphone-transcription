"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetchSessions, type SessionsListResponse } from "@/lib/sessions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SessionsPage() {
  const { data, error, isLoading } = useSWR<SessionsListResponse>(
    "/sessions",
    fetchSessions,
    { refreshInterval: 5000 }
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Transcription Sessions
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse all your saved transcription sessions.
        </p>
      </div>

      {isLoading && (
        <p className="text-muted-foreground text-sm">Loading sessions…</p>
      )}

      {error && (
        <Card className="p-4 border-destructive bg-destructive/10 text-destructive">
          <p className="text-sm">
            Failed to load sessions. Make sure the backend is running.
          </p>
        </Card>
      )}

      {data && data.count === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No sessions yet.</p>
          <Link href="/" className="text-primary underline text-sm mt-2 inline-block">
            Start your first recording →
          </Link>
        </Card>
      )}

      {data && data.sessions.length > 0 && (
        <div className="space-y-3">
          {data.sessions.map((session) => (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="block"
            >
              <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm font-mono">
                      {session.id.slice(0, 8)}…
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        session.status === "completed"
                          ? "default"
                          : session.status === "active"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {session.status}
                    </Badge>
                    {session.word_count != null && (
                      <span className="text-sm text-muted-foreground">
                        {session.word_count} words
                      </span>
                    )}
                    {session.duration != null && (
                      <span className="text-sm text-muted-foreground">
                        {session.duration.toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
