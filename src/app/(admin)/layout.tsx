import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-[304px]">
        <Topbar user={user} />
        <main className="page-shell">{children}</main>
      </div>
    </div>
  );
}
