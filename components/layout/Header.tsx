"use client";

import { usePathname } from "next/navigation";
import ParishDropdown from "./ParishDropdown";
import { useSession } from "@/src/session/SessionProvider";
import type { Parish } from "@/src/types";

/**
 * Titles are derived from the path rather than passed per page, so a new page
 * gets a sensible heading without touching this file.
 */
const EXACT_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/structure": "Parish Structure",
  "/families": "Families",
  "/families/new": "Add Family",
  "/members": "Members",
  "/events": "Events",
  "/events/new": "Add New Event",
  "/announcements": "Announcements",
  "/announcements/new": "Add New Announcement",
  "/reports": "Financial Reports",
  "/reports/new": "Upload Financial Report",
  "/profile": "Admin Profile",
  "/staff": "Parish Staff",
  "/roles": "Roles & Permissions",
  "/roles/new": "Create Role",
  "/parish-settings": "Parish Settings",
  "/global-dashboard": "All Parishes",
  "/parishes": "Manage Parishes",
  "/parishes/new": "Create Parish",
  "/system/users": "All Users",
  "/system/audit": "Audit Log",
};

const SEGMENT_TITLES: Array<[RegExp, string]> = [
  [/^\/families\/[^/]+\/edit$/, "Edit Family"],
  [/^\/families\/[^/]+\/transfer$/, "Transfer Family"],
  [/^\/families\/[^/]+\/members\/new$/, "Add Member"],
  [/^\/families\/[^/]+$/, "Family Details"],
  [/^\/members\/[^/]+\/edit$/, "Edit Member"],
  [/^\/mandalams\/[^/]+\/edit$/, "Edit Mandalam"],
  [/^\/anbiyams\/[^/]+\/edit$/, "Edit Anbiyam"],
  [/^\/anbiyams\/[^/]+$/, "Anbiyam Details"],
  [/^\/parishes\/[^/]+\/edit$/, "Edit Parish"],
  [/^\/parishes\/[^/]+\/staff$/, "Parish Staff"],
  [/^\/parishes\/[^/]+\/settings$/, "Parish Settings"],
  [/^\/roles\/[^/]+\/edit$/, "Edit Role"],
  [/^\/staff\/[^/]+\/roles$/, "Assign Roles"],
  [/^\/events\/[^/]+\/edit$/, "Edit Event"],
  [/^\/announcements\/[^/]+\/edit$/, "Edit Announcement"],
  [/^\/reports\/[^/]+\/edit$/, "Edit Financial Report"],
  [/^\/events\/[^/]+$/, "Event Details"],
  [/^\/announcements\/[^/]+$/, "Announcement Details"],
  [/^\/reports\/[^/]+$/, "Report Details"],
  [/^\/global-dashboard\/[^/]+$/, "Parish Overview"],
];

function getTitle(pathname: string): string {
  if (EXACT_TITLES[pathname]) return EXACT_TITLES[pathname];
  for (const [re, title] of SEGMENT_TITLES) if (re.test(pathname)) return title;
  return "Dashboard";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || "?").slice(0, 2).toUpperCase();
}

interface HeaderProps {
  parishName: string | null;
  currentParishId: string | null;
  parishes: Parish[];
  onMenuClick: () => void;
}

export default function Header({
  parishName,
  currentParishId,
  parishes,
  onMenuClick,
}: HeaderProps) {
  const pathname = usePathname();
  const { user } = useSession();
  const title = getTitle(pathname);
  const name = user?.name ?? "Admin";
  const isSuperAdmin = user?.account_type === "super_admin";

  return (
    <header
      className="flex items-center justify-between gap-3 px-4 sm:px-6 z-30 fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b shadow-sm text-sm tracking-wide"
      style={{ borderColor: "#e2e8f0" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden shrink-0"
          aria-label="Open menu"
          style={{ color: "#0D5C63" }}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="text-lg sm:text-xl font-bold truncate" style={{ color: "#0D5C63" }}>
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {isSuperAdmin ? (
          <ParishDropdown parishes={parishes} currentParishId={currentParishId} />
        ) : (
          parishName && (
            <span className="hidden sm:inline text-sm font-medium" style={{ color: "#596065" }}>
              {parishName}
            </span>
          )
        )}
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: "#0D5C63", color: "#ffffff" }}
            title={name}
          >
            {getInitials(name)}
          </div>
          <span className="hidden md:inline font-medium" style={{ color: "#1f2937" }}>
            {name}
          </span>
        </div>
      </div>
    </header>
  );
}
