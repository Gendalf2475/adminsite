"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Save, ShieldCheck } from "lucide-react";
import { PERMISSIONS, permissionLabels, type PermissionKey } from "@/config/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RoleEditorRow = {
  id: string;
  key: string;
  name: string;
  kind: "STAFF_RANK" | "DUTY";
  description?: string | null;
  permissionKeys: PermissionKey[];
  defaultDutyKeys: string[];
  editable: boolean;
};

type Draft = { permissionKeys: PermissionKey[]; defaultDutyKeys: string[] };

export function RolesManager({ roles }: { roles: RoleEditorRow[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(roles.map((role) => [role.key, { permissionKeys: role.permissionKeys, defaultDutyKeys: role.defaultDutyKeys }])),
  );
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const duties = useMemo(() => roles.filter((role) => role.kind === "DUTY"), [roles]);
  const rankRoles = roles.filter((role) => role.kind === "STAFF_RANK");

  function togglePermission(role: RoleEditorRow, permission: PermissionKey) {
    if (!role.editable) return;
    setDrafts((current) => {
      const draft = current[role.key];
      const permissionKeys = draft.permissionKeys.includes(permission)
        ? draft.permissionKeys.filter((key) => key !== permission)
        : [...draft.permissionKeys, permission];
      return { ...current, [role.key]: { ...draft, permissionKeys } };
    });
  }

  function toggleDuty(role: RoleEditorRow, dutyKey: string) {
    if (!role.editable) return;
    setDrafts((current) => {
      const draft = current[role.key];
      const defaultDutyKeys = draft.defaultDutyKeys.includes(dutyKey)
        ? draft.defaultDutyKeys.filter((key) => key !== dutyKey)
        : [...draft.defaultDutyKeys, dutyKey];
      return { ...current, [role.key]: { ...draft, defaultDutyKeys } };
    });
  }

  async function saveRole(role: RoleEditorRow) {
    setPending(role.key);
    setMessage(null);
    const draft = drafts[role.key];
    const response = await fetch("/api/settings/roles", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roleKey: role.key,
        permissionKeys: draft.permissionKeys,
        defaultDutyKeys: role.kind === "STAFF_RANK" ? draft.defaultDutyKeys : undefined,
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) setMessage(result?.error ?? "Не удалось сохранить роль.");
    else {
      setMessage(`Роль «${role.name}» сохранена.`);
      router.refresh();
    }
    setPending(null);
  }

  function renderRole(role: RoleEditorRow) {
    const draft = drafts[role.key];
    return (
      <Card key={role.id}>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>{role.name}</CardTitle>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{role.description ?? role.key}</p>
          </div>
          {role.editable ? <ShieldCheck className="text-fuchsia-200" size={18} /> : <LockKeyhole className="text-[var(--text-faint)]" size={18} />}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map((permission) => (
              <label
                key={permission}
                className="flex min-h-10 items-center gap-3 rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-sm text-[var(--text-muted)]"
              >
                <input
                  type="checkbox"
                  checked={draft.permissionKeys.includes(permission)}
                  onChange={() => togglePermission(role, permission)}
                  disabled={!role.editable}
                  className="h-4 w-4 shrink-0 accent-fuchsia-500"
                />
                <span>{permissionLabels[permission]}</span>
              </label>
            ))}
          </div>

          {role.kind === "STAFF_RANK" && duties.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase text-[var(--text-faint)]">Допзанятости по умолчанию</p>
              <div className="flex flex-wrap gap-2">
                {duties.map((duty) => (
                  <label key={duty.key} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[.05] px-3 py-2 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={draft.defaultDutyKeys.includes(duty.key)}
                      onChange={() => toggleDuty(role, duty.key)}
                      disabled={!role.editable}
                      className="h-4 w-4 accent-fuchsia-500"
                    />
                    {duty.name}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {role.editable ? (
            <Button type="button" variant="primary" onClick={() => saveRole(role)} disabled={pending !== null}>
              <Save size={16} />
              {pending === role.key ? "Сохранение..." : "Сохранить"}
            </Button>
          ) : (
            <p className="text-xs text-[var(--text-faint)]">Полный доступ закреплён системно.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {message ? <div className="rounded-lg border border-white/10 bg-white/[.05] px-4 py-3 text-sm text-white">{message}</div> : null}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase text-[var(--text-faint)]">Ранги персонала</h2>
        <div className="grid gap-4 xl:grid-cols-2">{rankRoles.map(renderRole)}</div>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase text-[var(--text-faint)]">Допзанятости</h2>
        <div className="grid gap-4 xl:grid-cols-2">{duties.map(renderRole)}</div>
      </section>
    </div>
  );
}
