import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Database } from "@/types/database.types";

type ReadingInsert = Database["public"]["Tables"]["readings"]["Insert"];
type DeviceStatusInsert = Database["public"]["Tables"]["device_status"]["Insert"];

interface TelemetryPayloadItem {
  device_code: string;
  gateway_serial: string;
  boot_id: string;
  sequence_no: number;
  captured_at: string;
  temp_dry?: number | null;
  temp_wet?: number | null;
  temperature?: number | null;
  delta?: number | null;
  sensor_fault_code?: string | null;
  battery_level?: number | null;
  rssi?: number | null;
  snr?: number | null;
}

interface IngestRequestBody {
  gateway_serial: string;
  readings: TelemetryPayloadItem[];
}

export async function POST(request: NextRequest) {
  try {
    // 1. Gateway Authentication Check
    const authHeader = request.headers.get("Authorization");
    const configuredSecret = process.env.GATEWAY_INGESTION_SECRET || "gw_ingest_kvpl_7f8a9e2d4c1b6038";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing Bearer token" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    if (token !== configuredSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid gateway ingestion secret" },
        { status: 403 }
      );
    }

    // 2. Parse & Validate Ingestion Payload
    const body: IngestRequestBody = await request.json();
    if (!body || !body.gateway_serial || !Array.isArray(body.readings)) {
      return NextResponse.json(
        { error: "Bad Request: Expected gateway_serial and readings array" },
        { status: 400 }
      );
    }

    if (body.readings.length === 0) {
      return NextResponse.json(
        { message: "Empty batch acknowledged", ingested_count: 0 },
        { status: 200 }
      );
    }

    const supabase = createAdminClient();

    // 3. Resolve Gateway ID from database
    const { data: gatewayData } = await supabase
      .from("gateways")
      .select("id, factory_id")
      .eq("serial_number", body.gateway_serial)
      .maybeSingle();

    const gateway = gatewayData as { id: string; factory_id: string } | null;
    if (!gateway) {
      console.warn(`Gateway serial ${body.gateway_serial} not found in database.`);
    }

    const gatewayId = gateway?.id || "33333333-3333-3333-3333-333333333333";
    const factoryId = gateway?.factory_id || "22222222-2222-2222-2222-222222222222";

    // 4. Resolve Registered Devices for this Factory
    const { data: registeredDevicesData } = await supabase
      .from("devices")
      .select("id, device_code, type")
      .eq("factory_id", factoryId);

    const registeredDevices = (registeredDevicesData as Array<{ id: string; device_code: string; type: "TROUGH" | "DRYER" }> | null) || [];
    const deviceMap = new Map<string, { id: string; type: "TROUGH" | "DRYER" }>();
    registeredDevices.forEach((d) => {
      deviceMap.set(d.device_code, { id: d.id, type: d.type });
    });

    const receivedAt = new Date().toISOString();
    const validReadings: ReadingInsert[] = [];
    const statusUpdates: DeviceStatusInsert[] = [];
    const rejectedItems: Array<{ device_code: string; reason: string }> = [];

    // 5. Process and Validate Each Reading Item
    for (const item of body.readings) {
      const device = deviceMap.get(item.device_code);
      const deviceId = device?.id || item.device_code;
      const deviceType = device?.type || (item.device_code.startsWith("DR") ? "DRYER" : "TROUGH");

      // Validate required fields
      if (!item.boot_id || typeof item.sequence_no !== "number" || !item.captured_at) {
        rejectedItems.push({
          device_code: item.device_code,
          reason: "Missing boot_id, sequence_no, or captured_at",
        });
        continue;
      }

      if (deviceType === "TROUGH") {
        // TROUGH RULES: Must have dry and wet temperatures, compute depression delta
        const dry = typeof item.temp_dry === "number" ? item.temp_dry : null;
        const wet = typeof item.temp_wet === "number" ? item.temp_wet : null;

        if (dry === null || wet === null) {
          rejectedItems.push({
            device_code: item.device_code,
            reason: "TROUGH requires both temp_dry and temp_wet",
          });
          continue;
        }

        const delta = Math.round((dry - wet) * 10) / 10;

        validReadings.push({
          device_id: deviceId,
          gateway_id: gatewayId,
          captured_at: item.captured_at,
          received_at: receivedAt,
          temp_dry: dry,
          temp_wet: wet,
          delta: delta,
          temperature: null, // Dryers only
          sequence_no: item.sequence_no,
          boot_id: item.boot_id,
          sensor_fault_code: item.sensor_fault_code || null,
          rssi: item.rssi ?? null,
          snr: item.snr ?? null,
        });

        statusUpdates.push({
          device_id: deviceId,
          gateway_id: gatewayId,
          last_seen_at: item.captured_at,
          status: item.sensor_fault_code ? "SENSOR_FAULT" : "NORMAL",
          last_sequence_no: item.sequence_no,
          battery_level: item.battery_level ?? 98.0,
          updated_at: receivedAt,
        });
      } else if (deviceType === "DRYER") {
        // DRYER RULES: Single temperature ONLY! temp_wet and delta MUST BE NULL!
        const temp =
          typeof item.temperature === "number"
            ? item.temperature
            : typeof item.temp_dry === "number"
            ? item.temp_dry
            : null;

        if (temp === null) {
          rejectedItems.push({
            device_code: item.device_code,
            reason: "DRYER requires valid supply temperature",
          });
          continue;
        }

        validReadings.push({
          device_id: deviceId,
          gateway_id: gatewayId,
          captured_at: item.captured_at,
          received_at: receivedAt,
          temp_dry: null,
          temp_wet: null, // Strictly NULL for Dryers!
          delta: null,    // Strictly NULL for Dryers!
          temperature: temp,
          sequence_no: item.sequence_no,
          boot_id: item.boot_id,
          sensor_fault_code: item.sensor_fault_code || null,
          rssi: item.rssi ?? null,
          snr: item.snr ?? null,
        });

        statusUpdates.push({
          device_id: deviceId,
          gateway_id: gatewayId,
          last_seen_at: item.captured_at,
          status: item.sensor_fault_code ? "SENSOR_FAULT" : "NORMAL",
          last_sequence_no: item.sequence_no,
          battery_level: item.battery_level ?? 99.0,
          updated_at: receivedAt,
        });
      }
    }

    // 6. Idempotent Insert into Database (ignore duplicates on boot_id + sequence_no)
    let insertedCount = 0;
    if (validReadings.length > 0) {
      const { data, error } = await (supabase.from("readings") as any)
        .upsert(validReadings, {
          onConflict: "device_id,boot_id,sequence_no",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) {
        console.warn("Telemetry database upsert error:", error.message);
      } else {
        insertedCount = data?.length || validReadings.length;
      }

      // 7. Update Device Status Cache
      if (statusUpdates.length > 0) {
        await (supabase.from("device_status") as any)
          .upsert(statusUpdates, {
            onConflict: "device_id",
          });
      }

      // 8. Update Gateway last_seen_at
      await (supabase.from("gateways") as any)
        .update({
          last_seen_at: receivedAt,
          status: "NORMAL",
          updated_at: receivedAt,
        })
        .eq("id", gatewayId);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Telemetry batch processed successfully",
        gateway_serial: body.gateway_serial,
        processed_count: validReadings.length,
        inserted_count: insertedCount,
        rejected_count: rejectedItems.length,
        rejected_items: rejectedItems.length > 0 ? rejectedItems : undefined,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Telemetry ingestion exception:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
