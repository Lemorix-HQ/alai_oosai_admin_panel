import { redirect } from "next/navigation";
import { getSession } from "@/src/session/session";
import { SessionProvider } from "@/src/session/SessionProvider";
import { getParishNameAction, listParishesAction } from "@/src/actions/parishes.actions";
import AppShell from "@/components/layout/AppShell";
import type { Parish } from "@/src/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  // middleware.ts handles the no-cookie case; this catches a cookie whose token
  // the backend rejects, which would otherwise render an empty shell.
  if (!user) redirect("/login");

  const parishName = user.parish_id
    ? await getParishNameAction(user.parish_id)
    : null;

  // Only a super admin switches parishes, so only they need the list.
  let parishes: Parish[] = [];
  if (user.account_type === "super_admin") {
    const res = await listParishesAction();
    parishes = (res.data ?? []) as Parish[];
  }

  return (
    <SessionProvider user={user}>
      <AppShell
        parishName={parishName}
        currentParishId={user.parish_id}
        parishes={parishes}
      >
        {children}
      </AppShell>
    </SessionProvider>
  );
}
