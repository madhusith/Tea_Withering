"use client";

import { useState } from "react";
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
  Building2,
  Clock,
  Loader2,
  TrendingDown,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useTelemetry } from "@/context/telemetry-context";

export default function ReportsPage() {
  const { isViewer } = useAuth();
  const { currentFactory, troughs, dryer, alerts } = useTelemetry();
  const [selectedRange, setSelectedRange] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [exportingType, setExportingType] = useState<string | null>(null);

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

  const handleExport = async (type: string) => {
    try {
      setExportingType(type);
      const url = `/api/reports/export?type=${type}&range=${selectedRange}&factory_id=${currentFactory.id}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `report-${type}-${currentFactory.code}-${selectedRange}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export report CSV. Please try again.");
    } finally {
      setExportingType(null);
    }
  };

  const reportsList = [
    {
      id: "troughs",
      title: "Withering Trough Depression Analysis",
      description: "Hygrometric depression trend (ΔT), dry-bulb and wet-bulb records across all active withering troughs.",
      category: "Troughs Telemetry",
      icon: TrendingDown,
      badgeColor: "bg-emerald-50 text-[#116c4a] border-emerald-100",
    },
    {
      id: "dryer",
      title: "Biomass Heating Bay Temperature Log",
      description: "Flue-gas heat exchanger supply air stream telemetry and setpoint stability log (Single temperature strictly).",
      category: "Dryer / Heating Bay",
      icon: BarChart3,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
    },
    {
      id: "alarms",
      title: "Alarm & Deviation Event History",
      description: "Full audit trail of triggered, acknowledged, snoozed, and cleared alarms with operator actions.",
      category: "Alarms & Compliance",
      icon: AlertTriangle,
      badgeColor: "bg-rose-50 text-rose-700 border-rose-100",
    },
    {
      id: "connectivity",
      title: "Gateway & Device Connectivity Audit",
      description: "LoRa link diagnostics, packet sequence metrics, battery levels, and node uptime audit logs.",
      category: "Hardware Diagnostics",
      icon: Radio,
      badgeColor: "bg-sky-50 text-sky-700 border-sky-100",
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
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-3xl font-bold text-[#012d1d] tracking-tight">
              Management Reports
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e8f5e9] text-[#116c4a] border border-[#c8e6c9]">
              <Building2 className="w-3.5 h-3.5" />
              {currentFactory.name}
            </span>
          </div>
          <p className="text-[14px] text-slate-500">
            Historical analysis, withering batch telemetry, and compliance exports.
          </p>
        </div>

        {/* Date Range Selector Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 pl-2.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Range:
          </span>
          {(["24h", "7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRange(r)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors capitalize ${
                selectedRange === r
                  ? "bg-[#116c4a] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {r === "24h" ? "Last 24h" : r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Snapshot Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Factory</span>
          <p className="text-lg font-bold text-[#012d1d] mt-1">{currentFactory.name}</p>
          <p className="text-xs text-slate-500">{currentFactory.code} • {currentFactory.location || "Central Province"}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monitored Troughs</span>
          <p className="text-lg font-bold text-[#116c4a] mt-1">{troughs.length} Active Bays</p>
          <p className="text-xs text-slate-500">Depression target 3.5°C – 4.8°C</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Biomass Heating</span>
          <p className="text-lg font-bold text-[#0284c7] mt-1">1 Biomass Bay</p>
          <p className="text-xs text-slate-500">Target supply air: 85.0°C</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alarms Tracked</span>
          <p className="text-lg font-bold text-amber-600 mt-1">{alerts.length} Incidents</p>
          <p className="text-xs text-slate-500">Compliant with quality audit standards</p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          const isExporting = exportingType === rep.id;

          return (
            <div
              key={rep.id}
              className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${rep.badgeColor}`}>
                    {rep.category}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h2 className="text-[16px] font-bold text-[#0b1c30]">
                  {rep.title}
                </h2>
                <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
                  {rep.description}
                </p>
              </div>

              <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[12px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#116c4a]" />
                  Format: RFC 4180 CSV
                </span>
                <button
                  type="button"
                  onClick={() => handleExport(rep.id)}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#116c4a] hover:bg-[#0c4e35] disabled:opacity-60 text-white text-[12px] font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
