"use client";

import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function ReportsPage() {
  const { isViewer } = useAuth();

  if (isViewer) {
    return (
      <div className="flex flex-col gap-6 py-12 max-w-2xl mx-auto items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 text-[#0284c7] flex items-center justify-center shadow-xs">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#012d1d]">
            Access Restricted: Viewers
          </h1>
          <p className="text-[14px] text-slate-500 max-w-md mx-auto">
            Audit exports and analytics reports are restricted to Factory Managers and Estate Administrators. You are currently signed in as a <span className="font-bold capitalize text-slate-700">Viewer</span>.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg bg-[#116c4a] text-white font-semibold text-[13px] hover:bg-[#0c4e35] shadow-xs flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const reportsList = [
    {
      title: "Temperature History by Factory",
      description: "Aggregated ambient dry/wet bulb readings across all factory troughs.",
      category: "Factory Overview",
      lastGenerated: "Today, 06:00 AM",
    },
    {
      title: "Withering Trough Depression Analysis",
      description: "Hourly hygrometric depression trend (ΔT) across Withering Bays 01–04.",
      category: "Troughs",
      lastGenerated: "Today, 07:30 AM",
    },
    {
      title: "Biomass Heating Bay Temperature Log",
      description: "Flue-gas heat exchanger supply stream telemetry and setpoint variance.",
      category: "Dryer / Heating Bay",
      lastGenerated: "Today, 08:00 AM",
    },
    {
      title: "Alarm & Deviation Event History",
      description: "Audit trail of all triggered, snoozed, and resolved alarms.",
      category: "Alarms & Compliance",
      lastGenerated: "Yesterday, 06:00 PM",
    },
    {
      title: "Gateway & Device Connectivity Audit",
      description: "LoRa link RSSI/SNR metrics, packet drop statistics, and offline events.",
      category: "Hardware Diagnostics",
      lastGenerated: "Yesterday, 11:59 PM",
    },
  ];

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#012d1d] text-[13px] font-semibold transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#012d1d] tracking-tight mt-1">
            Management Reports
          </h1>
          <p className="text-[14px] text-slate-500">
            Historical analysis, batch reports, and compliance exports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold flex items-center gap-2 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Last 7 Days</span>
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportsList.map((rep, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#0284c7] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                  {rep.category}
                </span>
                <span className="text-[11px] text-slate-400">
                  {rep.lastGenerated}
                </span>
              </div>
              <h2 className="text-[15px] font-bold text-[#0b1c30]">
                {rep.title}
              </h2>
              <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                {rep.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#116c4a]" />
                Ready to Export
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#eff4ff] text-[#0a369d] text-[12px] font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export (.CSV)</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

