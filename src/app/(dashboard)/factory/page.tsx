"use client";

import Link from "next/link";
import {
  Factory,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { useTelemetryRealtime } from "@/hooks/use-telemetry-realtime";

export default function FactoryMonitoringPage() {
  const { troughs, lastHeartbeat, isConnected } = useTelemetryRealtime();

  const normalCount = troughs.filter((t) => t.status === "NORMAL").length;
  const warningCount = troughs.filter((t) => t.status === "WARNING").length;

  const avgDepression =
    troughs.length > 0
      ? (troughs.reduce((acc, t) => acc + t.delta, 0) / troughs.length).toFixed(1)
      : "4.2";

  return (
    <div className="max-w-7xl mx-auto w-full pb-12 flex flex-col gap-5 py-3">
      {/* 1. Header & Live Telemetry Badge */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-[#116c4a] animate-pulse" : "bg-amber-600"
              }`}
            />
            <span className="text-[11px] uppercase tracking-wider text-[#116c4a] font-bold">
              Factory Monitoring • Withering Hall
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#012d1d] tracking-tight">
            Trough Telemetry Matrix
          </h1>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Real-time dry bulb, wet bulb &amp; hygrometric depression (ΔT) • Updated {lastHeartbeat}
          </p>
        </div>

        {/* Quick Operational Pills */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>{normalCount} In Target</span>
          </div>
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              <span>{warningCount} Deviating</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-semibold">
            <span>Avg ΔT: {avgDepression}°C</span>
          </div>
        </div>
      </section>

      {/* 2. Troughs Grid: Compact, simple cards for all bays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {troughs.map((trough) => {
          const isWarning =
            trough.status === "WARNING" || trough.delta > 4.8 || trough.delta < 3.5;

          return (
            <div
              key={trough.device_code}
              className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Bay Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isWarning ? "bg-amber-600 animate-pulse" : "bg-emerald-600"
                      }`}
                    />
                    <h2 className="text-[15px] font-bold text-[#012d1d]">
                      {trough.name}
                    </h2>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isWarning
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {isWarning ? "Attention" : "Optimal"}
                  </span>
                </div>

                {/* Dry & Wet Bulb Readings */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Dry Bulb
                    </span>
                    <span className="text-[16px] font-bold text-[#1b4332] tabular-nums mt-0.5">
                      {trough.temp_dry.toFixed(1)}°C
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Wet Bulb
                    </span>
                    <span className="text-[16px] font-bold text-[#0284c7] tabular-nums mt-0.5">
                      {trough.temp_wet.toFixed(1)}°C
                    </span>
                  </div>
                </div>

                {/* Wet Bulb Depression Delta */}
                <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-amber-900 font-bold">
                      Depression (ΔT)
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Target 3.5–4.8°C
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-amber-900 tabular-nums">
                      {trough.delta.toFixed(1)}°C
                    </span>
                    <span className="text-[11px] text-amber-700 font-medium">
                      {trough.delta >= 3.5 && trough.delta <= 4.8
                        ? "Within Target"
                        : "Out of Band"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer with Link */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {trough.device_code} • {trough.last_seen_at}
                </span>
                <Link
                  href={`/troughs/${trough.device_code}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#116c4a] hover:text-[#012d1d] transition-colors"
                >
                  <span>Dial Detail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Detailed Comparative Telemetry Table */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#012d1d]" />
            <h3 className="text-[15px] font-bold text-[#012d1d]">
              Live Sensor Telemetry Log
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Updated via LoRa Gateway • 100% Signal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Trough Code</th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Dry Bulb</th>
                <th className="py-2.5 px-4">Wet Bulb</th>
                <th className="py-2.5 px-4">Depression (ΔT)</th>
                <th className="py-2.5 px-4">Operating Envelope</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {troughs.map((t) => {
                const inBand = t.delta >= 3.5 && t.delta <= 4.8;
                return (
                  <tr key={t.device_code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-700">
                      {t.device_code}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#012d1d]">
                      {t.name}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#1b4332] tabular-nums">
                      {t.temp_dry.toFixed(1)}°C
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#0284c7] tabular-nums">
                      {t.temp_wet.toFixed(1)}°C
                    </td>
                    <td className="py-2.5 px-4 font-bold text-amber-900 tabular-nums">
                      {t.delta.toFixed(1)}°C
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inBand
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {inBand ? "In Target (3.5–4.8°C)" : "Deviation"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.status === "NORMAL" ? "bg-emerald-600" : "bg-amber-600 animate-pulse"
                          }`}
                        />
                        <span className="font-medium text-slate-700">
                          {t.status === "NORMAL" ? "Normal" : "Warning"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        href={`/troughs/${t.device_code}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#116c4a] hover:underline"
                      >
                        <span>Open Bay</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
