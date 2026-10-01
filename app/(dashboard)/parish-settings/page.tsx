"use client";

import { redirect } from "next/navigation";
import ParishSettingsScreen from "@/components/parishes/ParishSettingsScreen";
import { useSession } from "@/src/session/SessionProvider";

/**
 * The priest's own parish, without making him find its id.
 *
 * The same screen the super admin reaches per parish. The API decides whether
 * this parish is his to configure, so routing here grants nothing.
 */
export default function OwnParishSettingsPage() {
  const { user } = useSession();
  if (!user?.parish_id) redirect("/select-parish");

  return <ParishSettingsScreen parishId={user.parish_id} />;
}
