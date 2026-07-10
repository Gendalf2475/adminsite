import { DashboardLive } from "@/components/dashboard/dashboard-live";
import { getDashboardSummary } from "@/services/dashboard.service";
import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();
  const initialSummary = await getDashboardSummary(user.permissions);
  return <DashboardLive initialSummary={initialSummary} />;
}
