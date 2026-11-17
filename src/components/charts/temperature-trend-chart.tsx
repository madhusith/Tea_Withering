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
} from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TemperatureTrendChartProps {
  deviceId?: string;
  deviceCode?: string;
  currentDryTemp: number | null;
  currentWetTemp: number | null;
}

interface ChartPoint {
  time: string;
  rawTime: string;
  temp_dry: number | null;
  temp_wet: number | null;
  delta: number | null;
}

export function TemperatureTrendChart({
  deviceId,
  deviceCode,
  currentDryTemp,
  currentWetTemp,
}: TemperatureTrendChartProps) {
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h" | "7d">("6h");
  const [historyData, setHistoryData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const formatTimestamp = useCallback((dateStr: string, range: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      if (range === "7d") {
        return (
          d.toLocaleDateString([], { month: "short", day: "numeric" }) +
          " " +
          d.toLocaleTimeString([], { hour: "numeric", hour12: true })
        );
      }
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return dateStr;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchHistoricalReadings() {
      setLoading(true);
      try {
        const supabase = createClient();
        const now = Date.now();
        const durationMap = {
          "1h": 60 * 60 * 1000,
          "6h": 6 * 60 * 60 * 1000,
          "24h": 24 * 60 * 60 * 1000,
          "7d": 7 * 24 * 60 * 60 * 1000,
        };

        const cutoffIso = new Date(now - durationMap[timeRange]).toISOString();

        const queryBuilder = (base: any) => (deviceId ? base.eq("device_id", deviceId) : base);

        const { data, error } = await queryBuilder(
          supabase
            .from("readings")
            .select("captured_at, temp_dry, temp_wet, delta, device_id")
            .gte("captured_at", cutoffIso)
            .order("captured_at", { ascending: true })
            .limit(100)
        );
        let points: any[] = (data as any[]) || [];

        // If no data within the exact cutoff window, grab the latest 30 readings for this device
        if (!error && points.length < 3) {
          const fallbackRes = await queryBuilder(
            supabase
              .from("readings")
              .select("captured_at, temp_dry, temp_wet, delta, device_id")
              .order("captured_at", { ascending: false })
              .limit(30)
          );
          if (fallbackRes.data && (fallbackRes.data as any[]).length > 0) {
            points = (fallbackRes.data as any[]).reverse();
          }
        }

        if (isMounted) {
          if (points.length > 0) {
            const mapped: ChartPoint[] = points
              .filter((r) => r.temp_dry !== null || r.temp_wet !== null)
              .map((r) => ({
                time: formatTimestamp(r.captured_at, timeRange),
                rawTime: r.captured_at,
                temp_dry: r.temp_dry !== null ? Number(r.temp_dry) : null,
                temp_wet: r.temp_wet !== null ? Number(r.temp_wet) : null,
                delta: r.delta !== null ? Number(r.delta) : null,
              }));

            setHistoryData(mapped);
          } else {
            setHistoryData([]);
          }
        }
      } catch (err) {
        console.error("Failed to load historical telemetry:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchHistoricalReadings();

    return () => {
      isMounted = false;
    };
  }, [deviceId, timeRange, formatTimestamp]);

  // Combine historical points with latest real-time reading if available
  const chartData = useMemo(() => {
    if (historyData.length === 0) {
      if (currentDryTemp !== null || currentWetTemp !== null) {
        const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
        return [
          {
            time: nowStr,
            rawTime: new Date().toISOString(),
            temp_dry: currentDryTemp,
            temp_wet: currentWetTemp,
            delta:
              currentDryTemp !== null && currentWetTemp !== null
                ? Math.round((currentDryTemp - currentWetTemp) * 10) / 10
                : null,
          },
        ];
      }
      return [];
    }
    return historyData;
  }, [historyData, currentDryTemp, currentWetTemp]);

  // Dynamic Y-axis domain based on actual temperature values (handles sub-zero and normal temps)
  const yDomain = useMemo(() => {
    const valid = chartData
      .flatMap((d) => [d.temp_dry, d.temp_wet])
      .filter((v): v is number => typeof v === "number" && !isNaN(v));

    if (valid.length === 0) return [15, 40];

    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const padding = Math.max(Math.ceil((max - min) * 0.2), 1);

    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

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
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] text-[12px] font-semibold text-[#1B4332]">
              <span className="w-2 h-2 rounded-full bg-[#1B4332]" />
              <span>Dry Temp ({currentDryTemp !== null ? `${currentDryTemp.toFixed(1)}°C` : "--"})</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[12px] font-semibold text-[#0369A1]">
              <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
              <span>Wet Temp ({currentWetTemp !== null ? `${currentWetTemp.toFixed(1)}°C` : "--"})</span>
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
            data={chartData}
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
              domain={yDomain}
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
                        <strong className="text-slate-900">{typeof dry === "number" ? `${dry.toFixed(1)}°C` : "--"}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#0284C7] font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                          Wet Bulb:
                        </span>
                        <strong className="text-slate-900">{typeof wet === "number" ? `${wet.toFixed(1)}°C` : "--"}</strong>
                      </div>
                      {delta !== null && (
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-4 text-[#d97706] font-bold">
                          <span>Depression (ΔT):</span>
                          <span>Δ {delta.toFixed(1)}°C</span>
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
