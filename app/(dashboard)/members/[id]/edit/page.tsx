"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import PageShell from "@/components/ui/PageShell";
import { FormActions, FormCard } from "@/components/ui/Field";
import MemberFields, {
  memberNameError,
  memberToValues,
  valuesToPayload,
  type MemberValues,
} from "@/components/families/MemberFields";
import { useMember, useUpdateMember } from "@/hooks/useFamilies";
import type { Member } from "@/src/types";

/**
 * Correcting a person.
 *
 * The door step is where most of these come from — a name spelt from the paper
 * register, an age that was a guess — so this has to exist for verification to
 * be worth anything.
 */
/**
 * The form is mounted only once the member has arrived, so its initial values
 * come straight from the record rather than being pushed in by an effect after
 * the first render.
 */
function EditMemberForm({
  id,
  member,
  familyId,
  familyCode,
}: {
  id: string;
  member: Member;
  familyId?: string;
  familyCode?: string;
}) {
  const router = useRouter();
  const update = useUpdateMember(familyId);
  const [v, setV] = useState<MemberValues>(() => memberToValues(member));
  const [error, setError] = useState<string | null>(null);

  const back = () => router.push(familyId ? `/families/${familyId}` : "/members");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nameError = memberNameError(v);
    if (nameError) return setError(nameError);
    setError(null);

    const res = await update.mutateAsync({ id, payload: valuesToPayload(v) });
    if (!res.success) setError(res.message);
    else back();
  }

  return (
    <PageShell
      title={member.name_ta || member.name}
      subtitle={familyCode ? `In ${familyCode}` : undefined}
      breadcrumb={[
        { href: "/members", label: "Members" },
        ...(familyId && familyCode ? [{ href: `/families/${familyId}`, label: familyCode }] : []),
        { label: "Edit" },
      ]}
    >
      <form onSubmit={submit} className="space-y-4 max-w-3xl">
        <FormCard title="Person">
          <MemberFields v={v} setV={setV} showStatus />
        </FormCard>

        <FormActions
          submitting={update.isPending}
          submitLabel="Save changes"
          error={error}
          onCancel={back}
        />
      </form>
    </PageShell>
  );
}

export default function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useMember(id);
  const member = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Edit member">
        <p className="text-sm text-slate-500">Loading…</p>
      </PageShell>
    );
  }
  if (!member) {
    return (
      <PageShell title="Edit member">
        <p className="text-sm text-slate-500">Member not found.</p>
      </PageShell>
    );
  }

  const familyId = typeof member.family_id !== "string" ? member.family_id?._id : undefined;
  const familyCode =
    typeof member.family_id !== "string" ? member.family_id?.family_code : undefined;

  return (
    <EditMemberForm id={id} member={member} familyId={familyId} familyCode={familyCode} />
  );
}
