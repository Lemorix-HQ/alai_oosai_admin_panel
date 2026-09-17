import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { JwtPayload, Parish } from "@/src/types";
import {
  getParishNameAction,
  listParishesAction,
} from "@/src/actions/parishes.actions";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

type AdminContext = {
  name: string;
  role: JwtPayload["role"];
  parishName: string | null;
  currentParishId: string | null;
  parishes: Parish[];
};

const FALLBACK_CONTEXT: AdminContext = {
  name: "Admin",
  role: "parish_admin",
  parishName: null,
  currentParishId: null,
  parishes: [],
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
  const currentParishId = payload.parish_id ?? null;

  const parishName = currentParishId
    ? await getParishNameAction(currentParishId)
    : null;

  let parishes: Parish[] = [];
  if (role === "super_admin") {
    const parishesRes = await listParishesAction();
    parishes = (parishesRes.data ?? []) as Parish[];
  }

  return {
    name,
    role,
    parishName,
    currentParishId,
    parishes,
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
        parishName={ctx.parishName}
        role={ctx.role}
        currentParishId={ctx.currentParishId}
        parishes={ctx.parishes}
      />
      <div className="ml-64 mt-16 flex-1">{children}</div>
    </div>
  );
}
