import Link from "next/link";
import AuthCard from "@/components/access/AuthCard";
import SetPasswordForm from "@/components/access/SetPasswordForm";
import { inspectTokenAction } from "@/src/actions/auth.actions";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // A link with no token at all, or one that was never issued, must never
  // render an empty form — somebody would type a password into nothing.
  if (!token) {
    return (
      <AuthCard title="This link is not valid">
        <p className="text-sm text-center" style={{ color: "#596065" }}>
          The invitation link is incomplete. Open it directly from the email, or ask
          your parish office to send a new one.
        </p>
      </AuthCard>
    );
  }

  const res = await inspectTokenAction(token);

  if (!res.success || !res.data || res.data.purpose !== "invite") {
    return (
      <AuthCard title="This link is not valid">
        <p className="text-sm text-center" style={{ color: "#596065" }}>
          Ask your parish office to send a new invitation.
        </p>
      </AuthCard>
    );
  }

  if (res.data.expired) {
    return (
      <AuthCard title="This invitation has expired">
        <p className="text-sm text-center" style={{ color: "#596065" }}>
          Invitations are valid for seven days. Ask your parish office to send a new one.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={`Welcome, ${res.data.name}`}
      subtitle={
        res.data.parish_name
          ? `Choose a password for your ${res.data.parish_name} account.`
          : "Choose a password for your Alai Osai account."
      }
    >
      <SetPasswordForm token={token} mode="invite" />
      <p className="text-xs text-center mt-6" style={{ color: "#596065" }}>
        You will sign in with {res.data.email}.{" "}
        <Link href="/login" className="underline">
          Already set up?
        </Link>
      </p>
    </AuthCard>
  );
}
