"use client";

import { useRouter } from "next/navigation";
import PageShell from "@/components/ui/PageShell";
import ParishForm from "@/components/parishes/ParishForm";
import { useCreateParish, useSwitchParish } from "@/hooks/useParishes";

/**
 * The bootstrap route: a super admin with no parish selected lands here when
 * none exists. /parishes/new is the same form reached from the manage screen.
 */
export default function CreateParishPage() {
  const router = useRouter();
  const createParish = useCreateParish();
  const switchParish = useSwitchParish();

  return (
    <PageShell
      title="Create parish"
      subtitle="A parish is a tenant. Everything else in the system hangs off it."
      breadcrumb={[{ href: "/select-parish", label: "Parishes" }, { label: "Create" }]}
    >
      <ParishForm
        submitLabel="Create parish"
        cancelHref="/select-parish"
        onSubmit={async (payload) => {
          const res = await createParish.mutateAsync(payload);
          // Select it straight away, so the admin is not left with no tenant.
          if (res.success && res.data?._id) {
            await switchParish.mutateAsync(res.data._id);
            router.push("/");
          }
          return res;
        }}
      />
    </PageShell>
  );
}
