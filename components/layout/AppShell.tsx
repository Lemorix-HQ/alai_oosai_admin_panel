"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import type { Parish } from "@/src/types";

/**
 * Holds the one piece of state the shell needs — whether the mobile drawer is
 * open — so the layout itself can stay a server component and keep fetching on
 * the server.
 */
export default function AppShell({
  parishName,
  currentParishId,
  parishes,
  children,
}: {
  parishName: string | null;
  currentParishId: string | null;
  parishes: Parish[];
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f9fc" }}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header
        parishName={parishName}
        currentParishId={currentParishId}
        parishes={parishes}
        onMenuClick={() => setMenuOpen(true)}
      />
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
