"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  Bell,
  User,
  ArrowUpDown,
  LogOut,
  ShieldCheck,
  Check,
  Plus,
  MapPin,
  X,
  Radio,
  Menu,
} from "lucide-react";
import { useTelemetryRealtime } from "@/hooks/use-telemetry-realtime";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

interface HeaderProps {
  currentFactoryName?: string;
  divisionName?: string;
  onMenuToggle?: () => void;
}

export function Header({
  divisionName = "Div. No. 03 • Trough Hall B",
  onMenuToggle,
}: HeaderProps) {
  const {
    activeAlertsCount,
    isConnected,
    factories,
    currentFactory,
    switchFactory,
    createFactory,
  } = useTelemetryRealtime();

  const { profile, role, isAdmin, logout, switchDemoRole } = useAuth();

  const [factoryMenuOpen, setFactoryMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false);

  // New Factory Modal State
  const [newFactoryName, setNewFactoryName] = useState("");
  const [newFactoryCode, setNewFactoryCode] = useState("");
  const [newFactoryLocation, setNewFactoryLocation] = useState("Nuwara Eliya, Elevation 1,890m");
  const [newGatewaySerial, setNewGatewaySerial] = useState("");
  const [initialTroughCount, setInitialTroughCount] = useState(4);
  const [isSubmittingFactory, setIsSubmittingFactory] = useState(false);

  const factoryMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (factoryMenuRef.current && !factoryMenuRef.current.contains(e.target as Node)) {
        setFactoryMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenAddFactory = () => {
    setFactoryMenuOpen(false);
    setIsAddFactoryOpen(true);
  };

  const handleCreateFactorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactoryName.trim() || !newFactoryCode.trim()) {
      toast.error("Please fill in Factory Name and Code.");
      return;
    }

    setIsSubmittingFactory(true);
    const res = await createFactory({
      name: newFactoryName.trim(),
      code: newFactoryCode.trim().toUpperCase(),
      location: newFactoryLocation.trim(),
      gateway_serial: newGatewaySerial.trim() || undefined,
      trough_count: initialTroughCount,
    });
    setIsSubmittingFactory(false);

    if (res.success) {
      toast.success(`Factory ${newFactoryName} registered with ${initialTroughCount} troughs.`);
      setIsAddFactoryOpen(false);
      setNewFactoryName("");
      setNewFactoryCode("");
      setNewGatewaySerial("");
    } else {
      toast.error(res.error || "Failed to create factory");
    }
  };

  const roleLabel =
    role === "admin"
      ? "Estate Admin"
      : role === "manager"
      ? "Factory Manager"
      : "Quality Viewer";

  return (
    <header
      className="fixed top-0 left-0 lg:left-64 right-0 h-16 z-40 px-3 sm:px-6 lg:px-8 flex items-center justify-between backdrop-blur-md"
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        borderBottom: "2px solid #0284c7",
        boxShadow: "0 2px 12px rgba(11, 60, 93, 0.05)",
      }}
    >
      {/* Left: Dynamic Multi-Factory Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {onMenuToggle && (
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuToggle}
            className="lg:hidden shrink-0 p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {isAdmin ? (
          /* Admin can see all factories and switch */
          <div className="relative" ref={factoryMenuRef}>
            <button
              type="button"
              onClick={() => setFactoryMenuOpen(!factoryMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#0b3c5d] font-semibold text-[13px] transition-colors hover:bg-blue-100/60 cursor-pointer"
              style={{
                background: "rgb(240, 247, 255)",
                border: "1px solid rgb(191, 219, 254)",
              }}
            >
              <Building2 className="w-4 h-4 text-[#1e40af]" />
                <span className="max-w-28 truncate sm:max-w-none">{currentFactory?.name || "St. Clair Tea Estate"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Factory Selector Dropdown */}
            {factoryMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-[12px]">
                <div className="px-4 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Estate Factory
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {factories.length} Registered
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-50">
                  {factories.map((f) => {
                    const isSelected = f.id === currentFactory?.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          switchFactory(f.id);
                          setFactoryMenuOpen(false);
                          toast.info(`Switched active factory to ${f.name}`);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span
                            className={`font-bold text-[13px] truncate ${
                              isSelected ? "text-[#0284c7]" : "text-[#012d1d]"
                            }`}
                          >
                            {f.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {f.code} • {f.location || "Central Highlands"}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#0284c7] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Admin "Factory Management" Direct Link */}
                <div className="pt-1.5 border-t border-slate-100 px-2">
                  <Link
                    href="/factories"
                    onClick={() => setFactoryMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#116c4a] font-bold text-[12px] transition-colors cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Manage &amp; Register Factories →</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Managers and Viewers are strictly locked to their assigned factory */
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#0b3c5d] font-semibold text-[13px] select-none"
            style={{
              background: "rgb(248, 250, 252)",
              border: "1px solid rgb(226, 232, 240)",
            }}
            title="Assigned Factory (Managers and Viewers cannot switch factories)"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="max-w-28 truncate sm:max-w-none">{currentFactory?.name || profile?.factory_name || "St. Clair Tea Estate"}</span>
            <span className="hidden sm:inline text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded ml-1">
              Assigned
            </span>
          </div>
        )}

        <span className="hidden lg:inline text-[12px] text-slate-500 font-medium truncate max-w-44">
          {currentFactory?.location || divisionName}
        </span>
      </div>

      {/* Right: Live Telemetry, Notifications & User Info */}
      <div className="flex items-center gap-1 sm:gap-3 lg:gap-4 shrink-0">
        {/* Live Telemetry Pill */}
        <div
          className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-semibold ${
            isConnected ? "bg-[#e0f2fe] text-[#0369a1]" : "bg-amber-50 text-amber-800"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-[#0284c7] animate-pulse" : "bg-amber-600"
            }`}
          />
          <span>{isConnected ? "Live Telemetry" : "Reconnecting"}</span>
        </div>

        {/* Notifications Icon with Dynamic Badge */}
        <Link
          href="/alerts"
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title={`${activeAlertsCount} active alert(s)`}
        >
          <Bell className="w-5 h-5" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#dc2626] text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-xs">
              {activeAlertsCount}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile & Role Popover */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 pl-1 text-left cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[13px] font-bold text-[#0b1c30]">
                {profile?.full_name || "Factory User"}
              </span>
              <span className="text-[11px] text-slate-500 font-medium capitalize">
                {roleLabel}
              </span>
            </div>
            <div
              className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-[12px] shadow-sm ${
                role === "admin"
                  ? "bg-[#012d1d]"
                  : role === "manager"
                  ? "bg-[#116c4a]"
                  : "bg-[#0284c7]"
              }`}
            >
              <User className="w-4 h-4 text-white" />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Popover Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-[12px]">
              {/* Profile Details */}
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-bold text-[#012d1d] text-[13px] truncate">
                  {profile?.full_name}
                </p>
                <p className="text-slate-400 text-[11px] truncate">
                  {profile?.email}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  <ShieldCheck className="w-3 h-3 text-[#116c4a]" />
                  <span>Role: {role}</span>
                </div>
              </div>

              {/* Quick Role Switcher */}
              <div className="px-4 py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Test Role Switcher
                </span>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole("admin");
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700 text-left cursor-pointer"
                  >
                    <span>🛡️ Estate Admin</span>
                    {role === "admin" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole("manager");
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700 text-left cursor-pointer"
                  >
                    <span>🏭 Factory Manager</span>
                    {role === "manager" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole("viewer");
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-50 text-slate-700 text-left cursor-pointer"
                  >
                    <span>👁️ Quality Viewer</span>
                    {role === "viewer" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                </div>
              </div>

              {/* Logout Option */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 font-semibold cursor-pointer text-left transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
