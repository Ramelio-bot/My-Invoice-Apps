import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { signUp, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Kalau user sudah login, redirect ke dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Password minimal 8 karakter.");
    if (form.password !== form.confirm) return setError("Password tidak sama.");
    setSubmitting(true);
    const { error } = await signUp(form.email, form.password, form.name);
    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      setSuccess(true);
      // useEffect akan handle navigate saat user sudah ter-set
    }
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Berhasil Daftar!</h2>
        <p className="text-gray-500 mt-2">PRO Trial 14 hari aktif! Sedang masuk ke dashboard...</p>
        <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">My Invoice</h1>
          <p className="text-gray-500 mt-1">Daftar gratis — PRO Trial 14 hari!</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Nama Lengkap", name: "name", type: "text", placeholder: "John Doe" },
            { label: "Email", name: "email", type: "email", placeholder: "email@kamu.com" },
            { label: "Password", name: "password", type: "password", placeholder: "Min. 8 karakter" },
            { label: "Konfirmasi Password", name: "confirm", type: "password", placeholder: "Ulangi password" },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
              <input
                type={f.type} name={f.name} value={form[f.name]}
                onChange={handleChange} placeholder={f.placeholder} required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          ))}
          <button
            type="submit" disabled={submitting}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {submitting ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
          <span className="text-gray-400 text-sm">atau</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 dark:border-gray-600 dark:text-white"
        >
          Daftar dengan Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
