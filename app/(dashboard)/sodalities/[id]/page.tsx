"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FormCard } from "@/components/ui/Field";
import { SodalityRoster } from "@/components/sodalities/SodalityRoster";
import { AddMemberCard } from "@/components/sodalities/AddMemberCard";
import { PermissionGate } from "@/src/session/PermissionGate";
import { P } from "@/src/session/permissions";
import { useDeactivateSodality, useSodality } from "@/hooks/useSodalities";

export default function SodalityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useSodality(id);
  const deactivate = useDeactivateSodality();
  const [error, setError] = useState<string | null>(null);

  const sodality = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Sodality">
        <p className="text-sm text-slate-500">Loading…</p>
      </PageShell>
    );
  }
  if (!sodality) {
    return (
      <PageShell title="Sodality" breadcrumb={[{ href: "/sodalities", label: "Sodalities" }]}>
        <p className="text-sm text-slate-500">{data?.message ?? "Sodality not found."}</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={sodality.name}
      subtitle={sodality.name_ta}
      breadcrumb={[{ href: "/sodalities", label: "Sodalities" }, { label: sodality.name }]}
      action={
        <PermissionGate permission={P.sodality.manage}>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/sodalities/${id}/edit`}
              className="font-bold py-2.5 px-5 rounded-lg text-sm shadow-sm"
              style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
            >
              Edit
            </Link>
          </div>
        </PermissionGate>
      }
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <StatusPill label={`Code: ${sodality.code}`} tone="info" />
        {sodality.status !== "active" && <StatusPill label="Retired" tone="neutral" />}
        {sodality.patron_saint && <StatusPill label={sodality.patron_saint} tone="neutral" />}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <SodalityRoster sodalityId={id} />
        </div>

        <div className="space-y-4">
          <PermissionGate permission={P.sodality.memberManage}>
            <AddMemberCard sodalityId={id} />
          </PermissionGate>

          <PermissionGate permission={P.sodality.manage}>
            {sodality.status === "active" && (
              <FormCard title="Retire this sodality">
                <p className="text-xs text-slate-500">
                  It is marked inactive, not deleted, and only once nobody is actively enrolled. The
                  record and its past membership stay readable.
                </p>
                <ConfirmDialog
                  trigger={
                    <button className="px-3 py-2 rounded-lg border text-xs font-bold" style={{ borderColor: "#e2e8f0", color: "#dc2626" }}>
                      Retire {sodality.name}
                    </button>
                  }
                  title={`Retire ${sodality.name}?`}
                  message="Refused while any member is still actively enrolled — end their membership first."
                  confirmLabel="Retire"
                  onConfirm={async () => {
                    const res = await deactivate.mutateAsync(id);
                    if (!res.success) setError(res.message);
                    else router.push("/sodalities");
                  }}
                />
              </FormCard>
            )}
          </PermissionGate>
        </div>
      </div>
    </PageShell>
  );
}
