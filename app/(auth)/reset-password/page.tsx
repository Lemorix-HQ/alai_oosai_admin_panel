import Link from "next/link";
import AuthCard from "@/components/access/AuthCard";
import SetPasswordForm from "@/components/access/SetPasswordForm";
import { inspectTokenAction } from "@/src/actions/auth.actions";

const Dead = ({ title, body }: { title: string; body: string }) => (
  <AuthCard title={title}>
    <p className="text-sm text-center" style={{ color: "#596065" }}>
      {body}{" "}
      <Link href="/forgot-password" className="underline">
        Request a new link
      </Link>
      .
    </p>
  </AuthCard>
);

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) return <Dead title="This link is not valid" body="The reset link is incomplete." />;

  const res = await inspectTokenAction(token);
  if (!res.success || !res.data || res.data.purpose !== "reset") {
    return <Dead title="This link is not valid" body="It may already have been used." />;
  }
  if (res.data.expired) {
    return <Dead title="This link has expired" body="Reset links are valid for one hour." />;
  }

  return (
    <AuthCard title="Choose a new password" subtitle={res.data.email ?? undefined}>
      <SetPasswordForm token={token} mode="reset" />
    </AuthCard>
  );
}
