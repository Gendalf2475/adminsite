"use client";

import { useMemo, useState } from "react";
import { Check, FileText, MessageSquare, RefreshCw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ApplicationRow, ApplicationStatus } from "@/types/domain";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const actionButtons: Array<{ status: ApplicationStatus; label: string; icon: React.ComponentType<{ size?: number }>; variant: "default" | "primary" | "danger" | "outline" }> = [
  { status: "IN_PROGRESS", label: "Взять в работу", icon: RefreshCw, variant: "outline" },
  { status: "ACCEPTED", label: "Принять", icon: Check, variant: "primary" },
  { status: "REJECTED", label: "Отклонить", icon: X, variant: "danger" },
  { status: "NEEDS_INFO", label: "Запросить уточнение", icon: MessageSquare, variant: "default" },
  { status: "REPORT_SENT", label: "Отправить отчет", icon: Send, variant: "default" },
];

export function ApplicationViewer({ rows }: { rows: ApplicationRow[] }) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id);
  const [localStatuses, setLocalStatuses] = useState<Record<string, ApplicationStatus>>({});

  const selected = useMemo(() => rows.find((row) => row.id === selectedId) ?? rows[0], [rows, selectedId]);
  const selectedStatus = selected ? localStatuses[selected.id] ?? selected.status : "NEW";

  if (!selected) return null;

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
            const status = localStatuses[application.id] ?? application.status;
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
                  onClick={() => setLocalStatuses((current) => ({ ...current, [selected.id]: action.status }))}
                >
                  <Icon size={16} />
                  {action.label}
                </Button>
              );
            })}
          </div>

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
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
