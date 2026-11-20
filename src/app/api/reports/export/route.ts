import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "troughs";
    const factoryId = searchParams.get("factory_id") || "22222222-2222-2222-2222-222222222222";
    const range = searchParams.get("range") || "7d"; // 24h, 7d, 30d, all

    const supabase = createAdminClient();

    // Calculate time filter
    let timeThreshold: string | null = null;
    const now = new Date();
    if (range === "24h") {
      timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    } else if (range === "7d") {
      timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (range === "30d") {
      timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Helper: Format date to Asia/Colombo local time
    const toColomboTime = (isoString?: string | null) => {
      if (!isoString) return "";
      try {
        const d = new Date(isoString);
        return d.toLocaleString("en-GB", { timeZone: "Asia/Colombo" });
      } catch {
        return isoString;
      }
    };

    let filename = `report-${reportType}-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    let csvRows: string[] = [];

    if (reportType === "troughs") {
      // 1. Withering Troughs Report
      let query = supabase
        .from("readings")
        .select(`
          id,
          captured_at,
          received_at,
          temp_dry,
          temp_wet,
          delta,
          sequence_no,
          boot_id,
          rssi,
          snr,
          device:devices!inner(id, device_code, name, type, factory_id)
        `)
        .eq("device.factory_id", factoryId)
        .eq("device.type", "TROUGH")
        .order("captured_at", { ascending: false });

      if (timeThreshold) {
        query = query.gte("captured_at", timeThreshold);
      }

      const { data, error } = await query;
      if (error) throw error;

      csvRows.push([
        "Record ID",
        "Device Code",
        "Bay Name",
        "Captured At (UTC)",
        "Local Time (Asia/Colombo)",
        "Dry-Bulb (°C)",
        "Wet-Bulb (°C)",
        "Depression ΔT (°C)",
        "Target Band (°C)",
        "Sequence No",
        "Boot ID",
        "RSSI (dBm)",
        "SNR (dB)"
      ].map(c => `"${c}"`).join(","));

      (data || []).forEach((row: any) => {
        csvRows.push([
          row.id,
          row.device?.device_code || "",
          row.device?.name || "",
          row.captured_at,
          toColomboTime(row.captured_at),
          row.temp_dry ?? "",
          row.temp_wet ?? "",
          row.delta ?? "",
          "0.0 - 8.0",
          row.sequence_no,
          row.boot_id || "",
          row.rssi ?? "",
          row.snr ?? ""
        ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(","));
      });

    } else if (reportType === "dryer") {
      // 2. Biomass Heating Bay / Dryer Report (Single temperature only!)
      let query = supabase
        .from("readings")
        .select(`
          id,
          captured_at,
          received_at,
          temperature,
          sequence_no,
          boot_id,
          rssi,
          snr,
          device:devices!inner(id, device_code, name, type, factory_id)
        `)
        .eq("device.factory_id", factoryId)
        .eq("device.type", "DRYER")
        .order("captured_at", { ascending: false });

      if (timeThreshold) {
        query = query.gte("captured_at", timeThreshold);
      }

      const { data, error } = await query;
      if (error) throw error;

      csvRows.push([
        "Record ID",
        "Device Code",
        "Machine Name",
        "Captured At (UTC)",
        "Local Time (Asia/Colombo)",
        "Supply Air Temp (°C)",
        "Target Setpoint (°C)",
        "Sequence No",
        "Boot ID",
        "RSSI (dBm)",
        "SNR (dB)"
      ].map(c => `"${c}"`).join(","));

      (data || []).forEach((row: any) => {
        csvRows.push([
          row.id,
          row.device?.device_code || "",
          row.device?.name || "",
          row.captured_at,
          toColomboTime(row.captured_at),
          row.temperature ?? "",
          "85.0",
          row.sequence_no,
          row.boot_id || "",
          row.rssi ?? "",
          row.snr ?? ""
        ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(","));
      });

    } else if (reportType === "alarms") {
      // 3. Alarms and Events Audit Log
      let query = supabase
        .from("alarms")
        .select(`
          id,
          state,
          trigger_value,
          triggered_at,
          acknowledged_at,
          snoozed_until,
          cleared_at,
          rule:alarm_rules(metric, severity, min_value, max_value),
          device:devices!inner(device_code, name, type, factory_id)
        `)
        .eq("device.factory_id", factoryId)
        .order("triggered_at", { ascending: false });

      if (timeThreshold) {
        query = query.gte("triggered_at", timeThreshold);
      }

      const { data, error } = await query;
      if (error) throw error;

      csvRows.push([
        "Alarm ID",
        "Device Code",
        "Device Name",
        "Metric",
        "Trigger Value (°C)",
        "Severity",
        "Status",
        "Triggered At (UTC)",
        "Triggered At (Local)",
        "Acknowledged At",
        "Cleared At"
      ].map(c => `"${c}"`).join(","));

      (data || []).forEach((row: any) => {
        csvRows.push([
          row.id,
          row.device?.device_code || "",
          row.device?.name || "",
          row.rule?.metric || "THRESHOLD_DEVIATION",
          row.trigger_value ?? "",
          row.rule?.severity || "WARNING",
          row.state,
          row.triggered_at,
          toColomboTime(row.triggered_at),
          toColomboTime(row.acknowledged_at),
          toColomboTime(row.cleared_at)
        ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(","));
      });

    } else if (reportType === "connectivity") {
      // 4. Device and Gateway Connectivity Audit
      const { data, error } = await supabase
        .from("device_status")
        .select(`
          device_id,
          last_seen_at,
          status,
          last_sequence_no,
          battery_level,
          updated_at,
          device:devices!inner(id, device_code, name, type, factory_id),
          gateway:gateways(serial_number, firmware_version)
        `)
        .eq("device.factory_id", factoryId);

      if (error) throw error;

      csvRows.push([
        "Device ID",
        "Device Code",
        "Device Name",
        "Type",
        "Operational Status",
        "Battery Level (%)",
        "Last Sequence No",
        "Gateway Serial",
        "Gateway Firmware",
        "Last Seen At (UTC)",
        "Last Seen At (Local)"
      ].map(c => `"${c}"`).join(","));

      (data || []).forEach((row: any) => {
        csvRows.push([
          row.device_id,
          row.device?.device_code || "",
          row.device?.name || "",
          row.device?.type || "",
          row.status,
          row.battery_level ?? "",
          row.last_sequence_no ?? "",
          row.gateway?.serial_number || "GW-PRIMARY",
          row.gateway?.firmware_version || "v2.4.1",
          row.last_seen_at,
          toColomboTime(row.last_seen_at)
        ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(","));
      });
    }

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate report export: " + (error.message || String(error)) },
      { status: 500 }
    );
  }
}

