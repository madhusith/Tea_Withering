"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Fan,
  Bell,
  Users,
  Sliders,
  FileText,
  Radio,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useTelemetryRealtime } from "@/context/telemetry-context";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeVariant?: "error" | "default";
}

export function Sidebar() {
  const pathname = usePathname();
  const { activeAlertsCount } = useTelemetryRealtime();

  const operationsNav: NavItem[] = [
    {
      label: "Dashboard (Overview)",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Factory Monitoring",
      href: "/factory",
      icon: Factory,
    },
    {
      label: "Heating Bay",
      href: "/dryers/DR-001",
      icon: Fan,
    },
    {
      label: "Alerts & Notifications",
      href: "/alerts",
      icon: Bell,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeVariant: "error",
    },
  ];

  const systemConfigNav: NavItem[] = [
    {
      label: "User Management",
      href: "/users",
      icon: Users,
    },
    {
      label: "Parameters",
      href: "/parameters",
      icon: Sliders,
    },
    {
      label: "Reports",
      href: "/reports",
      icon: FileText,
    },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-50 flex flex-col justify-between pt-5 pb-6 text-white"
      style={{
        background: "linear-gradient(180deg, rgb(16, 42, 30) 0%, rgb(13, 35, 25) 100%)",
        borderRight: "1px solid rgba(2, 132, 199, 0.15)",
      }}
    >
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="px-6 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
            style={{
              background: "linear-gradient(135deg, rgb(2, 132, 199) 0%, rgb(30, 64, 175) 100%)",
            }}
          >
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold tracking-tight text-white">Ceylon IoT</span>
            <span className="text-[11px] font-medium text-emerald-200/80">Withering Telemetry</span>
          </div>
        </div>

        {/* Navigation Group: Operations */}
        <div className="px-4">
          <div className="px-2 pb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6ee7b7]">
              Operations
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {operationsNav.map((item, index) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard" || pathname === "/"
                  : item.href === "/factory"
                  ? pathname.startsWith("/factory") || pathname.startsWith("/troughs")
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={`${item.href}-${index}`}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                    isActive
                      ? "text-white font-semibold shadow-md"
                      : "text-emerald-100/75 hover:bg-white/5 hover:text-white"
                  )}
                  style={
                    isActive
                      ? {
                          background:
                            "linear-gradient(135deg, rgb(27, 67, 50) 0%, rgb(3, 105, 161) 100%)",
                          borderLeft: "3px solid rgb(56, 189, 248)",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        isActive ? "text-[#7dd3fc]" : "text-emerald-300/80"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Navigation Group: System Config */}
        <div className="px-4">
          <div className="px-2 pb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6ee7b7]">
              System Config
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {systemConfigNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                    isActive
                      ? "text-white font-semibold shadow-md"
                      : "text-emerald-100/75 hover:bg-white/5 hover:text-white"
                  )}
                  style={
                    isActive
                      ? {
                          background:
                            "linear-gradient(135deg, rgb(27, 67, 50) 0%, rgb(3, 105, 161) 100%)",
                          borderLeft: "3px solid rgb(56, 189, 248)",
                        }
                      : undefined
                  }
                >
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-[#7dd3fc]" : "text-emerald-300/80"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Gateway Node Status Pill */}
      <div className="px-4">
        <div
          className="p-3 rounded-lg flex items-center justify-between"
          style={{
            background: "rgba(2, 132, 199, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
          }}
        >
          <div className="flex flex-col">
            <span className="text-[12px] text-white font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
              Gateway Node
            </span>
            <span className="text-[11px] text-[#7dd3fc] font-medium">Online • 99.8% SLA</span>
          </div>
          <Radio className="w-4 h-4 text-[#38bdf8]" />
        </div>
      </div>
    </aside>
  );
}

