"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCheck,
  History,
  AlertTriangle,
  CheckCircle2,
  Check,
  Clock,
  Moon,
  RotateCw,
} from "lucide-react";
import { useTelemetryRealtime } from "@/context/telemetry-context";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export default function AlertsPage() {
  const { alerts, updateAlarmState, refreshTelemetry } = useTelemetryRealtime();
  const { isViewer } = useAuth();
  const [filter, setFilter] = useState<"all" | "active" | "snoozed" | "resolved">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const snoozedCount = alerts.filter((a) => a.status === "snoozed").length;
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const handleResolve = async (id: string) => {
    try {
      await updateAlarmState(id, "CLEARED");
      toast.success("Incident marked as resolved/cleared in Supabase.");
    } catch {
      toast.error("Failed to update incident.");
    }
  };

  const handleSnooze = async (id: string) => {
    try {
      await updateAlarmState(id, "SNOOZED");
      toast.info("Incident snoozed for 30 minutes. Status remains open.");
    } catch {
      toast.error("Failed to snooze incident.");
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      const activeAlerts = alerts.filter((a) => a.status === "active");
      await Promise.all(activeAlerts.map((a) => updateAlarmState(a.id, "ACKNOWLEDGED")));
      toast.success(`Acknowledged ${activeAlerts.length} active incidents.`);
    } catch {
      toast.error("Failed to acknowledge incidents.");
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshTelemetry();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success("Synced latest alarms from database.");
  };

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
            Alerts &amp; Notifications
          </h1>
          <p className="text-[14px] text-slate-500">
            Real-time alerts, threshold violations, and incident audit log.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-lg bg-white shadow-xs hover:bg-slate-50 text-slate-700 font-semibold text-[13px] flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh alerts from database"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>
          {!isViewer && (
            <button
              type="button"
              onClick={handleAcknowledgeAll}
              className="px-4 py-2 rounded-lg bg-white shadow-xs hover:bg-slate-50 text-slate-700 font-semibold text-[13px] flex items-center gap-2 border border-slate-200 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-slate-500" />
              <span>Acknowledge All</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Alerts */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex items-center justify-between relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0284c7]" />
          <div className="flex flex-col gap-1 pl-1">
            <span className="text-[12px] text-slate-500 uppercase tracking-wider font-semibold">
              Total Alerts
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#0f172a] tabular-nums">
                {alerts.length}
              </span>
              <span className="text-[12px] text-slate-400">Recorded 24h</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#e0f2fe] flex items-center justify-center text-[#0284c7]">
            <History className="w-5 h-5" />
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-amber-200 flex items-center justify-between relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ea580c]" />
          <div className="flex flex-col gap-1 pl-1">
            <span className="text-[12px] text-[#9a3412] uppercase tracking-wider font-bold">
              Active Alerts
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#c2410c] tabular-nums">
                {activeCount}
              </span>
              <span className="text-[12px] text-[#ea580c] font-medium">
                Requires Attention
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#ffedd5] text-[#ea580c] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Resolved Alerts */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-emerald-200 flex items-center justify-between relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#116c4a]" />
          <div className="flex flex-col gap-1 pl-1">
            <span className="text-[12px] text-[#116c4a] uppercase tracking-wider font-bold">
              Resolved Alerts
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#116c4a] tabular-nums">
                {resolvedCount}
              </span>
              <span className="text-[12px] text-[#116c4a] font-medium">
                Normalized
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-[#e8f5e9] text-[#116c4a] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
            filter === "all"
              ? "bg-[#1b4332] text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-[#0b1c30] border border-slate-200"
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
            filter === "active"
              ? "bg-[#1b4332] text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-[#0b1c30] border border-slate-200"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("snoozed")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
            filter === "snoozed"
              ? "bg-[#1b4332] text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-[#0b1c30] border border-slate-200"
          }`}
        >
          Snoozed ({snoozedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("resolved")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
            filter === "resolved"
              ? "bg-[#1b4332] text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-[#0b1c30] border border-slate-200"
          }`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Alerts Table Card */}
      <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-6 font-semibold">Factory</th>
                <th className="py-3 px-6 font-semibold">Bay / Device</th>
                <th className="py-3 px-6 font-semibold">Alert Message</th>
                <th className="py-3 px-6 font-semibold">Date &amp; Time</th>
                <th className="py-3 px-6 font-semibold">Status</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-4 px-6 font-semibold text-[#0b1c30]">
                    {alert.factory_name}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#0369a1] bg-[#e0f2fe] px-2.5 py-1 rounded-md text-[12px]">
                      {alert.status === "active" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-pulse" />
                      )}
                      {alert.device_name}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-[#0b1c30]">
                    {alert.message}
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-[12px]">
                    {alert.triggered_at}
                  </td>
                  <td className="py-4 px-6">
                    {alert.status === "active" && (
                      alert.severity === "critical" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-pulse" />
                          Critical
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                          Warning
                        </span>
                      )
                    )}
                    {alert.status === "snoozed" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-100 text-[#0369a1] text-[11px] font-bold">
                        <Moon className="w-3 h-3 text-[#0284c7]" />
                        Snoozed
                      </span>
                    )}
                    {alert.status === "resolved" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#116c4a]" />
                        Resolved
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {isViewer ? (
                      <span className="text-[11px] text-slate-400 font-medium italic">
                        View only
                      </span>
                    ) : alert.status === "active" ? (
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleSnooze(alert.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Snooze (does not resolve)"
                        >
                          <Moon className="w-3 h-3" />
                          <span>Snooze</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(alert.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1b4332] text-white hover:bg-[#0284c7] text-[12px] font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      </div>
                    ) : alert.status === "snoozed" ? (
                      <div className="inline-flex items-center gap-2 justify-end">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {alert.snoozed_until}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleResolve(alert.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1b4332] text-white hover:bg-[#0284c7] text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Resolve</span>
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#059669] text-[12px] font-medium">
                        Resolved ✓
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-slate-50 flex items-center justify-between text-[12px] text-slate-500 border-t border-slate-200">
          <span>Showing recent batch telemetry alerts</span>
          <span className="text-[#116c4a] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#116c4a] animate-pulse" />
            Auto-polling sync active (15s)
          </span>
        </div>
      </div>
    </div>
  );
}
