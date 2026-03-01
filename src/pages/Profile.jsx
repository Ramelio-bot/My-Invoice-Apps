import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BADGE = {
  free: "bg-gray-100 text-gray-700",
  pro: "bg-blue-100 text-blue-700",
  ultimate: "bg-purple-100 text-purple-700"
};

export default function Profile() {
  const { user, profile, signOut, trialActive, trialDaysLeft, effectivePlan } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  const nama = profile?.full_name || profile?.email || "User";

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Profil Saya</h1>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-5">

        {/* Avatar & Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {nama.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg dark:text-white">{nama}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Plan Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={"px-3 py-1 rounded-full text-sm font-semibold " + (BADGE[effectivePlan] || BADGE.free)}>
            {effectivePlan.toUpperCase()}
          </span>
          {trialActive && (
            <span className="text-sm text-orange-500 font-medium">
              Trial berakhir {trialDaysLeft} hari lagi
            </span>
          )}
          {profile?.role === "admin" && (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
              ADMIN
            </span>
          )}
        </div>

        {/* Trial warning */}
        {trialActive && trialDaysLeft <= 3 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
            ⚠️ Trial hampir habis! Upgrade sekarang agar tidak kehilangan akses PRO.
          </div>
        )}

        {/* Admin link */}
        {profile?.role === "admin" && (
          <button onClick={() => navigate("/admin")}
            className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition">
            Buka Admin Panel
          </button>
        )}

        {/* Upgrade */}
        {effectivePlan === "free" && !trialActive && (
          <button onClick={() => navigate("/upgrade")}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            Upgrade ke PRO
          </button>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition">
          Logout
        </button>
      </div>
    </div>
  );
}
