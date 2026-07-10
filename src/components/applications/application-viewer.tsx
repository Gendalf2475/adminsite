"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, MessageSquare, RefreshCw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ApplicationRow, ApplicationStatus } from "@/types/domain";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const actionButtons: Array<{ status: ApplicationStatus; label: string; icon: React.ComponentType<{ size?: number }>; variant: "default" | "primary" | "danger" | "outline" }> = [
  { status: "IN_PROGRESS", label: "Взять в работу", icon: RefreshCw, variant: "outline" },
  { status: "ACCEPTED", label: "Принять", icon: Check, variant: "primary" },
  { status: "REJECTED", label: "Отклонить", icon: X, variant: "danger" },
  { status: "NEEDS_INFO", label: "Запросить уточнение", icon: MessageSquare, variant: "default" },
  { status: "REPORT_SENT", label: "Отметить отчет", icon: Send, variant: "default" },
];

export function ApplicationViewer({ rows }: { rows: ApplicationRow[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(rows[0]?.id);
  const [pendingAction, setPendingAction] = useState<ApplicationStatus | "comment" | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => rows.find((row) => row.id === selectedId) ?? rows[0], [rows, selectedId]);
  const selectedStatus = selected ? selected.status : "NEW";

  if (!selected) return null;

  async function updateStatus(status: ApplicationStatus) {
    setPendingAction(status);
    setError(null);
    const response =
      status === "REPORT_SENT"
        ? await fetch(`/api/applications/${selected.id}/send-report`, { method: "POST" })
        : await fetch(`/api/applications/${selected.id}/status`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status }),
          });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Не удалось обновить статус заявки.");
    } else {
      router.refresh();
    }
    setPendingAction(null);
  }

  async function submitComment() {
    const body = comment.trim();
    if (!body) return;
    setPendingAction("comment");
    setError(null);
    const response = await fetch(`/api/applications/${selected.id}/comment`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "Не удалось добавить комментарий.");
    } else {
      setComment("");
      router.refresh();
    }
    setPendingAction(null);
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[390px_1fr]">
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Очередь заявок</CardTitle>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Google Sheets row ID сохраняется как внешний ключ.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((application) => {
            const status = application.status;
            const active = application.id === selected.id;
            return (
              <button
                key={application.id}
                type="button"
                onClick={() => setSelectedId(application.id)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition",
                  active ? "border-fuchsia-300/35 bg-fuchsia-400/15" : "border-white/10 bg-white/[.04] hover:bg-white/[.07]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{application.candidateUsername}</p>
                    <p className="mt-1 text-xs text-[var(--text-faint)]">{formatDateTime(application.submittedAt)}</p>
                  </div>
                  <StatusBadge value={status} />
                </div>
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  {application.telegramUsername ?? "Telegram не указан"} · {application.discordUsername ?? "Discord не указан"}
                </p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-col items-stretch gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>{selected.candidateUsername}</CardTitle>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {selected.googleSheetRowId} · {formatDateTime(selected.submittedAt)}
            </p>
          </div>
          <StatusBadge value={selectedStatus} />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {actionButtons.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.status}
                  type="button"
                  variant={action.variant}
                  onClick={() => updateStatus(action.status)}
                  disabled={pendingAction !== null}
                >
                  <Icon size={16} />
                  {pendingAction === action.status ? "Сохранение..." : action.label}
                </Button>
              );
            })}
          </div>
          {error ? <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">Telegram</p>
              <p className="mt-2 font-bold text-white">{selected.telegramUsername ?? "Не указан"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">Discord</p>
              <p className="mt-2 font-bold text-white">{selected.discordUsername ?? "Не указан"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">Ответственный</p>
              <p className="mt-2 font-bold text-white">{selected.assignedReviewer ?? "Не назначен"}</p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <FileText size={16} className="text-fuchsia-200" />
              Ответы формы
            </div>
            <div className="grid gap-3">
              {Object.entries(selected.answers).map(([question, answer]) => (
                <div key={question} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--text-faint)]">{question}</p>
                  <p className="mt-2 text-sm text-white">{answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <MessageSquare size={16} className="text-fuchsia-200" />
              Внутренние комментарии
            </div>
            <div className="space-y-3">
              {selected.comments.length > 0 ? (
                selected.comments.map((comment) => (
                  <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                    <p className="text-sm text-white">{comment.body}</p>
                    <p className="mt-2 text-xs text-[var(--text-faint)]">
                      {comment.author} · {formatDateTime(comment.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-[var(--text-muted)]">
                  Комментариев пока нет.
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-col gap-3 md:flex-row">
              <Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Внутренний комментарий" />
              <Button type="button" variant="outline" onClick={submitComment} disabled={pendingAction !== null || !comment.trim()}>
                {pendingAction === "comment" ? "Сохранение..." : "Добавить"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
