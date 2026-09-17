"use client";

import { usePathname } from "next/navigation";
import ParishDropdown from "./ParishDropdown";
import type { JwtPayload, Parish } from "@/src/types";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/events": "Events",
  "/events/new": "Add New Event",
  "/announcements": "Announcements",
  "/announcements/new": "Add New Announcement",
  "/reports": "Financial Reports",
  "/reports/new": "Upload Financial Report",
  "/profile": "Admin Profile",
};

function getTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.includes("/events/") && pathname.includes("/edit")) return "Edit Event";
  if (pathname.includes("/announcements/") && pathname.includes("/edit")) return "Edit Announcement";
  if (pathname.includes("/reports/") && pathname.includes("/edit")) return "Edit Financial Report";
  if (/^\/events\/[^/]+$/.test(pathname)) return "Event Details";
  if (/^\/announcements\/[^/]+$/.test(pathname)) return "Announcement Details";
  if (/^\/reports\/[^/]+$/.test(pathname)) return "Report Details";
  return "Dashboard";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface HeaderProps {
  adminName: string;
  parishName: string | null;
  role: JwtPayload["role"];
  currentParishId: string | null;
  parishes: Parish[];
}

export default function Header({
  adminName,
  parishName,
  role,
  currentParishId,
  parishes,
}: HeaderProps) {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const initials = getInitials(adminName);

  return (
    <header
      className="flex items-center justify-between px-6 z-30 fixed top-0 right-0 h-16 bg-white border-b shadow-sm text-sm tracking-wide"
      style={{ width: "calc(100% - 256px)", borderColor: "#e2e8f0" }}
    >
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold" style={{ color: "#0D5C63" }}>
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Parish indicator: dropdown for super admin, static badge for parish admin */}
        {role === "super_admin" ? (
          <ParishDropdown
            parishes={parishes}
            currentParishId={currentParishId}
          />
        ) : (
          <div
            className="px-4 py-1.5 rounded-full font-bold flex items-center gap-2 text-sm"
            style={{ backgroundColor: "#abeef6", color: "#0a5b62" }}
          >
            <span className="material-symbols-outlined text-sm">location_on</span>
            {parishName ?? "Parish Admin"}
          </div>
        )}

        {/* Utility Actions */}
        <div className="flex items-center gap-2">
          <button className="hover:bg-slate-50 p-2 rounded-full text-slate-500 transition-all duration-150">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="hover:bg-slate-50 p-2 rounded-full text-slate-500 transition-all duration-150">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-4 border-l" style={{ borderColor: "#e2e8f0" }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-[#ffddb8]"
            style={{
              backgroundColor: "#865400",
              color: "#fff7f3",
            }}
            title={adminName}
          >
            {initials}
          </div>
          <span className="material-symbols-outlined text-slate-400">arrow_drop_down</span>
        </div>
      </div>
    </header>
  );
}
