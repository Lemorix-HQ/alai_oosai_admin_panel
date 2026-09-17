import Link from "next/link";
import { getAdminEventsAction } from "@/src/actions/events.actions";
import EventsTable from "@/components/events/EventsTable";

export default async function EventsPage() {
  const result = await getAdminEventsAction();
  const initialEvents = result.data ?? [];

  return (
    <div className="mt-0 p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#f7f9fc" }}>
      {/* Page Header Row */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#0D5C63" }}>
            Events
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage and monitor parish activities
          </p>
        </div>
        <Link
          href="/events/new"
          className="font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95"
          style={{ backgroundColor: "#F59E0B", color: "#0D5C63" }}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          + Add Event
        </Link>
      </div>

      <EventsTable initialEvents={initialEvents} />
    </div>
  );
}
