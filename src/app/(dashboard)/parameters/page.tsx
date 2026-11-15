"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  Droplets,
  Thermometer,
  Fan,
  RotateCcw,
  Check,
  X,
  Plus,
  Minus,
  Radio,
  AlertCircle,
} from "lucide-react";
import { mockParameters } from "@/lib/mock-data";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export default function SystemParametersPage() {
  const { isAdmin, role } = useAuth();
  const [minDepression, setMinDepression] = useState(mockParameters.min_depression);
  const [maxDepression, setMaxDepression] = useState(mockParameters.max_depression);
  const [dryMin, setDryMin] = useState(mockParameters.ambient_dry_min);
  const [dryMax, setDryMax] = useState(mockParameters.ambient_dry_max);
  const [wetMin, setWetMin] = useState(mockParameters.ambient_wet_min);
  const [wetMax, setWetMax] = useState(mockParameters.ambient_wet_max);
  const [furnaceMin, setFurnaceMin] = useState(mockParameters.dryer_temp_min);
  const [furnaceMax, setFurnaceMax] = useState(mockParameters.dryer_temp_max);

  const [saving, setSaving] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<"saved" | "pending" | "applied">("applied");
  const [showToast, setShowToast] = useState(true);

  const handleStep = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number
  ) => {
    setter((prev) => Math.round((prev + delta) * 10) / 10);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Administrator privileges required to update parameters.");
      return;
    }
    setSaving(true);
    setDeliveryStatus("pending");

    setTimeout(() => {
      setSaving(false);
      setDeliveryStatus("applied");
      setShowToast(true);
      toast.success(
        "Threshold changes saved! Configuration version updated and applied by Gateway GW-COL-04."
      );
    }, 1200);
  };

  const handleReset = () => {
    if (!isAdmin) return;
    setMinDepression(mockParameters.min_depression);
    setMaxDepression(mockParameters.max_depression);
    setDryMin(mockParameters.ambient_dry_min);
    setDryMax(mockParameters.ambient_dry_max);
    setWetMin(mockParameters.ambient_wet_min);
    setWetMax(mockParameters.ambient_wet_max);
    setFurnaceMin(mockParameters.dryer_temp_min);
    setFurnaceMax(mockParameters.dryer_temp_max);
    toast.info("Parameters reset to factory baseline defaults.");
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-6 py-12 max-w-2xl mx-auto items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#012d1d]">
            Estate Administrator Privileges Required
          </h1>
          <p className="text-[14px] text-slate-500 max-w-md mx-auto">
            Operating envelope threshold tuning and gateway sensor setpoint configurations are restricted strictly to Estate Administrators. You are currently signed in as a <span className="font-bold capitalize text-slate-700">{role}</span>.
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

  return (
    <div className="max-w-5xl mx-auto w-full pb-16 flex flex-col gap-6 py-4">
      {/* Top Breadcrumb & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#012d1d] text-[13px] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2.5 text-[12px]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0b3c5d] font-semibold border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0284c7]" />
            Admin Configuration • {mockParameters.version}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#116c4a] font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            {deliveryStatus === "applied" ? "Mesh Synced" : "Pending Gateway Sync"}
          </span>
        </div>
      </div>

      {/* Main Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-2 gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#012d1d] tracking-tight">
            System Parameters
          </h1>
          <p className="text-[14px] text-slate-500 max-w-2xl">
            Configure operational alarm envelopes and target baseline thresholds across withering bays and the biomass heating unit.
          </p>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-[12px] bg-slate-100 px-3 py-1.5 rounded-lg self-start md:self-auto">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>
            Last updated: <strong className="text-[#0b1c30]">{mockParameters.last_updated_at}</strong> by {mockParameters.last_updated_by}
          </span>
        </div>
      </div>

      {/* Inline Toast Banner */}
      {showToast && (
        <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 shadow-xs flex items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#116c4a] flex items-center justify-center text-white shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-[#065f46] font-medium">
              Operational parameters active. Thresholds synced to withering bay sensor nodes and estate gateway.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="text-[#065f46]/70 hover:text-[#065f46] p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Parameters Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: Wet-Bulb Depression Thresholds */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center">
                  <Droplets className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-[#0B3C5D]">
                  Wet-Bulb Depression Thresholds
                </h2>
              </div>
              <p className="text-[13px] text-slate-500 mt-1">
                Defines permissible evaporation differential (ΔT = Dry-Bulb − Wet-Bulb). Readings outside trigger alerts.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-50 text-[#166534] border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              Baseline: {minDepression.toFixed(1)}°C – {maxDepression.toFixed(1)}°C
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Min Depression */}
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-[13px] font-bold text-[#0b1c30]">
                  Minimum Acceptable Depression
                </label>
                <p className="text-[11px] text-slate-400">
                  Lower values indicate insufficient evaporation / souring risk.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleStep(setMinDepression, -0.1)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-full text-center text-xl font-bold tabular-nums text-[#0b1c30]">
                  {minDepression.toFixed(1)}
                </span>
                <span className="px-2 text-[13px] font-bold text-slate-400">°C</span>
                <button
                  type="button"
                  onClick={() => handleStep(setMinDepression, 0.1)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Max Depression */}
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-[13px] font-bold text-[#0b1c30]">
                  Maximum Acceptable Depression
                </label>
                <p className="text-[11px] text-slate-400">
                  Higher values indicate excessive evaporation / case hardening risk.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleStep(setMaxDepression, -0.1)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-full text-center text-xl font-bold tabular-nums text-[#0b1c30]">
                  {maxDepression.toFixed(1)}
                </span>
                <span className="px-2 text-[13px] font-bold text-slate-400">°C</span>
                <button
                  type="button"
                  onClick={() => handleStep(setMaxDepression, 0.1)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Ambient Temperature Limits */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1e40af] flex items-center justify-center">
                <Thermometer className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#0B3C5D]">
                Ambient Temperature Limits
              </h2>
            </div>
            <span className="text-[12px] text-[#0284c7] bg-sky-50 px-2.5 py-0.5 rounded-full font-semibold border border-sky-100">
              Trough Hall Telemetry
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Dry-Bulb Min */}
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-[13px] font-bold text-[#0b1c30]">
                  Dry-Bulb Minimum Temperature
                </label>
                <p className="text-[11px] text-slate-400">
                  Cold weather lower warning threshold
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleStep(setDryMin, -0.5)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-full text-center text-xl font-bold tabular-nums text-[#0b1c30]">
                  {dryMin.toFixed(1)}
                </span>
                <span className="px-2 text-[13px] font-bold text-slate-400">°C</span>
                <button
                  type="button"
                  onClick={() => handleStep(setDryMin, 0.5)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dry-Bulb Max */}
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-[13px] font-bold text-[#0b1c30]">
                  Dry-Bulb Maximum Temperature
                </label>
                <p className="text-[11px] text-slate-400">
                  Excess heat threshold (prevents leaf scorching)
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleStep(setDryMax, -0.5)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-full text-center text-xl font-bold tabular-nums text-[#0b1c30]">
                  {dryMax.toFixed(1)}
                </span>
                <span className="px-2 text-[13px] font-bold text-slate-400">°C</span>
                <button
                  type="button"
                  onClick={() => handleStep(setDryMax, 0.5)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Heating Bay Thresholds */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#10b981] flex items-center justify-center">
                <Fan className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#0B3C5D]">
                Heating Bay Thresholds
              </h2>
            </div>
            <span className="text-[12px] text-[#c2410c] bg-orange-50 px-2.5 py-0.5 rounded-full font-semibold border border-orange-100">
              Target Baseline: 85.0°C
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Min Supply */}
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-[13px] font-bold text-[#0b1c30]">
                  Minimum Supply Temperature
                </label>
                <p className="text-[11px] text-slate-400">
                  Draft air below this setpoint fails to accelerate withering.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleStep(setFurnaceMin, -1.0)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-full text-center text-xl font-bold tabular-nums text-[#0b1c30]">
                  {furnaceMin.toFixed(1)}
                </span>
                <span className="px-2 text-[13px] font-bold text-slate-400">°C</span>
                <button
                  type="button"
                  onClick={() => handleStep(setFurnaceMin, 1.0)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Max Supply */}
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-[13px] font-bold text-[#0b1c30]">
                  Maximum Supply Temperature
                </label>
                <p className="text-[11px] text-slate-400">
                  Air supply above 90°C risks thermal leaf damage.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleStep(setFurnaceMax, -1.0)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-full text-center text-xl font-bold tabular-nums text-[#0b1c30]">
                  {furnaceMax.toFixed(1)}
                </span>
                <span className="px-2 text-[13px] font-bold text-slate-400">°C</span>
                <button
                  type="button"
                  onClick={() => handleStep(setFurnaceMax, 1.0)}
                  className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-[13px] font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-[13px] font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#1b4332] to-[#116c4a] text-white text-[13px] font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-80"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
