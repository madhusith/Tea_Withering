"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building2,
  Eye as ViewerIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("manager@kelanivalley.com");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Authentication failed.");
        toast.error(data.error || "Login failed");
        setLoading(false);
        return;
      }

      toast.success(`Signed in as ${data.profile?.full_name || email}`);
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
      toast.error("Network error during login");
      setLoading(false);
    }
  };

  const handleSelectDemoRole = (role: "admin" | "manager" | "viewer") => {
    if (role === "admin") {
      setEmail("admin@kelanivalley.com");
      setPassword("Password123!");
    } else if (role === "manager") {
      setEmail("manager@kelanivalley.com");
      setPassword("Password123!");
    } else {
      setEmail("viewer@kelanivalley.com");
      setPassword("Password123!");
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4 sm:p-8">
      <div className="relative w-full max-w-md mx-auto z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-slate-100 transition-all duration-300">
          {/* Brand Header Section */}
          <div className="flex flex-col items-center text-center">
            <div className="w-48 h-20 relative flex items-center justify-center mb-4 mx-auto">
              <Image
                src="/assets/hayleys-logo.png"
                alt="Kelani Valley Plantations Logo"
                width={192}
                height={80}
                className="w-auto max-h-20 object-contain drop-shadow-xs"
                priority
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 mb-3 text-[#0a369d] text-[11px] font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#116c4a]" />
              Tea Withering &amp; Drying Monitoring
            </div>

            <h1 className="text-2xl font-bold text-[#012d1d] tracking-tight">
              Estate Portal Login
            </h1>
            <p className="text-[13px] text-slate-500 mt-1 max-w-xs">
              Sign in to monitor trough batch operations, heating bay, and real-time factory telemetry.
            </p>
          </div>

          {/* Quick Demo Role Selector */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Quick Switch Demo Role
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectDemoRole("admin")}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  email.startsWith("admin")
                    ? "bg-[#012d1d] text-white border-[#012d1d]"
                    : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemoRole("manager")}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  email.startsWith("manager")
                    ? "bg-[#116c4a] text-white border-[#116c4a]"
                    : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Manager</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemoRole("viewer")}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  email.startsWith("viewer")
                    ? "bg-[#0284c7] text-white border-[#0284c7]"
                    : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <ViewerIcon className="w-3.5 h-3.5" />
                <span>Viewer</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px] font-medium">
              {errorMsg}
            </div>
          )}

          {/* Credentials Form */}
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label
                className="text-[13px] text-[#0b1c30] font-semibold"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kelanivalley.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#116c4a]/20 focus:border-[#116c4a] transition-all"
                  required
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label
                className="text-[13px] text-[#0b1c30] font-semibold"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#116c4a]/20 focus:border-[#116c4a] transition-all"
                  required
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-70 mt-2"
              style={{
                background: "linear-gradient(135deg, rgb(17, 108, 74) 0%, rgb(1, 45, 29) 100%)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Meta */}
          <div className="mt-8 pt-5 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block">
              Ingestre Tea Factory KVPL • Div. No. 03 • Industrial IoT Node
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
