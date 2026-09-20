"use client";

import { use } from "react";
import ParishSettingsScreen from "@/components/parishes/ParishSettingsScreen";
import { useParish } from "@/hooks/useParishes";

export default function ParishSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data } = useParish(id);

  return (
    <ParishSettingsScreen
      parishId={id}
      breadcrumb={[
        { href: "/parishes", label: "Parishes" },
        { href: `/global-dashboard/${id}`, label: data?.data?.name ?? "Parish" },
        { label: "Settings" },
      ]}
    />
  );
}
