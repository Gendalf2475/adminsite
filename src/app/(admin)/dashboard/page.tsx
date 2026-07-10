import { DashboardLive } from "@/components/dashboard/dashboard-live";
import { getDashboardSummary } from "@/services/dashboard.service";

export default async function DashboardPage() {
  const initialSummary = await getDashboardSummary();
  return <DashboardLive initialSummary={initialSummary} />;
}
