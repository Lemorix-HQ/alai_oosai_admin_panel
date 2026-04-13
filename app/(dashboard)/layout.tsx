import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { JwtPayload, Village } from "@/src/types";
import {
  getVillageNameAction,
  listVillagesAction,
} from "@/src/actions/villages.actions";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

type AdminContext = {
  name: string;
  role: JwtPayload["role"];
  villageName: string | null;
  currentVillageId: string | null;
  villages: Village[];
};

const FALLBACK_CONTEXT: AdminContext = {
  name: "Admin",
  role: "village_admin",
  villageName: null,
  currentVillageId: null,
  villages: [],
};

async function getAdminContext(): Promise<AdminContext> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return FALLBACK_CONTEXT;

  let payload: JwtPayload;
  try {
    payload = jwtDecode<JwtPayload>(token);
  } catch {
    return FALLBACK_CONTEXT;
  }

  const role = payload.role;
  const name = payload.name ?? "Admin";
  const currentVillageId = payload.village_id ?? null;

  const villageName = currentVillageId
    ? await getVillageNameAction(currentVillageId)
    : null;

  let villages: Village[] = [];
  if (role === "super_admin") {
    const villagesRes = await listVillagesAction();
    villages = (villagesRes.data ?? []) as Village[];
  }

  return {
    name,
    role,
    villageName,
    currentVillageId,
    villages,
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdminContext();

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f7f9fc" }}>
      <Sidebar role={ctx.role} />
      <Header
        adminName={ctx.name}
        villageName={ctx.villageName}
        role={ctx.role}
        currentVillageId={ctx.currentVillageId}
        villages={ctx.villages}
      />
      <div className="ml-64 mt-16 flex-1">{children}</div>
    </div>
  );
}
