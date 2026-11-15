"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  ArrowLeft,
  ShieldCheck,
  Radio,
  Check,
  Trash2,
  Layers,
  MapPin,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useTelemetryRealtime } from "@/hooks/use-telemetry-realtime";
import { toast } from "sonner";

export default function FactoryManagementPage() {
  const { isAdmin, role } = useAuth();
  const {
    factories,
    currentFactory,
    switchFactory,
    createFactory,
    refreshTelemetry,
  } = useTelemetryRealtime();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("Nuwara Eliya, Elevation 1,890m");
  const [gatewaySerial, setGatewaySerial] = useState("");
  const [troughCount, setTroughCount] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auto suggest unique code
  const handleOpenModal = () => {
    setName("");
    setCode("");
    setGatewaySerial("");
    setTroughCount(4);
    setIsModalOpen(true);
  };

  const handleCreateFactory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error("Factory Name and Code are required.");
      return;
    }

    setIsSubmitting(true);
    const res = await createFactory({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      location: location.trim(),
      gateway_serial: gatewaySerial.trim() || undefined,
      trough_count: troughCount,
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Factory ${name} registered successfully with ${troughCount} troughs.`);
      setIsModalOpen(false);
      setName("");
      setCode("");
      setGatewaySerial("");
    } else {
      toast.error(res.error || "Failed to register factory");
    }
  };

  const handleDeleteFactory = async (factoryId: string, factoryName: string) => {
    if (factoryId === "22222222-2222-2222-2222-222222222222") {
      toast.error("Cannot delete the central baseline estate (St. Clair).");
      return;
    }

    if (!window.confirm(`Are you sure you want to decommission ${factoryName}? This will remove associated devices and telemetry.`)) {
      return;
    }

    setDeletingId(factoryId);
    try {
      const res = await fetch(`/api/factories?id=${encodeURIComponent(factoryId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete factory");
      } else {
        toast.success(`${factoryName} removed successfully.`);
        if (currentFactory.id === factoryId) {
          switchFactory("22222222-2222-2222-2222-222222222222");
        }
        await refreshTelemetry();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete factory");
    } finally {
      setDeletingId(null);
    }
  };

  // Strictly Admin-Only Guard
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
            Multi-factory registration, gateway provisioning, and estate tenant configuration are restricted strictly to Estate Administrators. You are currently signed in as a <span className="font-bold capitalize text-slate-700">{role}</span>.
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
    <div className="max-w-6xl mx-auto w-full pb-16 flex flex-col gap-6 py-4">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#012d1d] text-[13px] font-semibold transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
              Multi-Estate Infrastructure
            </span>
            <span className="text-[12px] text-slate-400">Organization: Kelani Valley Plantations PLC</span>
          </div>
          <h1 className="text-3xl font-bold text-[#012d1d] tracking-tight mt-1">
            Factory Management
          </h1>
          <p className="text-[14px] text-slate-500">
            Provision and supervise independent estate factories, LoRa edge gateways, and dedicated sensor arrays.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="px-4 py-2.5 rounded-lg bg-[#116c4a] text-white hover:bg-[#0c4e35] text-[13px] font-bold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Factory</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Registered Estates
            </span>
            <p className="text-3xl font-bold text-[#012d1d] mt-1 tabular-nums">
              {factories.length}
            </p>
            <span className="text-[12px] text-slate-400">Independent Telemetry Nodes</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Monitoring View
            </span>
            <p className="text-xl font-bold text-[#116c4a] mt-1 truncate max-w-[200px]">
              {currentFactory.name}
            </p>
            <span className="text-[12px] text-slate-400 font-mono">{currentFactory.code}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#116c4a] flex items-center justify-center font-bold">
            <Check className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Hierarchy Schema
            </span>
            <p className="text-base font-bold text-[#0b1c30] mt-1">
              Org → Factory → Gateway
            </p>
            <span className="text-[12px] text-slate-400">No factory floors</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Factories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
        {factories.map((factory) => {
          const isActive = factory.id === currentFactory.id;

          return (
            <div
              key={factory.id}
              className={`bg-white rounded-2xl p-6 shadow-xs border transition-all flex flex-col justify-between ${
                isActive
                  ? "border-[#0284c7] ring-2 ring-[#0284c7]/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
                        isActive
                          ? "bg-[#e0f2fe] text-[#0284c7]"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#012d1d]">
                        {factory.name}
                      </h3>
                      <span className="text-[12px] text-slate-400 font-mono">
                        Code: {factory.code}
                      </span>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0284c7] border border-blue-200 text-[11px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] animate-pulse" />
                      Active View
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      Standby
                    </span>
                  )}
                </div>

                <div className="space-y-2 py-3 border-y border-slate-100 text-[12px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{factory.location || "Central Highlands, Sri Lanka"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Gateway Serial: <strong className="font-mono text-slate-700">GW-{factory.code}-01</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-4 flex items-center justify-between gap-2">
                {isActive ? (
                  <span className="text-[12px] font-bold text-[#116c4a] flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Currently Monitoring
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      switchFactory(factory.id);
                      toast.success(`Switched active factory to ${factory.name}`);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#0284c7] text-white text-[12px] font-bold hover:bg-[#0369a1] transition-colors cursor-pointer"
                  >
                    Switch to this Estate
                  </button>
                )}

                {factory.id !== "22222222-2222-2222-2222-222222222222" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteFactory(factory.id, factory.name)}
                    disabled={deletingId === factory.id}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Decommission factory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spacious Modal: Register New Factory */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl max-w-lg w-full border border-slate-200 my-8">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#012d1d]">
                    Register Estate Factory
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    Provisions estate, primary LoRa gateway, and sensor bays
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFactory} className="space-y-4 text-left">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  Estate Factory Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dimbula Valley Estate"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">
                    Factory Code *
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. DIM-01"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-[13px] uppercase focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Unique estate code</span>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">
                    Initial Withering Bays
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={troughCount}
                    onChange={(e) => setTroughCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Troughs 01 through {troughCount < 10 ? `0${troughCount}` : troughCount}</span>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  Region &amp; Elevation
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Dimbula District, Elevation 1,650m"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  Master LoRa Gateway Serial (Optional)
                </label>
                <input
                  type="text"
                  value={gatewaySerial}
                  onChange={(e) => setGatewaySerial(e.target.value)}
                  placeholder={code ? `Auto: GW-${code.toUpperCase()}-01` : "Auto-generated if empty"}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7]"
                />
              </div>

              <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-[12px] text-blue-900 flex items-start gap-2.5">
                <Radio className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                <p>
                  Provisioning automatically creates the estate factory, its primary LoRa hardware gateway, {troughCount} withering troughs, and 1 biomass heating bay with baseline live telemetry in Supabase.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg bg-[#0284c7] text-white text-[13px] font-bold hover:bg-[#0369a1] shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Provision Estate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
