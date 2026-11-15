"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { mockTroughs as initialTroughs, mockDryer as initialDryer, mockAlerts as initialAlerts } from "@/lib/mock-data";
import { TroughDevice, DryerDevice, Alert } from "@/types";

export function useTelemetryRealtime() {
  const [troughs, setTroughs] = useState<TroughDevice[]>(initialTroughs);
  const [dryer, setDryer] = useState<DryerDevice>(initialDryer);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>("Just now");
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Helper to format ISO time into human readable time (Asia/Colombo)
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return "Just now";
    }
  };

  // 1. Initial Data Fetch from Supabase
  const loadInitialData = useCallback(async () => {
    const supabase = createClient();

    try {
      // Fetch devices
      const { data: dbDevicesData } = await supabase
        .from("devices")
        .select("id, device_code, name, type, active")
        .order("device_code", { ascending: true });

      // Fetch latest reading for each device
      const { data: dbReadingsData } = await supabase
        .from("readings")
        .select("*")
        .order("captured_at", { ascending: false })
        .limit(20);

      // Fetch active alarms
      const { data: dbAlarmsData } = await (supabase
        .from("alarms") as any)
        .select(`
          id,
          device_id,
          rule_id,
          state,
          triggered_at,
          trigger_value,
          alarm_rules ( metric, severity, min_value, max_value ),
          devices ( device_code, name, type )
        `)
        .order("triggered_at", { ascending: false });

      const dbDevices = (dbDevicesData as any[]) || [];
      const dbReadings = (dbReadingsData as any[]) || [];
      const dbAlarms = (dbAlarmsData as any[]) || [];

      if (dbDevices && dbDevices.length > 0 && dbReadings && dbReadings.length > 0) {
        // Map Troughs
        const latestReadingMap = new Map();
        dbReadings.forEach((r) => {
          if (!latestReadingMap.has(r.device_id)) {
            latestReadingMap.set(r.device_id, r);
          }
        });

        const updatedTroughs = dbDevices
          .filter((d) => d.type === "TROUGH")
          .map((d, index) => {
            const r = latestReadingMap.get(d.id);
            const dry = r?.temp_dry ?? 28.0 + index;
            const wet = r?.temp_wet ?? 24.0 + index * 0.5;
            const delta = r?.delta ?? Math.round((dry - wet) * 10) / 10;
            const isWarn = delta > 4.8 || delta < 3.5;

            return {
              id: d.id,
              device_code: d.device_code,
              name: d.name,
              type: "TROUGH" as const,
              factory_id: "22222222-2222-2222-2222-222222222222",
              gateway_id: "33333333-3333-3333-3333-333333333333",
              temp_dry: dry,
              temp_wet: wet,
              delta: delta,
              status: isWarn ? ("WARNING" as const) : ("NORMAL" as const),
              status_message: isWarn ? "Depression Above Band" : "Within Optimal Envelope",
              last_seen_at: r?.captured_at ? formatTime(r.captured_at) : "Just now",
              sensor_dry_code: `Sensor A${index + 1}`,
              sensor_wet_code: `Sensor B${index + 1}`,
            };
          });

        if (updatedTroughs.length > 0) {
          setTroughs(updatedTroughs);
        }

        // Map Dryer (Single Temperature only!)
        const dryerDevice = dbDevices.find((d) => d.type === "DRYER");
        if (dryerDevice) {
          const r = latestReadingMap.get(dryerDevice.id);
          const temp = r?.temperature ?? 84.5;
          setDryer({
            id: dryerDevice.id,
            device_code: dryerDevice.device_code,
            name: dryerDevice.name,
            type: "DRYER" as const,
            factory_id: "22222222-2222-2222-2222-222222222222",
            gateway_id: "33333333-3333-3333-3333-333333333333",
            temperature: temp,
            target_temperature: 85.0,
            status: temp > 90.0 || temp < 80.0 ? "WARNING" : "NORMAL",
            status_message: "Flue-gas Biomass Supply Steady",
            last_seen_at: r?.captured_at ? formatTime(r.captured_at) : "Just now",
            sensor_code: "Pt100 RTD #H-01",
          });
        }
      }

      if (dbAlarms && dbAlarms.length > 0) {
        const mappedAlerts: Alert[] = dbAlarms.map((a: any) => ({
          id: a.id,
          factory_name: "St. Clair Tea Estate",
          device_code: a.devices?.device_code || "TR-002",
          device_name: a.devices?.name || "Withering Bay",
          device_type: (a.devices?.type as any) || "TROUGH",
          message: `${a.alarm_rules?.metric?.replace(/_/g, " ") || "Threshold"} deviation (${a.trigger_value}°C measured)`,
          severity: (a.alarm_rules?.severity?.toLowerCase() as any) || "warning",
          status: a.state === "CLEARED" ? "resolved" : (a.state?.toLowerCase() as any) || "active",
          triggered_at: formatTime(a.triggered_at),
          trigger_value: a.trigger_value,
        }));
        setAlerts(mappedAlerts);
      }
    } catch (err) {
      console.warn("Using offline mock fallback for telemetry realtime:", err);
    }
  }, []);

  // 2. Realtime WebSocket Subscriptions via Supabase Channels
  useEffect(() => {
    loadInitialData();

    const supabase = createClient();
    const channel = supabase
      .channel("realtime:telemetry-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "readings" },
        (payload) => {
          const newReading = payload.new as any;
          const timeLabel = formatTime(newReading.captured_at || new Date().toISOString());
          setLastHeartbeat(timeLabel);

          // Update Trough if reading belongs to a trough
          if (newReading.temp_dry !== null && newReading.temp_wet !== null) {
            setTroughs((prev) =>
              prev.map((t) => {
                if (t.id === newReading.device_id || t.device_code === newReading.device_code) {
                  const delta = newReading.delta ?? Math.round((newReading.temp_dry - newReading.temp_wet) * 10) / 10;
                  const isWarn = delta > 4.8 || delta < 3.5;
                  return {
                    ...t,
                    temp_dry: newReading.temp_dry,
                    temp_wet: newReading.temp_wet,
                    delta: delta,
                    status: isWarn ? "WARNING" : "NORMAL",
                    status_message: isWarn ? "Depression Above Band" : "Within Optimal Envelope",
                    last_seen_at: timeLabel,
                  };
                }
                return t;
              })
            );
          }

          // Update Dryer if reading is single temperature
          if (newReading.temperature !== null) {
            setDryer((prev) => {
              if (prev.id === newReading.device_id || prev.device_code === newReading.device_code) {
                const temp = newReading.temperature;
                return {
                  ...prev,
                  temperature: temp,
                  status: temp > 90.0 || temp < 80.0 ? "WARNING" : "NORMAL",
                  last_seen_at: timeLabel,
                };
              }
              return prev;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alarms" },
        () => {
          // Re-fetch alarms on any insert or state update
          loadInitialData();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadInitialData]);

  const activeAlertsCount = alerts.filter(
    (a) => a.status === "active"
  ).length;

  return {
    troughs,
    dryer,
    alerts,
    activeAlertsCount,
    lastHeartbeat,
    isConnected,
    refreshTelemetry: loadInitialData,
  };
}
