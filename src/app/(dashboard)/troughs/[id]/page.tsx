"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Wifi, Sliders, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { useTelemetryRealtime } from "@/context/telemetry-context";
import { mockTroughs } from "@/lib/mock-data";
import { AnalogGauge } from "@/components/ui/analog-gauge";
import { DepressionTargetBar } from "@/components/ui/depression-target-bar";
import { TemperatureTrendChart } from "@/components/charts/temperature-trend-chart";

export default function TroughDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { troughs } = useTelemetryRealtime();

  const liveTrough = troughs.find((t) => t.device_code === id || t.id === id);
  const fallbackTrough = mockTroughs.find((t) => t.device_code === id) || mockTroughs[0];
  const trough = liveTrough || fallbackTrough;

  const isSensorFault = trough.status === "SENSOR_FAULT";
  const isOffline = trough.status === "OFFLINE";
  const isWarning =
    !isSensorFault &&
    !isOffline &&
    (trough.status === "WARNING" ||
      trough.status === "CRITICAL" ||
      (trough.delta !== null && (trough.delta > 4.8 || trough.delta < 3.5)));

  return (
    <div className="max-w-7xl mx-auto w-full pb-12 flex flex-col gap-5 py-3">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex flex-col gap-1.5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#116c4a] hover:text-[#012d1d] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#012d1d] tracking-tight">
              {trough.name} Monitoring
            </h1>
            {isWarning ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                Warning • Exceeds Limit
              </span>
            ) : isSensorFault ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Sensor Issue
              </span>
            ) : isOffline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/90 text-slate-700 border border-slate-300 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Sensor Offline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Normal
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white shadow-xs border border-slate-200 self-start sm:self-auto text-[11px]">
          <Wifi className={`w-3.5 h-3.5 ${isWarning ? "text-rose-600" : isSensorFault ? "text-amber-600" : isOffline ? "text-slate-400" : "text-emerald-600"}`} />
          <span className="text-slate-500 font-medium">
            Updated {trough.last_seen_at} •{" "}
            <span className={`font-semibold ${isWarning ? "text-rose-700" : isSensorFault ? "text-amber-700" : isOffline ? "text-slate-600" : "text-emerald-700"}`}>
              {isWarning ? "Exceeds Limit" : isSensorFault ? "Sensor Issue" : isOffline ? "Sensor Offline" : "Sensor Connected"}
            </span>
          </span>
        </div>
      </div>

      {/* Main Telemetry Grid: 3 Clean, Compact Cards (4 + 4 + 4 = 12 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Dry Bulb Temperature */}
        <div className={`bg-white rounded-xl p-5 shadow-xs border flex flex-col items-center justify-between ${isSensorFault ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"}`}>
          <div className="w-full flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSensorFault ? "bg-rose-500" : "bg-[#1B4332]"}`} />
              <span className="text-[14px] font-bold text-[#0B1C30]">
                Dry Temperature
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B4332] font-semibold">
              {trough.sensor_dry_code || "Sensor A1"}
            </span>
          </div>

          <AnalogGauge
            value={trough.temp_dry}
            min={0}
            max={50}
            unit="°C"
            label="Dry Bulb Temperature"
            color={isSensorFault ? "#e11d48" : "#1B4332"}
          />
        </div>

        {/* Card 2: Wet Bulb Temperature */}
        <div className={`bg-white rounded-xl p-5 shadow-xs border flex flex-col items-center justify-between ${isSensorFault ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"}`}>
          <div className="w-full flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSensorFault ? "bg-rose-500" : "bg-[#0284C7]"}`} />
              <span className="text-[14px] font-bold text-[#0B1C30]">
                Wet Temperature
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] font-semibold">
              {trough.sensor_wet_code || "Sensor B1"}
            </span>
          </div>

          <AnalogGauge
            value={trough.temp_wet}
            min={0}
            max={50}
            unit="°C"
            label="Wet Bulb Temperature"
            color={isSensorFault ? "#e11d48" : "#0284C7"}
          />
        </div>

        {/* Card 3: Wet-Bulb Depression (ΔT = Dry - Wet) */}
        <div className={`bg-white rounded-xl p-5 shadow-xs border flex flex-col justify-between ${isSensorFault ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"}`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-[#0B3C5D] font-bold">
                Wet-Bulb Depression (ΔT)
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1B4332] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />
                Target 3.5–4.8°C
              </span>
            </div>
            <h2 className="text-[15px] font-bold text-[#0B1C30]">
              Difference (Dry − Wet)
            </h2>

            <div className="my-3 flex flex-col items-start gap-1.5">
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold tracking-tight tabular-nums ${isSensorFault ? "text-rose-700" : isOffline ? "text-slate-400" : "text-amber-900"}`}>
                  {trough.delta !== null && trough.delta !== undefined ? `${trough.delta.toFixed(1)}°C` : "-- °C"}
                </span>
                <span className="text-[12px] text-slate-500 font-semibold">
                  {isSensorFault ? "Probes Disconnected" : isOffline ? "Waiting" : "ΔT Measured"}
                </span>
              </div>
              {isSensorFault && (
                <div className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 text-[11px] font-semibold flex items-center gap-1.5 border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Physical PT100 temperature sensors disconnected</span>
                </div>
              )}
              {isWarning && (
                <div className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold flex items-center gap-1.5 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{trough.status_message || "Exceeds 5.0°C Target"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Range Visual Envelope Bar */}
          <div className="mt-2 pt-3 border-t border-slate-100">
            <DepressionTargetBar measuredDelta={trough.delta} minTarget={3.5} maxTarget={4.8} maxScale={8.0} />
          </div>
        </div>
      </div>

      {/* Temperature Trend Chart with Time Filters */}
      <TemperatureTrendChart
        deviceId={trough.id}
        deviceCode={trough.device_code}
        currentDryTemp={trough.temp_dry}
        currentWetTemp={trough.temp_wet}
      />

      {/* Bottom Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#1b4332] shrink-0">
            <Sliders className="w-4 h-4 text-[#1b4332]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Specification Baseline
            </span>
            <span className="text-[12px] text-[#0b1c30] font-semibold">
              Acceptable Operating Delta: 3.5°C – 4.8°C
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#116c4a] shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Diagnostic Status
            </span>
            <span className={`text-[12px] font-semibold ${isSensorFault ? "text-rose-700" : isOffline ? "text-slate-500" : "text-[#116c4a]"}`}>
              {isSensorFault ? "Hardware Online • Sensor Probe Fault" : isOffline ? "Hardware Awaiting Packet" : "Sensor Health: Optimal • Bus Latency 14ms"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
