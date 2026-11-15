"use client";

import Link from "next/link";
import {
  Fan,
  ArrowRight,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useTelemetryRealtime } from "@/hooks/use-telemetry-realtime";

export default function DashboardOverviewPage() {
  const { troughs, dryer, lastHeartbeat, isConnected } = useTelemetryRealtime();

  const normalCount = troughs.filter((t) => t.status === "NORMAL").length;
  const warningCount = troughs.filter((t) => t.status === "WARNING").length;

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Top Action & Overview Header */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? "bg-[#116c4a] animate-ping opacity-75" : "bg-amber-600"
              }`}
            />
            <span className="text-[11px] uppercase tracking-wider text-[#116c4a] font-bold">
              Trough Hall Active Cycle • St. Clair Estate
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#012d1d] tracking-tight">
            Factory Overview
          </h1>
          <p className="text-[14px] text-slate-500 mt-0.5">
            {troughs.length} Withering Bays • Real-time Telemetry (Updated {lastHeartbeat})
          </p>
        </div>

        {/* Quick Status Pill Counters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8f5e9] text-[#1b4332] shadow-xs border border-[#c8e6c9]">
            <span className="w-2 h-2 rounded-full bg-[#116c4a]" />
            <span className="text-[13px] font-semibold">{normalCount} Normal</span>
          </div>
          {warningCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fef3c7] text-[#92400e] shadow-xs border border-[#fde68a]">
              <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
              <span className="text-[13px] font-semibold">
                {warningCount} Attention Required
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Top Highlight Section: Biomass Heating Bay (Dryer Machine) */}
      <section className="w-full">
        <div
          className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{
            background:
              "linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(241, 247, 252) 60%, rgb(232, 244, 236) 100%)",
            border: "1px solid rgba(2, 132, 199, 0.25)",
            boxShadow: "0 4px 20px rgba(1, 45, 29, 0.06)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-5 z-10">
            {/* Visual Icon Avatar */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#012d1d] to-[#1e3a8a] text-white flex items-center justify-center shadow-md ring-1 ring-blue-500/20 shrink-0">
              <Fan className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-[#012d1d] tracking-tight">
                  {dryer.name}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e8f5e9] text-[#1b4332] text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#116c4a]" />
                  {dryer.status}
                </span>
              </div>
              <span className="text-[13px] text-slate-500 mt-1">
                {dryer.status_message}
              </span>
            </div>
          </div>

          {/* Temperature Metric Block & Link (DRYER: Single Temperature Only!) */}
          <div className="flex items-center flex-wrap gap-8 z-10">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Current Temp
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-bold text-[#012d1d] tabular-nums">
                  {dryer.temperature.toFixed(1)}
                </span>
                <span className="text-[14px] text-slate-500 font-medium">°C</span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden sm:block" />

            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Target Temp
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-semibold text-slate-500 tabular-nums">
                  {dryer.target_temperature.toFixed(1)}
                </span>
                <span className="text-[14px] text-slate-400 font-medium">°C</span>
              </div>
            </div>

            <Link
              href={`/dryers/${dryer.device_code}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-[13px] font-semibold transition-all shadow-sm ml-auto sm:ml-0"
              style={{
                background:
                  "linear-gradient(135deg, rgb(11, 60, 93) 0%, rgb(30, 64, 175) 100%)",
                boxShadow: "0 2px 8px rgba(30, 64, 175, 0.25)",
              }}
            >
              <span>View Heating Bay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Withering Bays Grid Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-[#012d1d]" />
          <h3 className="text-lg font-bold text-[#012d1d]">
            Active Withering Troughs
          </h3>
        </div>
        <span className="text-[12px] text-slate-400">
          Real-time LoRa stream • {troughs.length} Bays Active
        </span>
      </div>

      {/* Withering Troughs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {troughs.map((trough) => {
          const isWarning =
            trough.status === "WARNING" || trough.delta > 4.8 || trough.delta < 3.5;

          return (
            <div
              key={trough.device_code}
              className="group bg-white rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between border border-slate-200/70"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[16px] font-bold text-[#012d1d]">
                    {trough.name}
                  </span>
                  {isWarning ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] animate-pulse" />
                      Warning
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e8f5e9] text-[#1b4332] text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#116c4a]" />
                      Normal
                    </span>
                  )}
                </div>

                {/* Dual Temperatures: Dry Bulb & Wet Bulb */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-[#eff4ff]">
                    <span className="text-[11px] text-slate-500 block">Dry Bulb</span>
                    <span className="text-[16px] font-bold text-[#0b1c30] tabular-nums">
                      {trough.temp_dry.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#eff4ff]">
                    <span className="text-[11px] text-slate-500 block">Wet Bulb</span>
                    <span className="text-[16px] font-bold text-[#0b1c30] tabular-nums">
                      {trough.temp_wet.toFixed(1)}°C
                    </span>
                  </div>
                </div>

                {/* Featured Metric: Calculated Wet-Bulb Depression (ΔT = Dry - Wet) */}
                <div
                  className={`p-3 rounded-lg border flex flex-col gap-1 ${
                    isWarning
                      ? "bg-amber-50/60 border-amber-200"
                      : "bg-[#f8f9ff] border-blue-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#0b3c5d]">
                      Depression (ΔT)
                    </span>
                    <span className="text-[10px] text-slate-400">Target 3.5–4.8°C</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-2xl font-bold tabular-nums ${
                        isWarning ? "text-amber-800" : "text-[#1b4332]"
                      }`}
                    >
                      {trough.delta.toFixed(1)}°C
                    </span>
                    <span className="text-[11px] text-slate-500">Difference</span>
                  </div>
                </div>
              </div>

              {/* Card Footer with Link */}
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {trough.last_seen_at}
                </span>
                <Link
                  href={`/troughs/${trough.device_code}`}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#116c4a] hover:text-[#012d1d] group-hover:translate-x-0.5 transition-all"
                >
                  <span>Monitor Bay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
