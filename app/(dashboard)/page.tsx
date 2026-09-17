import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "@/src/types";
import { getAdminEventsAction } from "@/src/actions/events.actions";
import { getAdminAnnouncementsAction } from "@/src/actions/announcements.actions";
import { getAdminReportsAction } from "@/src/actions/reports.actions";
import { listParishesAction } from "@/src/actions/parishes.actions";

async function getAdminPayload(): Promise<JwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return null;
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const payload = await getAdminPayload();

  // Super admin without a selected parish must pick one (or create one) first.
  if (payload?.role === "super_admin" && !payload.parish_id) {
    const parishesRes = await listParishesAction();
    const parishes = parishesRes.data ?? [];
    redirect(parishes.length === 0 ? "/create-parish" : "/select-parish");
  }

  const [eventsResult, announcementsResult, reportsResult] = await Promise.all([
    getAdminEventsAction(),
    getAdminAnnouncementsAction(),
    getAdminReportsAction(),
  ]);

  const nameResult = payload?.name ?? "Admin";

  const eventsCount = eventsResult.data?.length ?? 0;
  const announcementsCount = announcementsResult.data?.length ?? 0;
  const reportsCount = reportsResult.data?.length ?? 0;

  const stats = [
    { icon: "event", label: "Total Events", value: String(eventsCount), href: "/events" },
    { icon: "notifications_active", label: "Announcements", value: String(announcementsCount), href: "/announcements" },
    { icon: "report", label: "Financial Reports", value: String(reportsCount), href: "/reports" },
  ];

  return (
    <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#f7f9fc" }}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. Welcome Banner Card */}
        <section
          className="relative overflow-hidden rounded-2xl p-8 text-white shadow-lg"
          style={{ backgroundColor: "#0D5C63" }}
        >
          <div className="relative z-10">
            <h3 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {nameResult}
            </h3>
            <p className="mt-2 font-medium flex items-center gap-2" style={{ color: "rgba(255,255,255,0.8)" }}>
              <span className="material-symbols-outlined" style={{ color: "#F59E0B" }}>
                home_pin
              </span>
              Alai Oosai Parish Administration
            </p>
          </div>
          {/* Abstract background pattern */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <svg className="h-full w-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M44.7,-76.4C58.1,-69.2,69.2,-58.1,76.4,-44.7C83.6,-31.3,86.8,-15.7,85.6,-0.7C84.4,14.3,78.8,28.6,70.5,41.2C62.1,53.8,51.1,64.7,38,72.1C24.9,79.5,9.8,83.4,-5.2,84.3C-20.2,85.2,-35.1,83.1,-48.5,75.9C-61.9,68.7,-73.8,56.5,-80.6,42C-87.4,27.5,-89.1,10.7,-87.3,-5.7C-85.5,-22.1,-80.1,-38,-70.2,-50.8C-60.3,-63.6,-45.8,-73.2,-31,-78.9C-16.2,-84.6,-1.1,-86.4,14.1,-84.4C29.3,-82.4,44.7,-76.4,44.7,-76.4Z"
                fill="currentColor"
                transform="translate(100 100)"
              />
            </svg>
          </div>
        </section>

        {/* 2. Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white p-6 rounded-xl shadow-sm border flex flex-col gap-4 hover:shadow-md hover:border-[#abeef6] transition-all"
              style={{ borderColor: "#f1f5f9" }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#f0fdfc" }}
              >
                <span className="material-symbols-outlined" style={{ color: "#0D5C63" }}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-slate-500 font-medium text-sm">{stat.label}</p>
                <h4 className="text-3xl font-black" style={{ color: "#2c3338" }}>
                  {stat.value}
                </h4>
              </div>
            </Link>
          ))}
        </section>

        {/* 3. Quick Actions Section */}
        <section className="space-y-4">
          <h3
            className="font-bold uppercase text-xs tracking-tight"
            style={{ color: "#596065" }}
          >
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/events/new"
              className="flex items-center gap-2 border-2 font-bold px-6 py-3 rounded-lg transition-all"
              style={{ borderColor: "#F59E0B", color: "#d97706" }}
            >
              <span className="material-symbols-outlined">add_circle</span>
              New Event
            </Link>
            <Link
              href="/announcements/new"
              className="flex items-center gap-2 border-2 font-bold px-6 py-3 rounded-lg transition-all"
              style={{ borderColor: "#F59E0B", color: "#d97706" }}
            >
              <span className="material-symbols-outlined">campaign</span>
              New Announcement
            </Link>
            <Link
              href="/reports/new"
              className="flex items-center gap-2 border-2 font-bold px-6 py-3 rounded-lg transition-all"
              style={{ borderColor: "#F59E0B", color: "#d97706" }}
            >
              <span className="material-symbols-outlined">assignment</span>
              New Report
            </Link>
          </div>
        </section>

        {/* 4. Recent Items */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Events */}
          <div
            className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden"
            style={{ borderColor: "#f1f5f9" }}
          >
            <div
              className="p-6 border-b flex justify-between items-center"
              style={{ borderColor: "#f1f5f9" }}
            >
              <h3 className="font-bold" style={{ color: "#2c3338" }}>
                Recent Events
              </h3>
              <Link
                href="/events"
                className="font-semibold text-sm hover:underline"
                style={{ color: "#21686f" }}
              >
                View All
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: "#f8fafc" }}>
              {eventsResult.data && eventsResult.data.length > 0 ? (
                eventsResult.data.slice(0, 5).map((event) => (
                  <div key={event.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: "#abeef6" }}>
                      <span className="material-symbols-outlined" style={{ color: "#0a5b62" }}>
                        calendar_today
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className="text-[10px] uppercase font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: "rgba(33,104,111,0.1)", color: "#21686f" }}
                        >
                          {event.type}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold" style={{ color: "#2c3338" }}>
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{event.place}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">No events yet.</div>
              )}
            </div>
          </div>

          {/* Recent Announcements */}
          <div
            className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col"
            style={{ borderColor: "#f1f5f9" }}
          >
            <div
              className="p-6 border-b flex justify-between items-center"
              style={{ borderColor: "#f1f5f9" }}
            >
              <h3 className="font-bold" style={{ color: "#2c3338" }}>
                Recent Announcements
              </h3>
              <Link
                href="/announcements"
                className="font-semibold text-sm hover:underline"
                style={{ color: "#21686f" }}
              >
                View All
              </Link>
            </div>
            <div className="divide-y flex-1" style={{ borderColor: "#f8fafc" }}>
              {announcementsResult.data && announcementsResult.data.length > 0 ? (
                announcementsResult.data.slice(0, 4).map((ann) => (
                  <div key={ann.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <span className="material-symbols-outlined text-amber-700" style={{ fontSize: "18px" }}>campaign</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold" style={{ color: "#2c3338" }}>
                        {ann.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{ann.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">No announcements yet.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
