import Link from "next/link";
import { redirect } from "next/navigation";
import PageShell from "@/components/ui/PageShell";
import StatCard from "@/components/ui/StatCard";
import { getSession } from "@/src/session/session";
import { getParishStatsAction, listParishesAction } from "@/src/actions/parishes.actions";
import { getStructureTreeAction } from "@/src/actions/structure.actions";
import { P } from "@/src/session/permissions";

/**
 * The parish's own dashboard.
 *
 * What it shows is driven by permissions, not by role names — a faculty user
 * created from a template that did not exist when this was written still sees
 * exactly the cards their permissions cover.
 */
export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  // A super admin with no parish on the token has no tenant, and every scoped
  // endpoint would throw. Send them to pick one.
  if (user.account_type === "super_admin" && !user.parish_id) {
    const parishes = await listParishesAction();
    redirect((parishes.data ?? []).length === 0 ? "/create-parish" : "/select-parish");
  }

  const held = new Set(user.permissions ?? []);
  const can = (p: string) => held.has(p);

  const [statsRes, treeRes] = await Promise.all([
    can(P.parish.read) && user.parish_id
      ? getParishStatsAction(user.parish_id)
      : Promise.resolve(null),
    can(P.family.read) ? getStructureTreeAction() : Promise.resolve(null),
  ]);

  const stats = statsRes?.data;
  const tree = treeRes?.data;

  const quickActions = [
    { href: "/families/new", label: "New family", icon: "add_home", permission: P.family.create },
    { href: "/announcements/new", label: "New announcement", icon: "campaign", permission: P.comms.announcement },
    { href: "/events/new", label: "New event", icon: "event", permission: P.comms.event },
    { href: "/reports/new", label: "New report", icon: "assignment", permission: P.comms.report },
    { href: "/staff", label: "Manage staff", icon: "badge", permission: P.access.userManage },
  ].filter((a) => can(a.permission));

  return (
    <PageShell title={`Welcome back, ${user.name}`} subtitle={user.roles?.map((r) => r.name).join(", ")}>
      {(stats || tree) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Families"
            value={(stats?.familyCount ?? tree?.totals.families ?? 0).toLocaleString()}
            icon="home"
            href="/families"
          />
          <StatCard
            label="Members"
            value={(stats?.memberCount ?? 0).toLocaleString()}
            icon="groups"
            href="/members"
          />
          <StatCard
            label="Anbiyams"
            value={stats?.anbiyamCount ?? tree?.totals.anbiyams ?? 0}
            icon="hub"
            href="/structure"
          />
          <StatCard
            label="Mandalams"
            value={stats?.mandalamCount ?? tree?.totals.mandalams ?? 0}
            icon="account_tree"
            href="/structure"
          />
        </div>
      )}

      {stats && (
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <Link
            href="/families?verification_status=not_visited"
            className="rounded-xl border p-5 bg-white hover:shadow-sm transition-shadow"
            style={{ borderColor: "#e2e8f0" }}
          >
            <p className="text-2xl font-black" style={{ color: "#9a3412" }}>
              {stats.unverifiedCount.toLocaleString()}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Families not yet verified at the door
            </p>
          </Link>
          <Link
            href="/families?members_complete=false"
            className="rounded-xl border p-5 bg-white hover:shadow-sm transition-shadow"
            style={{ borderColor: "#e2e8f0" }}
          >
            <p className="text-2xl font-black" style={{ color: "#1e40af" }}>
              {stats.incompleteCount.toLocaleString()}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Families whose member list is incomplete
            </p>
          </Link>
        </div>
      )}

      {quickActions.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold uppercase text-xs tracking-wider" style={{ color: "#596065" }}>
            Quick actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-2 border-2 font-bold px-4 py-2.5 rounded-lg text-sm"
                style={{ borderColor: "#F59E0B", color: "#d97706" }}
              >
                <span className="material-symbols-outlined text-[20px]">{a.icon}</span>
                {a.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!stats && !tree && quickActions.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: "#e2e8f0" }}>
          <p className="text-sm text-slate-500">
            Your account has no permissions yet. Ask the parish priest to grant you a role.
          </p>
        </div>
      )}
    </PageShell>
  );
}
