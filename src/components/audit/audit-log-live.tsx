"use client";

import { useEffect, useState } from "react";
import { AuditLogTable } from "@/components/shared/audit-log-table";
import { formatDateTime } from "@/lib/utils";
import type { AuditLogRow } from "@/types/domain";

export function AuditLogLive({ initialRows }: { initialRows: AuditLogRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [updatedAt, setUpdatedAt] = useState(new Date().toISOString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        const response = await fetch("/api/audit-log", { cache: "no-store" });
        if (!response.ok) throw new Error("Audit refresh failed");
        const result = (await response.json()) as { data: AuditLogRow[] };
        if (mounted) {
          setRows(result.data);
          setUpdatedAt(new Date().toISOString());
          setError(null);
        }
      } catch {
        if (mounted) setError("Не удалось обновить audit log.");
      }
    }

    const interval = window.setInterval(refresh, 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-faint)]">
        <span>Обновлено: {formatDateTime(updatedAt)}</span>
        {error ? <span className="text-red-100">{error}</span> : null}
      </div>
      <AuditLogTable rows={rows} />
    </div>
  );
}
