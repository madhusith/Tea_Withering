"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  Bell,
  User,
  ArrowUpDown,
  LogOut,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useTelemetryRealtime } from "@/hooks/use-telemetry-realtime";
import { useAuth } from "@/context/auth-context";

interface HeaderProps {
  currentFactoryName?: string;
  divisionName?: string;
}

export function Header({
  currentFactoryName = "St. Clair Tea Estate",
  divisionName = "Div. No. 03 • Trough Hall B",
}: HeaderProps) {
  const { activeAlertsCount, isConnected } = useTelemetryRealtime();
  const { profile, role, logout, switchDemoRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleLabel =
    role === "admin"
      ? "Estate Admin"
      : role === "manager"
      ? "Factory Manager"
      : "Quality Viewer";

  return (
    <header
      className="fixed top-0 left-64 right-0 h-16 z-40 px-6 sm:px-8 flex items-center justify-between backdrop-blur-md"
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        borderBottom: "2px solid #0284c7",
        boxShadow: "0 2px 12px rgba(11, 60, 93, 0.05)",
      }}
    >
      {/* Left: Factory Selector & Location */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#0b3c5d] font-semibold text-[13px] transition-colors hover:bg-blue-100/60"
          style={{
            background: "rgb(240, 247, 255)",
            border: "1px solid rgb(191, 219, 254)",
          }}
        >
          <Building2 className="w-4 h-4 text-[#1e40af]" />
          <span>{profile?.factory_name || currentFactoryName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <span className="hidden sm:inline text-[12px] text-slate-500 font-medium">
          {divisionName}
        </span>
      </div>

      {/* Right: Live Telemetry, Notifications & User Info */}
      <div className="flex items-center gap-4">
        {/* Live Telemetry Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-semibold ${
            isConnected ? "bg-[#e0f2fe] text-[#0369a1]" : "bg-amber-50 text-amber-800"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-[#0284c7] animate-pulse" : "bg-amber-600"
            }`}
          />
          <span>{isConnected ? "Live Telemetry" : "Reconnecting"}</span>
        </div>

        {/* Notifications Icon with Dynamic Badge */}
        <Link
          href="/alerts"
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title={`${activeAlertsCount} active alert(s)`}
        >
          <Bell className="w-5 h-5" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#dc2626] text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-xs">
              {activeAlertsCount}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile & Role Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-1 text-left cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[13px] font-bold text-[#0b1c30]">
                {profile?.full_name || "Factory User"}
              </span>
              <span className="text-[11px] text-slate-500 font-medium capitalize">
                {roleLabel}
              </span>
            </div>
            <div
              className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-[12px] shadow-sm ${
                role === "admin"
                  ? "bg-[#012d1d]"
                  : role === "manager"
                  ? "bg-[#116c4a]"
                  : "bg-[#0284c7]"
              }`}
            >
              <User className="w-4 h-4 text-white" />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Popover Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-[12px]">
              {/* Profile Details */}
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-[#012d1d] text-[13px] truncate">
                  {profile?.full_name}
                </p>
                <p className="text-slate-400 text-[11px] truncate">
                  {profile?.email}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  <ShieldCheck className="w-3 h-3 text-[#116c4a]" />
                  <span>Role: {role}</span>
                </div>
              </div>

              {/* Quick Role Switcher for Testing */}
              <div className="px-4 py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Test Role Switcher
                </span>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole("admin");
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700 text-left cursor-pointer"
                  >
                    <span>🛡️ Estate Admin</span>
                    {role === "admin" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole("manager");
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700 text-left cursor-pointer"
                  >
                    <span>🏭 Factory Manager</span>
                    {role === "manager" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole("viewer");
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700 text-left cursor-pointer"
                  >
                    <span>👁️ Quality Viewer</span>
                    {role === "viewer" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                </div>
              </div>

              {/* Logout Option */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 font-semibold cursor-pointer text-left transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
