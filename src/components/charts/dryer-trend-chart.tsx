"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { TrendingUp, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DryerTrendChartProps {
  deviceId?: string;
  currentTemp: number | null;
  targetTemp: number;
}

interface DryerPoint {
  time: string;
  temperature: number | null;
}

export function DryerTrendChart({
  deviceId,
  currentTemp,
  targetTemp,
}: DryerTrendChartProps) {
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h">("6h");
  const [historyData, setHistoryData] = useState<DryerPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const formatTimestamp = useCallback((dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return dateStr;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchHistoricalDryerReadings() {
      setLoading(true);
      try {
        const supabase = createClient();
        const now = Date.now();
        const durationMap = {
          "1h": 60 * 60 * 1000,
          "6h": 6 * 60 * 60 * 1000,
          "24h": 24 * 60 * 60 * 1000,
        };

        const cutoffIso = new Date(now - durationMap[timeRange]).toISOString();

        const queryBuilder = (base: any) => (deviceId ? base.eq("device_id", deviceId) : base);

        const { data, error } = await queryBuilder(
          supabase
            .from("readings")
            .select("captured_at, temperature, device_id")
            .not("temperature", "is", null)
            .gte("captured_at", cutoffIso)
            .order("captured_at", { ascending: true })
            .limit(100)
        );
        let points: any[] = (data as any[]) || [];

        if (!error && points.length < 3) {
          const fallbackRes = await queryBuilder(
            supabase
              .from("readings")
              .select("captured_at, temperature, device_id")
              .not("temperature", "is", null)
              .order("captured_at", { ascending: false })
              .limit(30)
          );
          if (fallbackRes.data && (fallbackRes.data as any[]).length > 0) {
            points = (fallbackRes.data as any[]).reverse();
          }
        }

        if (isMounted) {
          if (points.length > 0) {
            const mapped: DryerPoint[] = points.map((r) => ({
              time: formatTimestamp(r.captured_at),
              temperature: r.temperature !== null ? Number(r.temperature) : null,
            }));
            setHistoryData(mapped);
          } else {
            setHistoryData([]);
          }
        }
      } catch (err) {
        console.error("Failed to load historical dryer telemetry:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchHistoricalDryerReadings();

    return () => {
      isMounted = false;
    };
  }, [deviceId, timeRange, formatTimestamp]);

  const chartData = useMemo(() => {
    if (historyData.length === 0) {
      if (currentTemp !== null) {
        const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
        return [{ time: nowStr, temperature: currentTemp }];
      }
      return [];
    }
    return historyData;
  }, [historyData, currentTemp]);

  const yDomain = useMemo(() => {
    const valid = chartData
      .map((d) => d.temperature)
      .filter((v): v is number => typeof v === "number" && !isNaN(v));

    if (valid.length === 0) return [60, 100];

    const min = Math.min(...valid, targetTemp);
    const max = Math.max(...valid, targetTemp);
    const padding = Math.max(Math.ceil((max - min) * 0.15), 2);

    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData, targetTemp]);

  return (
    <section className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0B3C5D]" />
            <h2 className="text-lg font-bold text-[#012d1d]">
              Heating Bay Temperature Trend
            </h2>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>
          <p className="text-[12px] text-slate-500">
            Continuous flue-gas heat exchanger supply stream telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[12px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] font-semibold text-[#1B4332]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#116C4A]" />
            <span>Supply Air Temp ({currentTemp !== null ? `${currentTemp.toFixed(1)}°C` : "--"})</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] font-semibold text-[#0369A1]">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#0284C7]" />
            <span>Target ({targetTemp.toFixed(1)}°C)</span>
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
            data={chartData}
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
              domain={yDomain}
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
                        <strong className="text-slate-900">{typeof temp === "number" ? `${temp.toFixed(1)}°C` : "--"}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#0369A1] font-semibold">
                          Target Setpoint:
                        </span>
                        <strong className="text-slate-900">{targetTemp.toFixed(1)}°C</strong>
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
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="none"
              fill="url(#dryerAreaGradient)"
            />
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
