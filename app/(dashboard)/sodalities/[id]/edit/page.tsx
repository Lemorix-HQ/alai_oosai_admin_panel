"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/ui/PageShell";
import { FormCard } from "@/components/ui/Field";
import { SodalityForm } from "@/components/sodalities/SodalityForm";
import { useSodality } from "@/hooks/useSodalities";

export default function EditSodalityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useSodality(id);
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
      title={`Edit ${sodality.name}`}
      breadcrumb={[
        { href: "/sodalities", label: "Sodalities" },
        { href: `/sodalities/${id}`, label: sodality.name },
        { label: "Edit" },
      ]}
    >
      <div className="max-w-xl">
        <FormCard>
          <SodalityForm initial={sodality} onDone={() => router.push(`/sodalities/${id}`)} />
        </FormCard>
      </div>
    </PageShell>
  );
}
