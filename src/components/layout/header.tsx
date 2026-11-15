"use client";

import Link from "next/link";
import {
  Building2,
  ChevronDown,
  Bell,
  User,
  ArrowUpDown,
  Radio,
} from "lucide-react";

interface HeaderProps {
  currentFactoryName?: string;
  divisionName?: string;
  userName?: string;
  userRole?: string;
}

export function Header({
  currentFactoryName = "St. Clair Tea Estate",
  divisionName = "Div. No. 03 • Trough Hall B",
  userName = "Rohan P.",
  userRole = "Factory Manager",
}: HeaderProps) {
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
          <span>{currentFactoryName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <span className="hidden sm:inline text-[12px] text-slate-500 font-medium">
          {divisionName}
        </span>
      </div>

      {/* Right: Live Telemetry, Notifications & User Info */}
      <div className="flex items-center gap-4">
        {/* Live Telemetry Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#e0f2fe] text-[#0369a1] text-[12px] font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#0284c7] animate-pulse" />
          <span>Live Telemetry</span>
        </div>

        {/* Notifications Icon */}
        <Link
          href="/alerts"
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#dc2626]" />
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-1">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[13px] font-bold text-[#0b1c30]">{userName}</span>
            <span className="text-[11px] text-slate-500 font-medium">{userRole}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#012d1d] text-white flex items-center justify-center font-bold text-[12px] shadow-sm">
            <User className="w-4 h-4 text-white" />
          </div>
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
            title="Switch profile view"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

