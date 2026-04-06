import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "@/src/types";
import { getVillageNameAction } from "@/src/actions/villages.actions";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

async function getAdminContext(): Promise<{ name: string; villageName: string | null }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return { name: "Admin", villageName: null };
    const payload = jwtDecode<JwtPayload>(token);
    const villageName = payload.village_id
      ? await getVillageNameAction(payload.village_id)
      : null;
    return { name: payload.name ?? "Admin", villageName };
  } catch {
    return { name: "Admin", villageName: null };
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { name: adminName, villageName } = await getAdminContext();
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f7f9fc" }}>
      <Sidebar />
      <Header adminName={adminName} villageName={villageName} />
      <div className="ml-64 mt-16 flex-1">{children}</div>
    </div>
  );
}
