import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Kalau user sudah login, redirect ke dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const { error } = await signIn(email, password);
    if (error) {
      setError("Email atau password salah.");
      setSubmitting(false);
    }
    // Kalau sukses, useEffect di atas yang handle navigate!
  }

  async function handleGoogle() {
    await signInWithGoogle();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">My Invoice</h1>
          <p className="text-gray-500 mt-1">Login ke akun kamu</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="email@kamu.com" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="••••••••" required
            />
          </div>
          <button
            type="submit" disabled={submitting}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {submitting ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
          <span className="text-gray-400 text-sm">atau</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition dark:border-gray-600 dark:text-white"
        >
          Login dengan Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Belum punya akun?{" "}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">Daftar gratis</Link>
        </p>
      </div>
    </div>
  );
}
