import Link from "next/link";
import {
  ArrowLeft,
  Thermometer,
  ShieldCheck,
  Radio,
  Sliders,
  BatteryCharging,
  CheckCircle2,
} from "lucide-react";
import { mockDryer } from "@/lib/mock-data";
import { DryerTrendChart } from "@/components/charts/dryer-trend-chart";

export default async function DryerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dryer = mockDryer;
  const tempVal = dryer.temperature ?? 85.0;
  const variance = Math.round((tempVal - dryer.target_temperature) * 10) / 10;

  // Exact math for 0-300°C dial needle
  // Arc: -120° (0°C) to +120° (300°C), 150°C at 0° (top)
  const cx = 120;
  const cy = 125;
  const percentage = Math.min(Math.max(tempVal / 300, 0), 1);
  const angleDeg = -120 + percentage * 240;
  const angleRad = (angleDeg * Math.PI) / 180;

  const rTip = 72;
  const rTail = 14;
  const baseWidth = 4.5;

  const tipX = cx + rTip * Math.sin(angleRad);
  const tipY = cy - rTip * Math.cos(angleRad);
  const tailX = cx - rTail * Math.sin(angleRad);
  const tailY = cy + rTail * Math.cos(angleRad);
  const leftX = cx + baseWidth * Math.cos(angleRad);
  const leftY = cy + baseWidth * Math.sin(angleRad);
  const rightX = cx - baseWidth * Math.cos(angleRad);
  const rightY = cy - baseWidth * Math.sin(angleRad);

  return (
    <div className="max-w-7xl mx-auto w-full pb-12 flex flex-col gap-5 py-3">
      {/* 1. Top Page Header & Status Bar */}
      <header className="flex flex-col gap-2">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#012d1d] transition-colors text-[13px] font-semibold group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#012d1d] tracking-tight">
              {dryer.name} Monitoring
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>{dryer.status}</span>
              <span className="text-slate-400">•</span>
              <span>Target {dryer.target_temperature}°C</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white shadow-xs border border-slate-200 self-start sm:self-auto text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
            <span className="text-[#0b1c30] font-semibold">
              Updated {dryer.last_seen_at}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Biomass Feeder Connected</span>
          </div>
        </div>
      </header>

      {/* 2. KPI Section: Compact 3-Card Row (5 + 4 + 3 = 12 cols, zero blank voids) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Analog Temperature Dial (0°C to 300°C) */}
        <section className="lg:col-span-5 bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-[15px] font-bold text-[#012d1d]">
                Current Supply Temperature
              </h2>
              <p className="text-[11px] text-slate-500">
                Primary Biomass Furnace • Heat Exchanger 01 ({id || dryer.device_code})
              </p>
            </div>
            <span className="p-1.5 rounded-lg text-[#0284c7] bg-[#e0f2fe]">
              <Thermometer className="w-4 h-4" />
            </span>
          </div>

          {/* SVG Dial Gauge (0 to 300°C) */}
          <div className="flex flex-col items-center justify-center my-1">
            <div className="relative w-60 h-40 flex items-center justify-center">
              <svg
                viewBox="0 0 240 160"
                className="w-full h-full overflow-visible"
                aria-label="Analog temperature dial gauge reading 84.5 degrees Celsius out of 300"
              >
                {/* Track Arc */}
                <path
                  d="M 42.06 170 A 90 90 0 1 1 197.94 170"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="11"
                  strokeLinecap="round"
                />
                {/* Target Zone Arc (80°C to 90°C) */}
                <path
                  d="M 54 84 A 90 90 0 0 1 63 71"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="11"
                  strokeLinecap="round"
                />

                {/* Scale Labels & Major Ticks */}
                <line x1="42" y1="170" x2="50" y2="165" stroke="#0B3C5D" strokeWidth="2" />
                <text x="34" y="180" fontSize="10" fontWeight="600" fill="#0B3C5D" textAnchor="middle">0°C</text>

                <line x1="62" y1="56" x2="68" y2="63" stroke="#0284C7" strokeWidth="2" />
                <text x="54" y="47" fontSize="9" fontWeight="600" fill="#0284C7" textAnchor="middle">100</text>

                <line x1="120" y1="35" x2="120" y2="44" stroke="#1B4332" strokeWidth="2" />
                <text x="120" y="27" fontSize="10" fontWeight="600" fill="#1B4332" textAnchor="middle">150°C</text>

                <line x1="178" y1="56" x2="172" y2="63" stroke="#717973" strokeWidth="1.5" />
                <text x="186" y="47" fontSize="9" fill="#717973" textAnchor="middle">200</text>

                <line x1="198" y1="170" x2="190" y2="165" stroke="#717973" strokeWidth="2" />
                <text x="206" y="180" fontSize="10" fill="#717973" textAnchor="middle">300°C</text>

                {/* Needle Pointer with calculated geometry */}
                <g>
                  <polygon
                    points={`${leftX.toFixed(2)},${leftY.toFixed(2)} ${tipX.toFixed(2)},${tipY.toFixed(2)} ${rightX.toFixed(2)},${rightY.toFixed(2)} ${tailX.toFixed(2)},${tailY.toFixed(2)}`}
                    fill="#1B4332"
                    stroke="#1B4332"
                    strokeWidth="1"
                  />
                  <circle cx={cx} cy={cy} r="6.5" fill="#0B3C5D" />
                  <circle cx={cx} cy={cy} r="2.5" fill="#FFFFFF" />
                </g>
              </svg>
            </div>

            <div className="text-center -mt-2">
              <div className="inline-flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#1b4332] tabular-nums tracking-tight">
                  {dryer.temperature !== null ? dryer.temperature.toFixed(1) : "--"}
                </span>
                <span className="text-lg font-bold text-[#0284c7]">°C</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#116c4a]" />
                Supply Air Baseline • <span className="text-[#0369a1] font-semibold">Stable</span>
              </p>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-slate-600 text-[11px]">
            <span>
              Operating Setpoint:{" "}
              <strong className="text-[#0b1c30]">
                {dryer.target_temperature}°C
              </strong>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
              In Envelope
            </span>
          </div>
        </section>

        {/* Card 2: Operating Status & Target Band (4 cols) */}
        <section className="lg:col-span-4 bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-[#012d1d]">
                Temperature Status
              </h2>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[#116c4a] bg-[#d1fae5]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-bold text-[#012d1d] tracking-tight">
                Normal Operation
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                Optimal
              </span>
            </div>

            <div className="flex flex-col gap-2 mb-3 text-[12px]">
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Current Reading</span>
                <span className="font-bold text-[#1b4332]">
                  {dryer.temperature !== null ? `${dryer.temperature.toFixed(1)}°C` : "-- °C"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Configured Setpoint</span>
                <span className="font-semibold text-[#0B3C5D]">{dryer.target_temperature.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-sky-50 border border-sky-100">
                <span className="text-[#0369a1]">Variance</span>
                <span className="font-bold text-[#116c4a]">
                  {variance > 0 ? `+${variance}` : variance}°C (Within ±5.0°C)
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-[11px]">
                <span className="text-slate-500 font-medium">
                  Permissible Band (80.0°C – 90.0°C)
                </span>
                <span className="font-semibold text-[#0284c7]">Mid-Band</span>
              </div>
              <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="absolute left-[20%] right-[20%] h-full rounded-full bg-emerald-300" />
                <div className="absolute left-[45%] top-0 bottom-0 w-2 rounded-full bg-[#1b4332] shadow-sm -translate-x-1/2" />
              </div>
              <div className="flex justify-between text-slate-400 text-[10px] mt-1">
                <span>80.0°C Min</span>
                <span className="text-[#0B3C5D] font-medium">Target 85.0°C</span>
                <span>90.0°C Max</span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 text-slate-500 text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#116c4a] shrink-0" />
            <span>Furnace draft supplying stable hot air.</span>
          </div>
        </section>

        {/* Card 3: Connection & Telemetry (3 cols - fills row cleanly!) */}
        <section className="lg:col-span-3 bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-[#012d1d]">
                Connection
              </h2>
              <span className="p-1.5 rounded-lg text-[#0284c7] bg-[#e0f2fe]">
                <Radio className="w-4 h-4" />
              </span>
            </div>

            <div className="flex flex-col gap-2.5 mb-3 text-[12px]">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-semibold">
                  Device Status
                </span>
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded bg-sky-50 border border-sky-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] animate-pulse" />
                    <span className="font-semibold text-[#0B3C5D]">Online</span>
                  </div>
                  <span className="text-[10px] text-slate-500">12ms ping</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-semibold">
                  Sensor Health
                </span>
                <span className="font-medium text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#116c4a]" />
                  Optimal ({dryer.sensor_code || "Pt100 RTD"})
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-semibold">
                  Transmission Mode
                </span>
                <span className="text-[11px] text-[#0284c7] font-semibold">
                  LoRa Industrial Mesh
                </span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#0B3C5D] font-bold">
                Duplex Exchanger Node
              </span>
              <span className="text-[10px] text-[#116c4a] font-medium">
                Battery 99.8% • Solar
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#0284c7]/10 flex items-center justify-center text-[#0284c7]">
              <BatteryCharging className="w-3.5 h-3.5" />
            </div>
          </div>
        </section>
      </div>

      {/* 3. Recharts Temperature History Graph (Immediately below top row) */}
      <DryerTrendChart
        currentTemp={dryer.temperature}
        targetTemp={dryer.target_temperature}
      />

      {/* 4. Compact Bottom Information Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#0B3C5D] bg-sky-50 shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Operating Parameter
            </span>
            <span className="text-[12px] text-[#0b1c30] font-semibold">
              Dryer Supply Baseline: 80.0°C – 90.0°C
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#116c4a] bg-emerald-50 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Safety Verification
            </span>
            <span className="text-[12px] text-[#116c4a] font-semibold">
              No Over-temperature Deviations Logged
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
