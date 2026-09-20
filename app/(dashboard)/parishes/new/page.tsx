"use client";

import PageShell from "@/components/ui/PageShell";
import ParishForm from "@/components/parishes/ParishForm";
import { useCreateParish } from "@/hooks/useParishes";

export default function NewParishPage() {
  const createParish = useCreateParish();

  return (
    <PageShell
      title="New parish"
      subtitle="Name and code are all that is required; the rest can be filled in later."
      breadcrumb={[{ href: "/parishes", label: "Parishes" }, { label: "New" }]}
    >
      <ParishForm
        submitLabel="Create parish"
        cancelHref="/parishes"
        onSubmit={(payload) => createParish.mutateAsync(payload)}
      />
    </PageShell>
  );
}
