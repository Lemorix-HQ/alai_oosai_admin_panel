import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import { JwtPayload, Village } from "@/src/types";
import { listVillagesAction } from "@/src/actions/villages.actions";

async function ensureSuperAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/login");
  try {
    const payload = jwtDecode<JwtPayload>(token!);
    if (payload.role !== "super_admin") redirect("/");
  } catch {
    redirect("/login");
  }
}

export default async function GlobalDashboardPage() {
  await ensureSuperAdmin();
  const res = await listVillagesAction();
  const villages = (res.data ?? []) as Village[];

  return (
    <main className="p-8 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#f7f9fc" }}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold" style={{ color: "#0D5C63" }}>
              Global Dashboard
            </h3>
            <p className="text-slate-500 mt-1">
              All villages on the platform. Open one to manage its admin and view stats.
            </p>
          </div>
          <Link
            href="/create-village"
            className="text-slate-900 font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
            style={{ backgroundColor: "#F59E0B" }}
          >
            <span className="material-symbols-outlined">add_circle</span>
            New Village
          </Link>
        </div>

        <div
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
          style={{ borderColor: "#e2e8f0" }}
        >
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "#f8fafc" }}>
              <tr className="text-left">
                <th className="px-6 py-4 font-semibold text-slate-600">Village Name</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Created</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#f1f5f9" }}>
              {villages.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-400">
                    No villages yet.
                  </td>
                </tr>
              ) : (
                villages.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold" style={{ color: "#2c3338" }}>
                      {v.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/global-dashboard/${v._id}`}
                        className="font-semibold text-sm hover:underline"
                        style={{ color: "#21686f" }}
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
