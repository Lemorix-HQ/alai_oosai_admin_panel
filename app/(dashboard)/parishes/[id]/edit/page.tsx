"use client";

import { use } from "react";
import PageShell from "@/components/ui/PageShell";
import ParishForm from "@/components/parishes/ParishForm";
import { useParish, useUpdateParish } from "@/hooks/useParishes";

export default function EditParishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useParish(id);
  const updateParish = useUpdateParish(id);
  const parish = data?.data;

  return (
    <PageShell
      title={parish ? `Edit ${parish.name}` : "Edit parish"}
      breadcrumb={[
        { href: "/parishes", label: "Parishes" },
        { href: `/global-dashboard/${id}`, label: parish?.name ?? "Parish" },
        { label: "Edit" },
      ]}
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !parish ? (
        <p className="text-sm text-slate-500">Parish not found.</p>
      ) : (
        <ParishForm
          initial={parish}
          lockCode
          submitLabel="Save changes"
          cancelHref="/parishes"
          onSubmit={(payload) => updateParish.mutateAsync(payload)}
        />
      )}
    </PageShell>
  );
}
