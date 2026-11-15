"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { mockTroughHistory } from "@/lib/mock-data";
import { TrendingUp } from "lucide-react";

interface TemperatureTrendChartProps {
  currentDryTemp: number;
  currentWetTemp: number;
}

export function TemperatureTrendChart({
  currentDryTemp,
  currentWetTemp,
}: TemperatureTrendChartProps) {
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h" | "7d">("6h");
  const data = mockTroughHistory[timeRange] || mockTroughHistory["6h"];

  return (
    <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col gap-6">
      {/* Header with Title, Legend Pills and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0B3C5D]" />
            <h2 className="text-lg font-bold text-[#0B1C30]">
              Temperature Trend
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] text-[12px] font-semibold text-[#1B4332]">
              <span className="w-2 h-2 rounded-full bg-[#1B4332]" />
              <span>Dry Temp ({currentDryTemp}°C)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[12px] font-semibold text-[#0369A1]">
              <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
              <span>Wet Temp ({currentWetTemp}°C)</span>
            </div>
          </div>
        </div>

        {/* Time Filter Buttons */}
        <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 text-[12px]">
          {(["1h", "6h", "24h", "7d"] as const).map((r) => {
            const labels = {
              "1h": "1 Hour",
              "6h": "6 Hours",
              "24h": "24 Hours",
              "7d": "7 Days",
            };
            return (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  timeRange === r
                    ? "bg-white text-[#0B3C5D] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recharts Area and Line Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="depressionAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284C7" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#116c4a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EFF4FF" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "#717973", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <YAxis
              domain={[15, 40]}
              tick={{ fill: "#717973", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit="°C"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const dry = payload.find((p) => p.dataKey === "temp_dry")?.value;
                  const wet = payload.find((p) => p.dataKey === "temp_wet")?.value;
                  const delta =
                    typeof dry === "number" && typeof wet === "number"
                      ? Math.round((dry - wet) * 10) / 10
                      : null;

                  return (
                    <div className="bg-white p-3 rounded-lg shadow-md border border-slate-200 text-[12px] flex flex-col gap-1.5">
                      <span className="font-bold text-slate-700">{label}</span>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#1B4332] font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1B4332]" />
                          Dry Bulb:
                        </span>
                        <strong className="text-slate-900">{dry}°C</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#0284C7] font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                          Wet Bulb:
                        </span>
                        <strong className="text-slate-900">{wet}°C</strong>
                      </div>
                      {delta !== null && (
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-4 text-[#d97706] font-bold">
                          <span>Depression (ΔT):</span>
                          <span>Δ {delta}°C</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Shaded Area for Depression */}
            <Area
              type="monotone"
              dataKey="temp_dry"
              stroke="none"
              fill="url(#depressionAreaGradient)"
            />
            {/* Dry Temperature Curve */}
            <Line
              type="monotone"
              dataKey="temp_dry"
              name="Dry Bulb"
              stroke="#1B4332"
              strokeWidth={3}
              dot={{ r: 3, fill: "#1B4332" }}
              activeDot={{ r: 5 }}
            />
            {/* Wet Temperature Curve */}
            <Line
              type="monotone"
              dataKey="temp_wet"
              name="Wet Bulb"
              stroke="#0284C7"
              strokeWidth={3}
              dot={{ r: 3, fill: "#0284C7" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

