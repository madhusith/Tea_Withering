"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("manager@kelanivalley.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/dashboard";
    }, 1000);
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
              Tea Withering Monitoring System
            </div>

            <h1 className="text-2xl font-bold text-[#012d1d] tracking-tight">
              Welcome Back
            </h1>
            <p className="text-[13px] text-slate-500 mt-1 max-w-xs">
              Sign in to monitor trough batch operations and estate telemetry.
            </p>
          </div>

          {/* Credentials Form */}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label
                className="text-[13px] text-[#0b1c30] font-semibold"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@kelanivalley.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#eff4ff] text-[#0b1c30] placeholder:text-slate-400 text-[14px] transition-all outline-none focus:bg-white focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] border border-transparent"
                />
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
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#eff4ff] text-[#0b1c30] placeholder:text-slate-400 text-[14px] transition-all outline-none focus:bg-white focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] border border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Controls: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-slate-100 text-[#1b4332] accent-[#1b4332] cursor-pointer"
                />
                <span className="text-[12px] text-slate-600">Remember Me</span>
              </label>
              <Link
                href="#forgot-password"
                className="text-[12px] text-[#0a369d] hover:text-[#0284c7] font-semibold transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0a369d] via-[#1e3a8a] to-[#0a369d] hover:from-[#1e40af] hover:to-[#1d4ed8] text-white font-semibold text-[14px] tracking-wide shadow-md hover:shadow-lg active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-80"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Login to Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

