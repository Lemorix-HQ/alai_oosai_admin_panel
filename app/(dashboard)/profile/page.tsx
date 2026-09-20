import { getParishNameAction } from "@/src/actions/parishes.actions";
import { getSession } from "@/src/session/session";
import ProfileForm from "@/components/profile/ProfileForm";
import { displayRole } from "@/src/lib/labels";

export default async function ProfilePage() {
  // Reads the session rather than decoding the JWT, so permissions and roles
  // reflect assignments made after the token was issued.
  const profile = await getSession();
  const parishName = profile?.parish_id
    ? await getParishNameAction(profile.parish_id)
    : null;

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  return (
    <main className="p-6 min-h-[calc(100vh-64px)]" style={{ backgroundColor: "#F5F7FA" }}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#2c3338" }}>
            My Profile
          </h1>
        </div>

        {/* Profile Card */}
        <section className="bg-white rounded-lg shadow-sm p-8 flex flex-col md:flex-row gap-12">
          {/* Left Side: Avatar & Identity */}
          <div
            className="w-full md:w-1/3 flex flex-col items-center text-center space-y-4 border-r pr-0 md:pr-12"
            style={{ borderColor: "#f1f5f9" }}
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-extrabold shadow-lg"
              style={{ backgroundColor: "#0d5c63" }}
            >
              {initials}
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: "#2c3338" }}>
                {profile?.name ?? "Admin"}
              </h3>
              <p className="font-medium" style={{ color: "#596065" }}>
                @{profile?.phone ?? ""}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: "#abeef6", color: "#0a5b62" }}
              >
                {displayRole(profile)}
              </span>
              {parishName && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: "#ffddb8", color: "#744800" }}
                >
                  {parishName}
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Form Area */}
          <div className="flex-1">
            <ProfileForm
              userId={profile?.id ?? ""}
              initialName={profile?.name ?? ""}
              phone={profile?.phone ?? ""}
              roleLabel={displayRole(profile)}
              parishName={parishName}
            />
          </div>
        </section>

        {/* Account Info */}
        <section className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-lg font-bold mb-6" style={{ color: "#2c3338" }}>
            Account Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "#596065" }}>
                Phone
              </span>
              <span className="font-semibold text-sm" style={{ color: "#2c3338" }}>
                {profile?.phone ?? "—"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "#596065" }}>
                Role
              </span>
              <span className="font-semibold text-sm" style={{ color: "#2c3338" }}>
                {displayRole(profile)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "#596065" }}>
                Status
              </span>
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                  Active
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
