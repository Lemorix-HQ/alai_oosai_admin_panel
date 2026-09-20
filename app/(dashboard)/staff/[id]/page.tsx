"use client";

import { use } from "react";
import PageShell from "@/components/ui/PageShell";
import StaffDetailView from "@/components/access/StaffDetailView";
import { useStaffMember } from "@/hooks/useAccess";

export default function StaffMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data } = useStaffMember(id);

  return (
    <PageShell
      title={data?.data?.name ?? "Staff member"}
      subtitle={data?.data?.phone ?? undefined}
      breadcrumb={[{ href: "/staff", label: "Staff" }, { label: data?.data?.name ?? "Staff member" }]}
    >
      <StaffDetailView userId={id} />
    </PageShell>
  );
}
