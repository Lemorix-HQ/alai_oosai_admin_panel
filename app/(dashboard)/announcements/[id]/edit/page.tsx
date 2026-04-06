import { redirect } from "next/navigation";

// The backend announcement module has no GET /:id, PATCH /:id, or DELETE /:id routes.
// Redirect any attempt to access this page back to the announcements list.
export default function EditAnnouncementPage() {
  redirect("/announcements");
}
