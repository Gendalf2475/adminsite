import type { Route } from "next";
import { ClipboardList, Gauge, History, LifeBuoy, Settings, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import type { PermissionKey } from "@/config/permissions";

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  permission?: PermissionKey;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/staff", label: "Персонал", icon: Users, permission: "staff.view" },
  { href: "/applications", label: "Заявки", icon: ClipboardList, permission: "applications.view" },
  { href: "/tickets", label: "Техподдержка", icon: LifeBuoy, permission: "tickets.view" },
  { href: "/audit-log", label: "Журнал действий", icon: History, permission: "audit.view" },
  { href: "/settings/roles", label: "Роли", icon: ShieldCheck, permission: "settings.view" },
  { href: "/settings", label: "Настройки", icon: Settings, permission: "settings.view" },
];
