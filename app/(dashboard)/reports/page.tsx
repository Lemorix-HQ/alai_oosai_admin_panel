import Link from "next/link";
import { getAdminReportsAction } from "@/src/actions/reports.actions";
import ReportsTable from "@/components/reports/ReportsTable";

export default async function ReportsPage() {
  const result = await getAdminReportsAction();
  const initialReports = result.data ?? [];

  return (
    <main className="p-6 min-h-[calc(100vh-64px)]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#134e4a" }}>
            Financial Reports
          </h1>
          <p className="mt-1" style={{ color: "#596065" }}>
            Review, manage and upload village financial statements and income reports.
          </p>
        </div>
        <Link
          href="/reports/new"
          className="font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95"
          style={{ backgroundColor: "#F59E0B", color: "#134e4a" }}
        >
          <span className="material-symbols-outlined font-bold">add</span>
          Upload Report
        </Link>
      </div>

      <ReportsTable initialReports={initialReports} />
    </main>
  );
}
