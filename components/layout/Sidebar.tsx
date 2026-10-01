"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/src/actions/auth.actions";
import { useSession } from "@/src/session/SessionProvider";
import { visibleSections } from "@/src/config/navigation";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { can, user } = useSession();
  const sections = visibleSections(can, user?.account_type === "super_admin");

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
    <>
      {/* Scrim — mobile only */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 flex flex-col z-50 shadow-xl transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#0D5C63" }}
      >
        <div className="px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl shrink-0"
              style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
            >
              AO
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                Alai Oosai
              </h1>
              <p
                className="text-xs font-medium tracking-wider"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Admin Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/70"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
          {sections.map((section, i) => (
            <div key={section.title ?? `section-${i}`} className="mb-2">
              {section.title && (
                <p
                  className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center px-4 py-3 transition-colors duration-200 text-sm font-medium"
                    style={{
                      color: active ? "#ffffff" : "rgba(255,255,255,0.7)",
                      backgroundColor: active ? "rgba(26, 107, 114, 0.5)" : "transparent",
                      borderLeft: active ? "4px solid #F59E0B" : "4px solid transparent",
                    }}
                  >
                    <span
                      className="material-symbols-outlined mr-3"
                      style={{ color: active ? "#F59E0B" : "inherit" }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

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
    </>
  );
}
