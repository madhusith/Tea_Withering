"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Factory,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Plus,
  Trash2,
  X,
  Radio,
} from "lucide-react";
import { useTelemetryRealtime } from "@/hooks/use-telemetry-realtime";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export default function FactoryMonitoringPage() {
  const { troughs, lastHeartbeat, isConnected, addTrough, removeTrough } = useTelemetryRealtime();
  const { isViewer } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceCode, setDeviceCode] = useState("");
  const [bayName, setBayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const normalCount = troughs.filter((t) => t.status === "NORMAL").length;
  const warningCount = troughs.filter((t) => t.status === "WARNING" || t.status === "SENSOR_FAULT").length;

  const validDeltas = troughs.filter((t) => t.delta !== null && t.delta !== undefined).map((t) => t.delta as number);
  const avgDepression =
    validDeltas.length > 0
      ? (validDeltas.reduce((acc, d) => acc + d, 0) / validDeltas.length).toFixed(1)
      : "--";

  const handleOpenAddModal = () => {
    // Auto suggest next code
    const nextNum = troughs.length + 1;
    const padded = nextNum < 10 ? `00${nextNum}` : `0${nextNum}`;
    const bayNum = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setDeviceCode(`TR-${padded}`);
    setBayName(`Bay ${bayNum}`);
    setIsModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceCode.trim() || !bayName.trim()) {
      toast.error("Please provide both Trough Code and Bay Name.");
      return;
    }

    setIsSubmitting(true);
    const res = await addTrough(deviceCode.trim(), bayName.trim());
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Trough ${deviceCode.toUpperCase()} registered and synchronized with Supabase.`);
      setIsModalOpen(false);
    } else {
      toast.error(res.error || "Failed to register trough.");
    }
  };

  const handleRemove = async (troughId: string, troughName: string) => {
    if (!window.confirm(`Are you sure you want to decommission ${troughName}?`)) {
      return;
    }

    setDeletingId(troughId);
    const res = await removeTrough(troughId);
    setDeletingId(null);

    if (res.success) {
      toast.success(`${troughName} decommissioned successfully.`);
    } else {
      toast.error(res.error || "Failed to remove trough.");
    }
  };

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
            Real-time dry bulb, wet bulb &amp; hygrometric depression (ΔT) • Updated {lastHeartbeat} •{" "}
            <span className="font-semibold text-slate-700">{troughs.length} Troughs Online</span>
          </p>
        </div>

        {/* Action Button & Operational Pills */}
        <div className="flex items-center flex-wrap gap-2.5">
          {!isViewer && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 rounded-lg bg-[#116c4a] text-white hover:bg-[#0c4e35] text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Trough</span>
            </button>
          )}

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

      {/* 2. Troughs Grid: Dynamic auto-scaling grid for any number of bays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {troughs.map((trough) => {
          const isOffline = trough.status === "OFFLINE";
          const isSensorFault = trough.status === "SENSOR_FAULT";
          const isWarning =
            !isOffline &&
            !isSensorFault &&
            (trough.status === "WARNING" ||
              trough.status === "CRITICAL" ||
              (trough.delta !== null && (trough.delta > 4.8 || trough.delta < 3.5)));

          return (
            <div
              key={trough.device_code}
              className={`rounded-2xl p-4 border flex flex-col justify-between transition-all relative group ${
                isWarning
                  ? "bg-gradient-to-br from-rose-50/95 via-red-50/80 to-rose-100/75 border-rose-300 ring-1 ring-rose-200/80 shadow-[0_6px_24px_rgba(244,63,94,0.16)]"
                  : isSensorFault
                  ? "bg-gradient-to-br from-amber-50/95 via-yellow-50/80 to-amber-100/75 border-amber-300 ring-1 ring-amber-200/80 shadow-[0_6px_24px_rgba(245,158,11,0.15)]"
                  : isOffline
                  ? "bg-gradient-to-br from-slate-100/95 via-slate-100/85 to-slate-200/75 border-slate-300 ring-1 ring-slate-200/80 shadow-[0_6px_20px_rgba(100,116,139,0.12)]"
                  : "bg-gradient-to-br from-emerald-50/95 via-emerald-50/75 to-teal-50/85 border-emerald-300 ring-1 ring-emerald-200/70 shadow-[0_6px_24px_rgba(16,185,129,0.14)]"
              }`}
            >
              <div>
                {/* Bay Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isWarning
                          ? "bg-rose-600 animate-pulse"
                          : isSensorFault
                          ? "bg-amber-500 animate-pulse"
                          : isOffline
                          ? "bg-slate-500"
                          : "bg-emerald-600"
                      }`}
                    />
                    <h2 className="text-[15px] font-bold text-[#012d1d]">
                      {trough.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isWarning
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : isSensorFault
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : isOffline
                          ? "bg-slate-200/90 text-slate-700 border border-slate-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      {isWarning
                        ? "Exceeds Limit"
                        : isSensorFault
                        ? "Sensor Issue"
                        : isOffline
                        ? "Sensor Offline"
                        : "Normal"}
                    </span>
                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => handleRemove(trough.id, trough.name)}
                        disabled={deletingId === trough.id}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-1 rounded cursor-pointer"
                        title="Decommission trough"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dry & Wet Bulb Readings */}
                <div
                  className={`grid grid-cols-2 gap-2 p-2.5 rounded-lg mb-3 border ${
                    isWarning
                      ? "bg-white/85 border-rose-200/80"
                      : isSensorFault
                      ? "bg-white/85 border-amber-200/80"
                      : isOffline
                      ? "bg-white/60 border-slate-200"
                      : "bg-white/85 border-emerald-200/80"
                  }`}
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Dry Bulb
                    </span>
                    <p
                      className={`text-xl font-bold tabular-nums mt-0.5 ${
                        isOffline ? "text-slate-400" : "text-[#1b4332]"
                      }`}
                    >
                      {trough.temp_dry !== null ? `${trough.temp_dry.toFixed(1)}°C` : "-- °C"}
                    </p>
                  </div>
                  <div className="border-l border-slate-200 pl-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Wet Bulb
                    </span>
                    <p
                      className={`text-xl font-bold tabular-nums mt-0.5 ${
                        isOffline ? "text-slate-400" : "text-[#0284c7]"
                      }`}
                    >
                      {trough.temp_wet !== null ? `${trough.temp_wet.toFixed(1)}°C` : "-- °C"}
                    </p>
                  </div>
                </div>

                {/* Calculated Hygrometric Depression (ΔT) */}
                <div
                  className={`p-2.5 rounded-lg border mb-3 flex items-center justify-between ${
                    isWarning
                      ? "bg-rose-100/70 border-rose-300 text-rose-900"
                      : isSensorFault
                      ? "bg-amber-100/70 border-amber-300 text-amber-900"
                      : isOffline
                      ? "bg-slate-200/60 border-slate-300 text-slate-500"
                      : "bg-emerald-100/65 border-emerald-300 text-emerald-900"
                  }`}
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600">
                      Depression (ΔT)
                    </span>
                    <p className="text-xl font-extrabold tabular-nums leading-tight">
                      {trough.delta !== null ? `${trough.delta.toFixed(1)}°C` : "-- °C"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-medium">
                      Target 3.5–4.8°C
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        isWarning
                          ? "text-rose-700"
                          : isSensorFault
                          ? "text-amber-800"
                          : isOffline
                          ? "text-slate-500"
                          : "text-emerald-700"
                      }`}
                    >
                      {isWarning
                        ? "Exceeds Limit"
                        : isSensorFault
                        ? "Probe Issue"
                        : isOffline
                        ? "Sensor Offline"
                        : "Within Target"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Code + Timestamp + Direct Link */}
              <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono font-medium">{trough.device_code} • {trough.last_seen_at}</span>
                <Link
                  href={`/troughs/${trough.device_code}`}
                  className="font-semibold text-[#012d1d] hover:underline flex items-center gap-1 transition-colors"
                >
                  <span>Dial Detail</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Comprehensive Summary Table */}
      <section className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mt-2">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#116c4a]" />
            <h2 className="text-[14px] font-bold text-[#012d1d]">
              Live Sensor Telemetry Log
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Updated via LoRa Gateway • 100% Signal
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
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
                const inBand = t.delta !== null && t.delta >= 3.5 && t.delta <= 4.8;
                return (
                  <tr key={t.device_code} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-700">
                      {t.device_code}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#012d1d]">
                      {t.name}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#1b4332] tabular-nums">
                      {t.temp_dry !== null ? `${t.temp_dry.toFixed(1)}°C` : "--"}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#0284c7] tabular-nums">
                      {t.temp_wet !== null ? `${t.temp_wet.toFixed(1)}°C` : "--"}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-amber-900 tabular-nums">
                      {t.delta !== null ? `${t.delta.toFixed(1)}°C` : "--"}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          t.status === "OFFLINE"
                            ? "bg-slate-100 text-slate-600"
                            : t.status === "SENSOR_FAULT"
                            ? "bg-amber-50 text-amber-800"
                            : inBand
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-rose-50 text-rose-800"
                        }`}
                      >
                        {t.status === "OFFLINE"
                          ? "Sensor Offline"
                          : t.status === "SENSOR_FAULT"
                          ? "Sensor Issue"
                          : inBand
                          ? "In Target (3.5–4.8°C)"
                          : "Exceeds Limit"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            t.status === "NORMAL"
                              ? "bg-emerald-600"
                              : t.status === "OFFLINE"
                              ? "bg-slate-400"
                              : t.status === "SENSOR_FAULT"
                              ? "bg-amber-500 animate-pulse"
                              : "bg-rose-600 animate-pulse"
                          }`}
                        />
                        <span className="font-medium text-slate-700">
                          {t.status === "NORMAL"
                            ? "Normal"
                            : t.status === "OFFLINE"
                            ? "Sensor Offline"
                            : t.status === "SENSOR_FAULT"
                            ? "Sensor Issue"
                            : "Warning (Exceeds Limit)"}
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

      {/* 4. Add Trough Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e8f5e9] text-[#116c4a] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#012d1d]">
                    Register Withering Trough
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    Connects to St. Clair Gateway GW-STCLAIR-01
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Device Hardware Code
                </label>
                <input
                  type="text"
                  value={deviceCode}
                  onChange={(e) => setDeviceCode(e.target.value)}
                  placeholder="e.g. TR-005"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[13px] focus:outline-none focus:border-[#116c4a]"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Identifier mapped in LoRa telemetry gateway packets
                </span>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Bay Name / Description
                </label>
                <input
                  type="text"
                  value={bayName}
                  onChange={(e) => setBayName(e.target.value)}
                  placeholder="e.g. Bay 05"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-[13px] focus:outline-none focus:border-[#116c4a]"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
                <Radio className="w-4 h-4 text-[#116c4a] shrink-0 mt-0.5" />
                <span>
                  Once registered, this trough will immediately appear across all factory displays and begin accepting telemetry readings from the hardware gateway.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#116c4a] text-white text-[13px] font-semibold hover:bg-[#0c4e35] shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? "Provisioning..." : "Provision Trough"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
