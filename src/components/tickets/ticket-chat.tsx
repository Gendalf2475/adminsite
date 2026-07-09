"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Plus, Send, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import type { TicketRow } from "@/types/domain";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TicketChat({ rows }: { rows: TicketRow[] }) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id);
  const [draft, setDraft] = useState("");
  const [localReplies, setLocalReplies] = useState<Record<string, TicketRow["messages"]>>({});
  const selected = useMemo(() => rows.find((row) => row.id === selectedId) ?? rows[0], [rows, selectedId]);

  if (!selected) return null;

  const messages = [...selected.messages, ...(localReplies[selected.id] ?? [])];

  function sendReply(internal = false) {
    const body = draft.trim();
    if (!body) return;
    setLocalReplies((current) => ({
      ...current,
      [selected.id]: [
        ...(current[selected.id] ?? []),
        {
          id: `local-${Date.now()}`,
          authorType: "ADMIN",
          authorName: "Owner MAJURE",
          body,
          visibility: internal ? "INTERNAL" : "PUBLIC",
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setDraft("");
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Обращения игроков</CardTitle>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Telegram и Discord в одной очереди тикетов.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((ticket) => {
            const active = ticket.id === selected.id;
            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition",
                  active ? "border-fuchsia-300/35 bg-fuchsia-400/15" : "border-white/10 bg-white/[.04] hover:bg-white/[.07]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{ticket.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-faint)]">
                      {ticket.source} · {ticket.externalUsername}
                    </p>
                  </div>
                  <StatusBadge value={ticket.priority} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatusBadge value={ticket.status} />
                  <span className="text-xs text-[var(--text-muted)]">{formatDateTime(ticket.createdAt)}</span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex-col items-stretch gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>{selected.title}</CardTitle>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {selected.source} · {selected.externalUsername} · ответственный: {selected.assignedUser ?? "не назначен"}
            </p>
          </div>
          <StatusBadge value={selected.status} />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">Игрок</p>
              <p className="mt-2 font-bold text-white">{selected.playerUsername ?? "Не указан"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">Источник</p>
              <p className="mt-2 font-bold text-white">{selected.source}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">Приоритет</p>
              <div className="mt-2"><StatusBadge value={selected.priority} /></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {selected.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[.06] px-3 py-1 text-xs font-bold text-[var(--text-muted)]">
                <Tag size={12} />
                {tag}
              </span>
            ))}
            <Button variant="ghost" size="sm">
              <Plus size={14} />
              тег
            </Button>
          </div>

          <div className="min-h-[360px] space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
            {messages.map((message) => {
              const admin = message.authorType === "ADMIN";
              return (
                <div key={message.id} className={cn("flex", admin ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl border px-4 py-3",
                      admin
                        ? "border-fuchsia-300/25 bg-fuchsia-400/15 text-white"
                        : "border-white/10 bg-white/[.06] text-[var(--text-muted)]",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[var(--text-faint)]">
                      <MessageCircle size={12} />
                      {message.authorName} · {message.visibility === "INTERNAL" ? "internal" : "public"}
                    </div>
                    <p className="text-sm">{message.body}</p>
                    <p className="mt-2 text-xs text-[var(--text-faint)]">{formatDateTime(message.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ответ игроку или внутренняя заметка" />
            <Button type="button" variant="outline" onClick={() => sendReply(true)}>
              Внутренняя
            </Button>
            <Button type="button" variant="primary" onClick={() => sendReply(false)}>
              <Send size={16} />
              Ответить
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
