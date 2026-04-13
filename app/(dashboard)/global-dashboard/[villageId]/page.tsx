"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import {
  useAssignVillageAdmin,
  useDeleteVillage,
  useRemoveVillageAdmin,
  useUpdateVillage,
  useVillageStats,
} from "@/hooks/useVillages";

export default function VillageDetailPage() {
  const router = useRouter();
  const params = useParams<{ villageId: string }>();
  const villageId = params.villageId;

  const { data: statsRes, isLoading } = useVillageStats(villageId);
  const updateVillage = useUpdateVillage(villageId);
  const deleteVillage = useDeleteVillage();
  const assignAdmin = useAssignVillageAdmin(villageId);
  const removeAdmin = useRemoveVillageAdmin(villageId);

  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const stats = statsRes?.data;
  const village = stats?.village;
  const villageAdmin = stats?.villageAdmin ?? null;

  const editForm = useFormik({
    enableReinitialize: true,
    initialValues: { name: village?.name ?? "" },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name.trim()) errors.name = "Name is required";
      return errors;
    },
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      try {
        const res = await updateVillage.mutateAsync({ name: values.name.trim() });
        if (!res.success) setError(res.message || "Failed to update village.");
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const adminForm = useFormik({
    initialValues: { name: "", phone: "" },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!values.name.trim()) errors.name = "Name is required";
      if (!values.phone.trim()) errors.phone = "Phone is required";
      return errors;
    },
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setError(null);
      try {
        const res = await assignAdmin.mutateAsync({
          name: values.name.trim(),
          phone: values.phone.trim(),
        });
        if (!res.success) {
          setError(res.message || "Failed to assign admin.");
        } else {
          resetForm();
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (statsRes && !statsRes.success) {
      setError(statsRes.message || "Failed to load village.");
    }
  }, [statsRes]);

  async function handleDelete() {
    setError(null);
    try {
      const res = await deleteVillage.mutateAsync(villageId);
      if (!res.success) {
        setError(res.message || "Failed to delete village.");
        return;
      }
      router.push("/global-dashboard");
    } catch {
      setError("Network error. Please try again.");
    }
  }

  async function handleRemoveAdmin() {
    setError(null);
    try {
      const res = await removeAdmin.mutateAsync();
      if (!res.success) setError(res.message || "Failed to remove admin.");
    } catch {
      setError("Network error. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <main className="p-8 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#f7f9fc" }}>
        <div className="max-w-5xl mx-auto text-slate-400 text-sm">Loading village…</div>
      </main>
    );
  }

  if (!village) {
    return (
      <main className="p-8 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#f7f9fc" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-slate-500">Village not found.</p>
          <Link href="/global-dashboard" className="text-sm font-semibold mt-4 inline-block" style={{ color: "#21686f" }}>
            ← Back to global dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#f7f9fc" }}>
      <div className="max-w-5xl mx-auto space-y-8">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/global-dashboard" className="hover:underline" style={{ color: "#596065" }}>
            Global Dashboard
          </Link>
          <span className="material-symbols-outlined text-xs" style={{ color: "#abb3b9" }}>
            chevron_right
          </span>
          <span className="font-semibold" style={{ color: "#0D5C63" }}>
            {village.name}
          </span>
        </nav>

        {error && (
          <div
            className="p-3 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "rgba(168,56,54,0.1)", color: "#a83836" }}
          >
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4"
            style={{ borderColor: "#f1f5f9" }}
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f0fdfc" }}>
              <span className="material-symbols-outlined" style={{ color: "#0D5C63" }}>
                groups
              </span>
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm">Family Cards</p>
              <h4 className="text-3xl font-black" style={{ color: "#2c3338" }}>
                {stats?.familyCount ?? 0}
              </h4>
            </div>
          </div>
          <div
            className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4"
            style={{ borderColor: "#f1f5f9" }}
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f0fdfc" }}>
              <span className="material-symbols-outlined" style={{ color: "#0D5C63" }}>
                person
              </span>
            </div>
            <div>
              <p className="text-slate-500 font-medium text-sm">Registered Users</p>
              <h4 className="text-3xl font-black" style={{ color: "#2c3338" }}>
                {stats?.userCount ?? 0}
              </h4>
            </div>
          </div>
        </section>

        {/* Edit + Delete */}
        <section
          className="bg-white rounded-xl shadow-sm border p-8"
          style={{ borderColor: "#e2e8f0" }}
        >
          <h4 className="text-lg font-bold mb-4" style={{ color: "#0D5C63" }}>
            Village Details
          </h4>
          <form className="space-y-4" onSubmit={editForm.handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Village Name
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
                style={{
                  borderColor:
                    editForm.touched.name && editForm.errors.name ? "#a83836" : "#e2e8f0",
                }}
                name="name"
                type="text"
                value={editForm.values.name}
                onChange={editForm.handleChange}
                onBlur={editForm.handleBlur}
              />
              {editForm.touched.name && editForm.errors.name && (
                <p className="text-xs mt-1" style={{ color: "#a83836" }}>
                  {editForm.errors.name}
                </p>
              )}
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-lg font-semibold text-sm border transition-all"
                style={{ borderColor: "#a83836", color: "#a83836" }}
              >
                Delete Village
              </button>
              <button
                type="submit"
                disabled={editForm.isSubmitting}
                className="text-slate-900 font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-xl active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#F59E0B" }}
              >
                {editForm.isSubmitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </section>

        {/* Village Admin */}
        <section
          className="bg-white rounded-xl shadow-sm border p-8"
          style={{ borderColor: "#e2e8f0" }}
        >
          <h4 className="text-lg font-bold mb-4" style={{ color: "#0D5C63" }}>
            Village Admin
          </h4>

          {villageAdmin ? (
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg" style={{ backgroundColor: "#f8fafc" }}>
              <div>
                <p className="font-semibold" style={{ color: "#2c3338" }}>{villageAdmin.name}</p>
                <p className="text-sm text-slate-500">{villageAdmin.phone ?? "No phone"}</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveAdmin}
                disabled={removeAdmin.isPending}
                className="px-4 py-2 rounded-lg font-semibold text-sm border transition-all disabled:opacity-60"
                style={{ borderColor: "#a83836", color: "#a83836" }}
              >
                {removeAdmin.isPending ? "Removing…" : "Remove"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mb-4">No admin assigned yet.</p>
          )}

          <form className="space-y-4 mt-6" onSubmit={adminForm.handleSubmit}>
            <h5 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              {villageAdmin ? "Replace Admin" : "Assign Admin"}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Name <span style={{ color: "#a83836" }}>*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
                  style={{
                    borderColor:
                      adminForm.touched.name && adminForm.errors.name ? "#a83836" : "#e2e8f0",
                  }}
                  name="name"
                  type="text"
                  value={adminForm.values.name}
                  onChange={adminForm.handleChange}
                  onBlur={adminForm.handleBlur}
                />
                {adminForm.touched.name && adminForm.errors.name && (
                  <p className="text-xs mt-1" style={{ color: "#a83836" }}>
                    {adminForm.errors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone <span style={{ color: "#a83836" }}>*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-lg border outline-none transition-all"
                  style={{
                    borderColor:
                      adminForm.touched.phone && adminForm.errors.phone ? "#a83836" : "#e2e8f0",
                  }}
                  name="phone"
                  type="tel"
                  value={adminForm.values.phone}
                  onChange={adminForm.handleChange}
                  onBlur={adminForm.handleBlur}
                />
                {adminForm.touched.phone && adminForm.errors.phone && (
                  <p className="text-xs mt-1" style={{ color: "#a83836" }}>
                    {adminForm.errors.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={adminForm.isSubmitting}
                className="text-slate-900 font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-xl active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#F59E0B" }}
              >
                {adminForm.isSubmitting ? "Saving…" : villageAdmin ? "Replace Admin" : "Assign Admin"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 mx-4">
            <h4 className="text-lg font-bold" style={{ color: "#a83836" }}>
              Delete Village
            </h4>
            <p className="text-sm text-slate-600 mt-2">
              Are you sure you want to delete <strong>{village.name}</strong>? This action cannot be
              undone. The village admin will also be removed.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg font-semibold text-sm border transition-all"
                style={{ borderColor: "#e2e8f0", color: "#0D5C63" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteVillage.isPending}
                className="px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all disabled:opacity-60"
                style={{ backgroundColor: "#a83836" }}
              >
                {deleteVillage.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
