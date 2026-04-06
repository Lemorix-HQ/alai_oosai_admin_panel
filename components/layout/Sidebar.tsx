"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/src/actions/auth.actions";

const navItems = [
  { href: "/", icon: "dashboard", label: "Dashboard" },
  { href: "/events", icon: "event", label: "Events" },
  { href: "/announcements", icon: "campaign", label: "Announcements" },
  { href: "/reports", icon: "assessment", label: "Reports" },
  { href: "/profile", icon: "person", label: "Profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    await logoutAction();
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-50 shadow-xl" style={{ backgroundColor: "#0D5C63" }}>
      {/* Brand Identity */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl"
            style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
          >
            AO
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
              Alai Oosai
            </h1>
            <p className="text-xs font-medium tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-4 py-3 transition-colors duration-200 text-sm font-medium"
              style={{
                color: active ? "#ffffff" : "rgba(255,255,255,0.7)",
                backgroundColor: active ? "rgba(26, 107, 114, 0.5)" : "transparent",
                borderLeft: active ? "4px solid #F59E0B" : "4px solid transparent",
              }}
            >
              <span className="material-symbols-outlined mr-3" style={{ color: active ? "#F59E0B" : "inherit" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Logout Action */}
      <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium cursor-pointer"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          <span className="material-symbols-outlined mr-3">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
