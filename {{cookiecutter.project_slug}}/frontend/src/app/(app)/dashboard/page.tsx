import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { WelcomePanel } from "@/features/dashboard/components/welcome-panel";

export default async function DashboardPage(): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    return null;
  }

  return (
    <div className="space-y-8">
      <WelcomePanel user={user} />
    </div>
  );
}
