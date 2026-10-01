"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import { FormActions, FormCard } from "@/components/ui/Field";
import MemberFields, {
  emptyMember,
  memberNameError,
  valuesToPayload,
  type MemberValues,
} from "@/components/families/MemberFields";
import { useAddMember, useFamily } from "@/hooks/useFamilies";

export default function NewMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data } = useFamily(id);
  const addMember = useAddMember(id);

  const [v, setV] = useState<MemberValues>(emptyMember());
  const [error, setError] = useState<string | null>(null);

  const family = data?.data;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nameError = memberNameError(v);
    if (nameError) return setError(nameError);
    setError(null);

    const res = await addMember.mutateAsync(valuesToPayload(v));
    if (!res.success) setError(res.message);
    else router.push(`/families/${id}`);
  }

  return (
    <PageShell
      title="Add member"
      subtitle={family ? `To ${family.family_code}` : undefined}
      breadcrumb={[
        { href: "/families", label: "Families" },
        { href: `/families/${id}`, label: family?.family_code ?? "Family" },
        { label: "Add member" },
      ]}
    >
      <form onSubmit={submit} className="space-y-4 max-w-3xl">
        <FormCard title="Person">
          <MemberFields v={v} setV={setV} />
        </FormCard>

        <FormActions
          submitting={addMember.isPending}
          submitLabel="Add member"
          error={error}
          onCancel={() => router.push(`/families/${id}`)}
        />
      </form>
    </PageShell>
  );
}
