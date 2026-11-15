"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useId } from "react";
import { createClient } from "@/lib/supabase/client";
import { mockTroughs as initialTroughs, mockDryer as initialDryer, mockAlerts as initialAlerts } from "@/lib/mock-data";
import { TroughDevice, DryerDevice, Alert } from "@/types";

export interface FactoryItem {
  id: string;
  name: string;
  code: string;
  location?: string;
}

interface TelemetryContextType {
  troughs: TroughDevice[];
  dryer: DryerDevice;
  alerts: Alert[];
  activeAlertsCount: number;
  lastHeartbeat: string;
  isConnected: boolean;
  factories: FactoryItem[];
  currentFactory: FactoryItem;
  switchFactory: (factoryId: string) => Promise<void>;
  createFactory: (data: {
    name: string;
    code: string;
    location?: string;
    gateway_serial?: string;
    trough_count?: number;
  }) => Promise<{ success: boolean; error?: string; factory?: any }>;
  refreshTelemetry: () => Promise<void>;
  updateAlarmState: (id: string, newState: "ACKNOWLEDGED" | "SNOOZED" | "CLEARED") => Promise<void>;
  addTrough: (code: string, name: string) => Promise<{ success: boolean; error?: string }>;
  removeTrough: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const defaultFactory: FactoryItem = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "St. Clair Tea Estate",
  code: "STC-01",
  location: "Div. No. 03 • Trough Hall B",
};

const TelemetryContext = createContext<TelemetryContextType | null>(null);

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [factories, setFactories] = useState<FactoryItem[]>([defaultFactory]);
  const [currentFactory, setCurrentFactory] = useState<FactoryItem>(defaultFactory);
  const [troughs, setTroughs] = useState<TroughDevice[]>(initialTroughs);
  const [dryer, setDryer] = useState<DryerDevice>(initialDryer);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>("Just now");
  const [isConnected, setIsConnected] = useState<boolean>(true);

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

  const loadInitialData = useCallback(async (targetFactoryId?: string) => {
    const supabase = createClient();

    try {
      // 1. Fetch available factories
      const { data: dbFactoriesData } = await (supabase
        .from("factories") as any)
        .select("id, name, code, location")
        .eq("status", "ACTIVE")
        .order("name", { ascending: true });

      if (dbFactoriesData && dbFactoriesData.length > 0) {
        setFactories(dbFactoriesData);
      }

      const activeFactoryId = targetFactoryId || currentFactory.id;

      // 2. Fetch devices for active factory (fallback to all if no match)
      let { data: dbDevicesData } = await supabase
        .from("devices")
        .select("id, device_code, name, type, active, factory_id")
        .eq("factory_id", activeFactoryId)
        .order("device_code", { ascending: true });

      if (!dbDevicesData || dbDevicesData.length === 0) {
        const fallback = await supabase
          .from("devices")
          .select("id, device_code, name, type, active, factory_id")
          .order("device_code", { ascending: true });
        dbDevicesData = fallback.data;
      }

      const { data: dbReadingsData } = await supabase
        .from("readings")
        .select("*")
        .order("captured_at", { ascending: false })
        .limit(30);

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
          devices ( device_code, name, type, factory_id )
        `)
        .order("triggered_at", { ascending: false });

      const dbDevices = (dbDevicesData as any[]) || [];
      const dbReadings = (dbReadingsData as any[]) || [];
      const dbAlarms = (dbAlarmsData as any[]) || [];

      if (dbDevices.length > 0 && dbReadings.length > 0) {
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

      if (dbAlarms.length > 0) {
        const mappedAlerts: Alert[] = dbAlarms.map((a: any) => {
          let status: "active" | "snoozed" | "resolved" = "active";
          if (a.state === "CLEARED") status = "resolved";
          else if (a.state === "SNOOZED") status = "snoozed";

          const isDryer = a.devices?.type === "DRYER";
          const devName = isDryer ? "Heating Bay" : (a.devices?.name || "Withering Bay");
          let message = `${a.alarm_rules?.metric?.replace(/_/g, " ") || "Threshold"} deviation (${a.trigger_value}°C)`;
          if (a.alarm_rules?.metric === "DRYER_TEMP") {
            message = `Heating Bay Fluctuation (${a.trigger_value}°C)`;
          } else if (a.alarm_rules?.metric === "HYGROMETRIC_DEPRESSION") {
            message = `High Wet-Bulb Depression (${a.trigger_value}°C)`;
          }

          return {
            id: a.id,
            factory_name: "St. Clair Estate",
            device_code: a.devices?.device_code || (isDryer ? "DR-001" : "TR-001"),
            device_name: devName,
            device_type: (a.devices?.type as any) || (isDryer ? "DRYER" : "TROUGH"),
            message: message,
            severity: (a.alarm_rules?.severity?.toLowerCase() as any) || "warning",
            status: status,
            triggered_at: formatTime(a.triggered_at),
            acknowledged_at: a.acknowledged_at ? formatTime(a.acknowledged_at) : undefined,
            snoozed_until: a.snoozed_until ? formatTime(a.snoozed_until) : undefined,
            resolved_at: a.cleared_at ? formatTime(a.cleared_at) : undefined,
            trigger_value: Number(a.trigger_value),
            resolved_by: a.state === "CLEARED" ? "Rohan P. (Manager)" : undefined,
          };
        });
        setAlerts(mappedAlerts);
      }
    } catch (err) {
      console.warn("Using offline fallback for telemetry:", err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    const supabase = createClient();
    // Unique channel instance for provider
    const channelId = `telemetry-stream-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "readings" },
        (payload) => {
          const newReading = payload.new as any;
          const timeLabel = formatTime(newReading.captured_at || new Date().toISOString());
          setLastHeartbeat(timeLabel);

          const DEVICE_MAP: Record<string, string> = {
            "44444444-4444-4444-4444-000000000001": "TR-001",
            "44444444-4444-4444-4444-000000000002": "TR-002",
            "44444444-4444-4444-4444-000000000003": "TR-003",
            "44444444-4444-4444-4444-000000000004": "TR-004",
            "44444444-4444-4444-4444-000000000005": "DR-001",
          };

          const matchedCode = DEVICE_MAP[newReading.device_id] || newReading.device_code;

          if (newReading.temp_dry !== null && newReading.temp_wet !== null) {
            setTroughs((prev) =>
              prev.map((t) => {
                if (t.id === newReading.device_id || t.device_code === matchedCode) {
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

          if (newReading.temperature !== null) {
            setDryer((prev) => {
              if (prev.id === newReading.device_id || prev.device_code === matchedCode) {
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
          loadInitialData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "devices" },
        () => {
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

  const updateAlarmState = useCallback(
    async (id: string, newState: "ACKNOWLEDGED" | "SNOOZED" | "CLEARED") => {
      const supabase = createClient();
      const now = new Date().toISOString();
      const updatePayload: Record<string, any> = { state: newState };
      
      if (newState === "CLEARED") {
        updatePayload.cleared_at = now;
      } else if (newState === "ACKNOWLEDGED") {
        updatePayload.acknowledged_at = now;
      } else if (newState === "SNOOZED") {
        updatePayload.snoozed_until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      }

      // Optimistic update
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            return {
              ...a,
              status: newState === "CLEARED" ? "resolved" : newState === "SNOOZED" ? "snoozed" : a.status,
              acknowledged_at: newState === "ACKNOWLEDGED" ? "Just now" : a.acknowledged_at,
              resolved_at: newState === "CLEARED" ? "Just now" : a.resolved_at,
              resolved_by: newState === "CLEARED" ? "Rohan P. (Manager)" : a.resolved_by,
              snoozed_until: newState === "SNOOZED" ? "In 30m" : a.snoozed_until,
            };
          }
          return a;
        })
      );

      try {
        await (supabase.from("alarms") as any).update(updatePayload).eq("id", id);
      } catch (err) {
        console.warn("Failed to persist alarm update to Supabase:", err);
      }
    },
    []
  );

  const addTrough = useCallback(
    async (code: string, name: string) => {
      try {
        const res = await fetch("/api/devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_code: code,
            name: name,
            type: "TROUGH",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "Failed to add trough" };
        }
        await loadInitialData();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error" };
      }
    },
    [loadInitialData]
  );

  const removeTrough = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/devices?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "Failed to remove trough" };
        }
        await loadInitialData();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error" };
      }
    },
    [loadInitialData]
  );

  const switchFactory = useCallback(
    async (factoryId: string) => {
      const found = factories.find((f) => f.id === factoryId);
      if (found) {
        setCurrentFactory(found);
        await loadInitialData(found.id);
      }
    },
    [factories, loadInitialData]
  );

  const createFactory = useCallback(
    async (data: {
      name: string;
      code: string;
      location?: string;
      gateway_serial?: string;
      trough_count?: number;
    }) => {
      try {
        const res = await fetch("/api/factories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();
        if (!res.ok) {
          return { success: false, error: result.error || "Failed to create factory" };
        }

        const newFactory: FactoryItem = {
          id: result.factory.id,
          name: result.factory.name,
          code: result.factory.code,
          location: result.factory.location,
        };

        setFactories((prev) => [...prev, newFactory]);
        setCurrentFactory(newFactory);
        await loadInitialData(newFactory.id);
        return { success: true, factory: newFactory };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error" };
      }
    },
    [loadInitialData]
  );

  const activeAlertsCount = alerts.filter((a) => a.status === "active").length;

  return (
    <TelemetryContext.Provider
      value={{
        troughs,
        dryer,
        alerts,
        activeAlertsCount,
        lastHeartbeat,
        isConnected,
        factories,
        currentFactory,
        switchFactory,
        createFactory,
        refreshTelemetry: loadInitialData,
        updateAlarmState,
        addTrough,
        removeTrough,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetryRealtime() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error("useTelemetryRealtime must be used within a TelemetryProvider");
  }
  return context;
}
