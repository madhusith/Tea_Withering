"use client";

import Link from "next/link";
import {
  Fan,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";
import { useTelemetryRealtime } from "@/hooks/use-telemetry-realtime";

export default function DashboardOverviewPage() {
  const { troughs, dryer, lastHeartbeat, isConnected } = useTelemetryRealtime();

  const normalCount = troughs.filter((t) => t.status === "NORMAL").length;
  const warningCount = troughs.filter(
    (t) =>
      t.status === "WARNING" ||
      t.status === "CRITICAL" ||
      (t.status !== "OFFLINE" &&
        t.status !== "SENSOR_FAULT" &&
        t.delta !== null &&
        (t.delta > 8.0 || t.delta < 0.0))
  ).length;
  const issueCount = troughs.filter((t) => t.status === "SENSOR_FAULT").length;
  const offlineCount = troughs.filter((t) => t.status === "OFFLINE").length;

  const isDryerOffline = dryer.status === "OFFLINE";
  const isDryerIssue = dryer.status === "SENSOR_FAULT";
  const isDryerWarning =
    !isDryerOffline &&
    !isDryerIssue &&
    (dryer.status === "WARNING" ||
      dryer.status === "CRITICAL" ||
      (dryer.temperature !== null && (dryer.temperature > 90.0 || dryer.temperature < 80.0)));

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
              Trough Hall Active Cycle • Ingestre Tea Factory KVPL
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
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 text-emerald-900 shadow-xs border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-[13px] font-semibold">{normalCount} Normal</span>
          </div>
          {warningCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-900 shadow-xs border border-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span className="text-[13px] font-semibold">
                {warningCount} Warning (Exceeds Limit)
              </span>
            </div>
          )}
          {issueCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 shadow-xs border border-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[13px] font-semibold">
                {issueCount} Sensor Issue
              </span>
            </div>
          )}
          {offlineCount > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200/90 text-slate-700 shadow-xs border border-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-[13px] font-semibold">
                {offlineCount} Sensor Offline
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Top Highlight Section: Biomass Heating Bay (Dryer Machine) */}
      <section className="w-full">
        <div
          className={`rounded-2xl p-6 transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border ${
            isDryerWarning
              ? "bg-gradient-to-br from-rose-50/95 via-red-50/85 to-rose-100/80 border-rose-300 ring-1 ring-rose-200/80 shadow-[0_6px_24px_rgba(244,63,94,0.16)]"
              : isDryerIssue
              ? "bg-gradient-to-br from-amber-50/95 via-yellow-50/85 to-amber-100/80 border-amber-300 ring-1 ring-amber-200/80 shadow-[0_6px_24px_rgba(245,158,11,0.15)]"
              : isDryerOffline
              ? "bg-gradient-to-br from-slate-100/95 via-slate-100/90 to-slate-200/80 border-slate-300 ring-1 ring-slate-200/80 shadow-[0_6px_20px_rgba(100,116,139,0.12)]"
              : "bg-gradient-to-br from-emerald-50/95 via-emerald-50/80 to-teal-50/85 border-emerald-300 ring-1 ring-emerald-200/70 shadow-[0_6px_24px_rgba(16,185,129,0.14)]"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-5 z-10">
            {/* Visual Icon Avatar */}
            <div
              className={`w-14 h-14 rounded-xl text-white flex items-center justify-center shadow-md shrink-0 ${
                isDryerWarning
                  ? "bg-gradient-to-br from-rose-700 to-red-900 ring-1 ring-rose-400/30"
                  : isDryerIssue
                  ? "bg-gradient-to-br from-amber-600 to-yellow-800 ring-1 ring-amber-400/30"
                  : isDryerOffline
                  ? "bg-gradient-to-br from-slate-500 to-slate-700 ring-1 ring-slate-400/30"
                  : "bg-gradient-to-br from-[#012d1d] to-emerald-800 ring-1 ring-emerald-500/20"
              }`}
            >
              <Fan className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center flex-wrap gap-2.5">
                <h2 className="text-xl font-bold text-[#012d1d] tracking-tight">
                  {dryer.name}
                </h2>
                {isDryerWarning ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                    Warning • Exceeds Limit
                  </span>
                ) : isDryerIssue ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Sensor Issue
                  </span>
                ) : isDryerOffline ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/90 text-slate-700 text-[11px] font-bold border border-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Sensor Offline
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Normal
                  </span>
                )}
              </div>
              <span className="text-[13px] text-slate-600 mt-1 font-medium">
                {dryer.status_message}
              </span>
            </div>
          </div>

          {/* Temperature Metric Block & Link (DRYER: Single Temperature Only!) */}
          <div className="flex items-center flex-wrap gap-4 sm:gap-8 z-10 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Current Temp
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-3xl font-bold tabular-nums ${
                    isDryerWarning
                      ? "text-rose-700"
                      : isDryerIssue
                      ? "text-amber-800"
                      : isDryerOffline
                      ? "text-slate-400"
                      : "text-[#012d1d]"
                  }`}
                >
                  {dryer.temperature !== null ? dryer.temperature.toFixed(1) : "--"}
                </span>
                <span className="text-[14px] text-slate-500 font-medium">°C</span>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-300/70 hidden sm:block" />

            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Target Temp
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-semibold text-slate-600 tabular-nums">
                  {dryer.target_temperature.toFixed(1)}
                </span>
                <span className="text-[14px] text-slate-500 font-medium">°C</span>
              </div>
            </div>

            <Link
              href={`/dryers/${dryer.device_code}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-[13px] font-semibold transition-all shadow-sm w-full sm:w-auto"
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
        <span className="text-[12px] text-slate-500 font-medium">
          Real-time LoRa stream • {troughs.length - offlineCount} of {troughs.length} Online
        </span>
      </div>

      {/* Withering Troughs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {troughs.map((trough) => {
          const isOffline = trough.status === "OFFLINE";
          const isFault = trough.status === "SENSOR_FAULT";
          const isWarning =
            !isFault &&
            !isOffline &&
            (trough.status === "WARNING" ||
              trough.status === "CRITICAL" ||
              (trough.delta !== null && (trough.delta > 8.0 || trough.delta < 0.0)));

          return (
            <div
              key={trough.device_code}
              className={`group rounded-2xl p-5 transition-all flex flex-col justify-between border ${
                isWarning
                  ? "bg-gradient-to-br from-rose-50/95 via-red-50/80 to-rose-100/75 border-rose-300 ring-1 ring-rose-200/80 shadow-[0_6px_24px_rgba(244,63,94,0.16)] hover:shadow-[0_8px_28px_rgba(244,63,94,0.22)]"
                  : isFault
                  ? "bg-gradient-to-br from-amber-50/95 via-yellow-50/80 to-amber-100/75 border-amber-300 ring-1 ring-amber-200/80 shadow-[0_6px_24px_rgba(245,158,11,0.15)] hover:shadow-[0_8px_28px_rgba(245,158,11,0.22)]"
                  : isOffline
                  ? "bg-gradient-to-br from-slate-100/95 via-slate-100/85 to-slate-200/75 border-slate-300 ring-1 ring-slate-200/80 shadow-[0_6px_20px_rgba(100,116,139,0.12)] hover:shadow-[0_8px_24px_rgba(100,116,139,0.18)]"
                  : "bg-gradient-to-br from-emerald-50/95 via-emerald-50/75 to-teal-50/85 border-emerald-300 ring-1 ring-emerald-200/70 shadow-[0_6px_24px_rgba(16,185,129,0.14)] hover:shadow-[0_8px_28px_rgba(16,185,129,0.20)]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[16px] font-bold text-[#012d1d]">
                    {trough.name}
                  </span>
                  {isWarning ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      Warning • Exceeds Limit
                    </span>
                  ) : isFault ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Sensor Issue
                    </span>
                  ) : isOffline ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/90 text-slate-700 text-[11px] font-bold border border-slate-300 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      Sensor Offline
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Normal
                    </span>
                  )}
                </div>

                {/* Dual Temperatures: Dry Bulb & Wet Bulb */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div
                    className={`p-2.5 rounded-lg border ${
                      isWarning
                        ? "bg-white/85 border-rose-200/80"
                        : isFault
                        ? "bg-white/85 border-amber-200/80"
                        : isOffline
                        ? "bg-white/60 border-slate-200"
                        : "bg-white/85 border-emerald-200/80"
                    }`}
                  >
                    <span className="text-[11px] text-slate-500 font-medium block">Dry Bulb</span>
                    <span
                      className={`text-[16px] font-bold tabular-nums ${
                        isWarning
                          ? "text-rose-900"
                          : isFault
                          ? "text-amber-800"
                          : isOffline
                          ? "text-slate-400"
                          : "text-emerald-950"
                      }`}
                    >
                      {trough.temp_dry !== null ? `${trough.temp_dry.toFixed(1)}°C` : "-- °C"}
                    </span>
                  </div>
                  <div
                    className={`p-2.5 rounded-lg border ${
                      isWarning
                        ? "bg-white/85 border-rose-200/80"
                        : isFault
                        ? "bg-white/85 border-amber-200/80"
                        : isOffline
                        ? "bg-white/60 border-slate-200"
                        : "bg-white/85 border-emerald-200/80"
                    }`}
                  >
                    <span className="text-[11px] text-slate-500 font-medium block">Wet Bulb</span>
                    <span
                      className={`text-[16px] font-bold tabular-nums ${
                        isWarning
                          ? "text-rose-900"
                          : isFault
                          ? "text-amber-800"
                          : isOffline
                          ? "text-slate-400"
                          : "text-emerald-950"
                      }`}
                    >
                      {trough.temp_wet !== null ? `${trough.temp_wet.toFixed(1)}°C` : "-- °C"}
                    </span>
                  </div>
                </div>

                {/* Featured Metric: Calculated Wet-Bulb Depression (ΔT = Dry - Wet) */}
                <div
                  className={`p-3 rounded-lg border flex flex-col gap-1 ${
                    isWarning
                      ? "bg-rose-100/70 border-rose-300/90"
                      : isFault
                      ? "bg-amber-100/70 border-amber-300/90"
                      : isOffline
                      ? "bg-slate-200/60 border-slate-300/80"
                      : "bg-emerald-100/65 border-emerald-300/90"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] uppercase tracking-wider font-bold ${
                        isWarning
                          ? "text-rose-900"
                          : isFault
                          ? "text-amber-900"
                          : isOffline
                          ? "text-slate-600"
                          : "text-emerald-900"
                      }`}
                    >
                      Depression (ΔT)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Target 0.0–8.0°C</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-2xl font-bold tabular-nums ${
                        isWarning
                          ? "text-rose-700"
                          : isFault
                          ? "text-amber-800"
                          : isOffline
                          ? "text-slate-400"
                          : "text-emerald-800"
                      }`}
                    >
                      {trough.delta !== null ? `${trough.delta.toFixed(1)}°C` : "-- °C"}
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        isWarning
                          ? "text-rose-700"
                          : isFault
                          ? "text-amber-800"
                          : isOffline
                          ? "text-slate-500"
                          : "text-emerald-800"
                      }`}
                    >
                      {isWarning
                        ? "Exceeds Limit"
                        : isFault
                        ? "Probe Issue"
                        : isOffline
                        ? "Sensor Offline"
                        : "Within Target"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer with Link */}
              <div
                className={`pt-4 border-t mt-4 flex items-center justify-between ${
                  isWarning
                    ? "border-rose-200/70"
                    : isFault
                    ? "border-amber-200/70"
                    : isOffline
                    ? "border-slate-300/70"
                    : "border-emerald-200/70"
                }`}
              >
                <span className="text-[11px] text-slate-500 font-medium">
                  {trough.last_seen_at}
                </span>
                <Link
                  href={`/troughs/${trough.device_code}`}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#012d1d] hover:underline group-hover:translate-x-0.5 transition-all"
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
