"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import PageShell from "@/components/ui/PageShell";
import { Field, FormCard, Select } from "@/components/ui/Field";
import { useSession } from "@/src/session/SessionProvider";
import { useParish, useParishes } from "@/hooks/useParishes";

/**
 * A parish's own `/family-update` link and QR code.
 *
 * Staff see only their own parish; a super admin — who has no `parish_id` —
 * picks one from a dropdown. The URL carries `Parish.code`, the same unique
 * code already printed on everything else the parish issues, so there is no
 * new identifier to seed or keep in sync.
 */
export default function QrCodeManagementPage() {
  const { user } = useSession();
  const isSuperAdmin = user?.account_type === "super_admin";

  const { data: parishList } = useParishes();
  const [pickedId, setPickedId] = useState("");

  const parishId = isSuperAdmin ? pickedId : user?.parish_id ?? "";
  const { data, isLoading } = useParish(parishId);
  const parish = data?.data;

  return (
    <PageShell
      title="QR Code & Link Management"
      subtitle="The self-service link and QR code parishioners use to reach their own family's form."
    >
      {isSuperAdmin && (
        <FormCard title="Parish">
          <Field label="Choose a parish">
            <Select value={pickedId} onChange={(e) => setPickedId(e.target.value)}>
              <option value="">— choose —</option>
              {(parishList?.data ?? []).map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </Select>
          </Field>
        </FormCard>
      )}

      {!parishId ? (
        <p className="text-sm text-slate-500 mt-4">
          {isSuperAdmin ? "Choose a parish to generate its link." : "No parish is bound to this account."}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-slate-500 mt-4">Loading…</p>
      ) : !parish ? (
        <p className="text-sm text-slate-500 mt-4">Could not load this parish.</p>
      ) : (
        <LinkAndQr code={parish.code} name={parish.name} />
      )}
    </PageShell>
  );
}

function LinkAndQr({ code, name }: { code: string; name: string }) {
  const url = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/family-update?parish=${code}`;
  }, [code]);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(url, { width: 320, margin: 1 }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Nothing to do — the link is on screen either way.
    }
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <FormCard title={`Self-service link — ${name}`}>
        <p className="text-xs text-slate-500">
          Share this link, or the QR code beside it, so a household lands directly on its own
          parish&apos;s form — no parish picker for them to get wrong.
        </p>
        <div className="rounded-lg border p-3 text-sm font-mono break-all" style={{ borderColor: "#e2e8f0" }}>
          {url}
        </div>
        <button
          type="button"
          onClick={copy}
          className="px-3 py-2 rounded-lg text-xs font-bold self-start"
          style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </FormCard>

      <FormCard title="QR code">
        {qrDataUrl ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- a data URL, not an optimizable remote asset */}
            <img src={qrDataUrl} alt={`QR code for ${name}'s self-service form`} className="w-full max-w-[220px]" />
            <a
              href={qrDataUrl}
              download={`${code}-family-update-qr.png`}
              className="px-3 py-2 rounded-lg border text-xs font-bold"
              style={{ borderColor: "#e2e8f0", color: "#0D5C63" }}
            >
              Download PNG
            </a>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Generating…</p>
        )}
      </FormCard>
    </div>
  );
}
