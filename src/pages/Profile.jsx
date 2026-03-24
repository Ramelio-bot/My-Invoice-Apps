import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { User, Shield, Star, LogOut, AlertTriangle, Crown } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useLang } from "../context/LanguageContext";

const DLG_HAPUS = "HAPUS";
const DLG_DELETE = "DELETE";

export default function Profile() {
  const { user, profile, refreshProfile, signOut, trialActive, trialDaysLeft, effectivePlan, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, lang } = useLang();

  const [nameInput, setNameInput] = useState(profile?.full_name || "");
  const [isSavingName, setIsSavingName] = useState(false);

  // Modals state
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const [deleteDataConfirmText, setDeleteDataConfirmText] = useState("");
  const [deleteAccountEmailText, setDeleteAccountEmailText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile?.full_name) {
      setNameInput(profile.full_name);
    }
    if (profile?.company_logo) {
      setLogoPreview(profile.company_logo);
    }
  }, [profile]);

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  async function handleSaveName() {
    if (!nameInput.trim()) return showToast(t('prof_name_empty'), "error");
    setIsSavingName(true);
    const { error } = await supabase.from("profiles").update({ full_name: nameInput }).eq("id", user.id);
    setIsSavingName(false);

    if (error) {
      showToast(t('prof_name_fail'), "error");
    } else {
      showToast(t('prof_name_ok'), "success");
      refreshProfile();
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 200 * 1024) {
        showToast(t('prof_logo_max_size'), 'error');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setIsUploadingLogo(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ company_logo: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      showToast(t('prof_logo_ok'), 'success');
      setLogoFile(null);
      refreshProfile();
    } catch (err) {
      console.error(err);
      showToast(t('prof_logo_fail'), 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ company_logo: null })
        .eq('id', user.id);
      if (error) throw error;
      setLogoPreview(null);
      setLogoFile(null);
      showToast(t('prof_logo_del_ok'), 'success');
      refreshProfile();
    } catch (err) {
      console.error(err);
      showToast(t('prof_logo_del_fail'), 'error');
    }
  };

  async function handleDeleteData() {
    const confirmKeyword = lang === "ID" ? DLG_HAPUS : DLG_DELETE;
    if (deleteDataConfirmText !== confirmKeyword) return;
    setIsDeleting(true);
    try {
      // Hapus items dulu sebelum transactions (foreign key constraint)
      await supabase.from("kasir_transaction_items").delete().eq("user_id", user.id);

      await Promise.all([
        supabase.from("documents").delete().eq("user_id", user.id),
        supabase.from("clients").delete().eq("user_id", user.id),
        supabase.from("cashbook").delete().eq("user_id", user.id),
        supabase.from("hpp_records").delete().eq("user_id", user.id),
        supabase.from("download_logs").delete().eq("user_id", user.id),
        supabase.from("kasir_transactions").delete().eq("user_id", user.id),
        supabase.from("kasir_transaction_items").delete().eq("user_id", user.id),
        supabase.from("kasir_products").delete().eq("user_id", user.id),
        supabase.from("kasir_members").delete().eq("user_id", user.id),
        supabase.from("kasir_employees").delete().eq("user_id", user.id),
        supabase.from("kasir_expenses").delete().eq("user_id", user.id),
        supabase.from("kasir_shifts").delete().eq("user_id", user.id),
        supabase.from("kasir_vouchers").delete().eq("user_id", user.id),
        supabase.from("kasir_stock_history").delete().eq("user_id", user.id),
        supabase.from("kasir_points_history").delete().eq("user_id", user.id),
        supabase.from("kasir_recipes").delete().eq("user_id", user.id),
      ]);

      Object.keys(localStorage).forEach(key => {
        if (key !== "theme" && key !== "lang") {
          localStorage.removeItem(key);
        }
      });

      showToast(t('prof_del_data_ok'), "success");
      setShowDeleteDataModal(false);
      setDeleteDataConfirmText("");
      window.location.reload();
    } catch (e) {
      showToast(t('prof_del_data_fail'), "error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteAccountEmailText !== user?.email) return;
    setIsDeleting(true);

    // We call RPC since auth.users cannot be deleted by client standard API
    const { error } = await supabase.rpc("delete_user_account");

    if (error) {
      setIsDeleting(false);
      showToast(t('prof_del_acc_fail') + error.message, "error");
    } else {
      Object.keys(localStorage).forEach(key => {
        if (key !== "theme" && key !== "lang") {
          localStorage.removeItem(key);
        }
      });

      // Sign out and redirect
      await signOut();
      navigate("/");
    }
  }

  // Helper untuk rendering middle section Plan
  function renderPlanSection() {
    if (effectivePlan === "free") {
      return (
        <div className="p-4 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-xl flex items-center justify-between">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200">FREE</span>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {lang === 'ID' ? 'Upgrade untuk fitur lebih lengkap.' : 'Upgrade for more features.'}
            </p>
          </div>
        </div>
      );
    }

    if (effectivePlan === "pro" && trialActive) {
      const percentage = Math.max(0, Math.min(100, ((14 - trialDaysLeft) / 14) * 100));
      let colorClass = "bg-green-500";
      if (trialDaysLeft <= 7) colorClass = "bg-orange-500";
      if (trialDaysLeft <= 3) colorClass = "bg-red-500";

      return (
        <div className="p-4 border border-orange-100 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-200 text-orange-700 dark:bg-orange-800 dark:text-orange-200">PRO TRIAL</span>
            <span className={`text-sm font-semibold ${trialDaysLeft <= 3 ? 'text-red-600' : 'text-orange-600 dark:text-orange-400'}`}>
              {t('prof_trial_left')} {trialDaysLeft} {t('prof_trial_days')}
            </span>
          </div>
          <div className="w-full bg-orange-200 dark:bg-orange-900/50 rounded-full h-2 mb-1">
            <div className={`h-2 rounded-full transition-all ${colorClass}`} style={{ width: `${percentage}%` }}></div>
          </div>
          <p className="text-xs text-orange-600/80 dark:text-orange-400/80 text-right">{14 - trialDaysLeft} / 14 {t('prof_trial_days')}</p>
        </div>
      );
    }

    if (effectivePlan === "ultimate") {
      return (
        <div className="p-4 border border-purple-100 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-between">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-200">ULTIMATE 👑</span>
            <p className="text-sm text-purple-600/80 dark:text-purple-400/80 mt-2">
              {lang === 'ID' ? 'Akses penuh + Multi Outlet untuk bisnis multi-cabang.' : 'Full access + Multi Outlet for multi-branch businesses.'}
            </p>
          </div>
        </div>
      );
    }

    // Default PRO
    return (
      <div className="p-4 border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-between">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200">PRO ⭐</span>
          <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-2">
            {lang === 'ID' ? 'Aktif. 500 transaksi & 100 dokumen/bulan.' : 'Active. 500 transactions & 100 documents/month.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 pb-24">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{t('prof_title')}</h1>

      <div className="space-y-6">

        {/* TOP SECTION: User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-gray-700 flex items-center justify-center text-blue-500 overflow-hidden relative border-2 border-blue-100 dark:border-gray-600">
              {logoPreview ? (
                <img src={logoPreview} alt="Company Logo" className="w-full h-full object-cover" />
              ) : (
                <User size={40} />
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoChange} />
            <div className="flex flex-col gap-2 items-center">
              {logoFile ? (
                <button onClick={handleUploadLogo} disabled={isUploadingLogo} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-500/20 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-md shadow-green-500/30">
                  {isUploadingLogo ? t('prof_uploading') : t('prof_save')}
                </button>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50">
                  {t('prof_choose_photo')}
                </button>
              )}
              {logoPreview && !logoFile && (
                <button
                  onClick={handleDeletePhoto}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 text-xs font-bold rounded-lg transition-colors border border-red-200 dark:border-red-800/50"
                >
                  🗑 {t('prof_remove_photo')}
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 w-full space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('prof_full_name')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition dark:text-white"
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName || nameInput === profile?.full_name}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition min-w-[90px]"
                >
                  {isSavingName ? "..." : t('prof_save')}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('prof_current_email')}</label>
              <input
                type="text"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 select-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Plan Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('prof_plan_info')}</h2>
          {renderPlanSection()}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-3">
          {effectivePlan !== "ultimate" && (
            <>
              <button
                onClick={() => window.location.href = 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan'}
                className="w-full py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-blue-700 transition"
              >
                <Star size={18} /> {t('prof_upgrade_pro')}
              </button>
              <button
                onClick={() => window.location.href = 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan-7spr'}
                className="w-full py-3 bg-purple-600 text-white rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-purple-700 transition"
              >
                <Crown size={18} /> {t('prof_upgrade_ult')}
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-gray-900 transition"
            >
              <Shield size={18} /> {t('prof_open_admin')}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-3 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition"
          >
            <LogOut size={18} /> {t('prof_logout')}
          </button>
        </div>

        {/* DANGER ZONE */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-6 mt-12">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold mb-4">
            <AlertTriangle size={20} />
            <h2>{t('prof_danger_zone')}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-red-100 dark:border-red-800/50">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('prof_del_data')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('prof_del_data_desc')}</p>
              </div>
              <button
                onClick={() => setShowDeleteDataModal(true)}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-200 transition whitespace-nowrap"
              >
                {t('prof_del_data_btn')}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('prof_del_account')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('prof_del_account_desc')}</p>
              </div>
              <button
                onClick={() => setShowDeleteAccountModal(true)}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition whitespace-nowrap"
              >
                {t('prof_del_account')}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: DELETE DATA */}
      {showDeleteDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('prof_warn_del_data')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('prof_warn_del_data_desc1')} <strong className="text-red-600">{lang === 'ID' ? DLG_HAPUS : DLG_DELETE}</strong> {t('prof_warn_del_data_desc2')}
            </p>
            <input
              type="text"
              value={deleteDataConfirmText}
              onChange={(e) => setDeleteDataConfirmText(e.target.value)}
              placeholder={lang === 'ID' ? DLG_HAPUS : DLG_DELETE}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 outline-none dark:bg-gray-700 dark:text-white bg-gray-50 uppercase"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteDataModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">{t('doc_no')}</button>
              <button
                disabled={deleteDataConfirmText !== (lang === 'ID' ? DLG_HAPUS : DLG_DELETE) || isDeleting}
                onClick={handleDeleteData}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? t('prof_uploading') : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE ACCOUNT */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-red-600">{t('prof_final_warn')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('prof_final_warn_desc1')} <strong className="text-black dark:text-white">{user?.email}</strong> {t('prof_final_warn_desc2')}
            </p>
            <input
              type="email"
              value={deleteAccountEmailText}
              onChange={(e) => setDeleteAccountEmailText(e.target.value)}
              placeholder={user?.email}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 outline-none dark:bg-gray-700 dark:text-white bg-gray-50"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteAccountModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">{t('doc_no')}</button>
              <button
                disabled={deleteAccountEmailText !== user?.email || isDeleting}
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? t('prof_uploading') : t('prof_goodbye')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
