import type { Route } from "next";
import { ClipboardList, Gauge, History, LifeBuoy, Settings, ShieldCheck, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/staff", label: "Персонал", icon: Users },
  { href: "/applications", label: "Заявки", icon: ClipboardList },
  { href: "/tickets", label: "Техподдержка", icon: LifeBuoy },
  { href: "/audit-log", label: "Audit Log", icon: History },
  { href: "/settings/roles", label: "Роли", icon: ShieldCheck },
  { href: "/settings", label: "Настройки", icon: Settings },
];
