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
  ReferenceLine,
} from "recharts";
import { mockDryerHistory } from "@/lib/mock-data";
import { TrendingUp } from "lucide-react";

interface DryerTrendChartProps {
  currentTemp: number;
  targetTemp: number;
}

export function DryerTrendChart({
  currentTemp,
  targetTemp,
}: DryerTrendChartProps) {
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h">("6h");
  const data = mockDryerHistory[timeRange] || mockDryerHistory["6h"];

  return (
    <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0B3C5D]" />
            <h2 className="text-lg font-bold text-[#012d1d]">
              Heating Bay Temperature Trend
            </h2>
          </div>
          <p className="text-[12px] text-slate-500">
            Continuous flue-gas heat exchanger supply stream telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[12px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] font-semibold text-[#1B4332]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#116C4A]" />
            <span>Supply Air Temp ({currentTemp}°C)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] font-semibold text-[#0369A1]">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#0284C7]" />
            <span>Target ({targetTemp}°C)</span>
          </div>

          <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 text-[12px]">
            {(["1h", "6h", "24h"] as const).map((r) => {
              const labels = {
                "1h": "1 Hour",
                "6h": "6 Hours",
                "24h": "24 Hours",
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
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="dryerAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#116C4A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.02} />
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
              domain={[60, 100]}
              tick={{ fill: "#717973", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit="°C"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const temp = payload.find((p) => p.dataKey === "temperature")?.value;
                  const variance =
                    typeof temp === "number"
                      ? Math.round((temp - targetTemp) * 10) / 10
                      : null;

                  return (
                    <div className="bg-white p-3 rounded-lg shadow-md border border-slate-200 text-[12px] flex flex-col gap-1.5">
                      <span className="font-bold text-slate-700">{label}</span>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#116C4A] font-semibold">
                          Supply Temperature:
                        </span>
                        <strong className="text-slate-900">{temp}°C</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#0369A1] font-semibold">
                          Target Setpoint:
                        </span>
                        <strong className="text-slate-900">{targetTemp}°C</strong>
                      </div>
                      {variance !== null && (
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-4 text-slate-600 font-medium">
                          <span>Variance:</span>
                          <span
                            className={
                              Math.abs(variance) > 5 ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"
                            }
                          >
                            {variance > 0 ? `+${variance}` : variance}°C
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Target Setpoint dashed reference line */}
            <ReferenceLine
              y={targetTemp}
              stroke="#0284C7"
              strokeDasharray="6 4"
              strokeWidth={1.75}
              label={{
                value: `Target ${targetTemp}°C`,
                fill: "#0369A1",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            {/* Shaded Area under Temperature */}
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="none"
              fill="url(#dryerAreaGradient)"
            />
            {/* Supply Temperature line */}
            <Line
              type="monotone"
              dataKey="temperature"
              name="Supply Temp"
              stroke="#116C4A"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#116C4A" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

