"use client";

import { use } from "react";
import PageShell from "@/components/ui/PageShell";
import StaffDetailView from "@/components/access/StaffDetailView";
import { useStaffMember } from "@/hooks/useAccess";

export default function SystemUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data } = useStaffMember(id);

  return (
    <PageShell
      title={data?.data?.name ?? "User"}
      subtitle={data?.data?.phone ?? undefined}
      breadcrumb={[{ href: "/system/users", label: "All users" }, { label: data?.data?.name ?? "User" }]}
    >
      <StaffDetailView userId={id} />
    </PageShell>
  );
}
