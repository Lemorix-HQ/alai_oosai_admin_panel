import Link from "next/link";
import { getAdminAnnouncementsAction } from "@/src/actions/announcements.actions";
import AnnouncementsTable from "@/components/announcements/AnnouncementsTable";

export default async function AnnouncementsPage() {
  const result = await getAdminAnnouncementsAction();
  const initialAnnouncements = result.data ?? [];

  return (
    <div className="p-8 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#f7f9fc" }}>
      {/* Page Header Actions */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#2c3338" }}>
            Manage Announcements
          </h1>
          <p className="mt-1" style={{ color: "#596065" }}>
            Broadcast important updates to the community
          </p>
        </div>
        <Link
          href="/announcements/new"
          className="font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95 text-white"
          style={{ backgroundColor: "#F59E0B" }}
        >
          <span className="material-symbols-outlined">add</span>
          Add Announcement
        </Link>
      </div>

      <AnnouncementsTable initialAnnouncements={initialAnnouncements} />
    </div>
  );
}
