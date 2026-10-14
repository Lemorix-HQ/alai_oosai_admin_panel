"use client";

import { useRouter } from "next/navigation";
import PageShell from "@/components/ui/PageShell";
import { FormCard } from "@/components/ui/Field";
import { SodalityForm } from "@/components/sodalities/SodalityForm";

export default function NewSodalityPage() {
  const router = useRouter();

  return (
    <PageShell
      title="New sodality"
      subtitle="Name and patron saint are enough to start — members are added from the sodality's own page."
      breadcrumb={[{ href: "/sodalities", label: "Sodalities" }, { label: "New" }]}
    >
      <div className="max-w-xl">
        <FormCard>
          <SodalityForm onDone={() => router.push("/sodalities")} />
        </FormCard>
      </div>
    </PageShell>
  );
}
