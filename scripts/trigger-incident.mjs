/**
 * TEA WITHERING & DRYING MONITORING SYSTEM
 * Incident Trigger Script
 * Simulates a critical threshold deviation from the hardware to trigger a live alarm.
 */

const API_URL = process.env.INGESTION_API_URL || "http://localhost:3000/api/telemetry/ingest";
const SECRET = process.env.GATEWAY_INGESTION_SECRET || "dev-gateway-secret-2026";

async function triggerIncident() {
  console.log("=================================================");
  console.log("SIMULATING HARDWARE THRESHOLD INCIDENT");
  console.log("=================================================\n");

  const now = new Date().toISOString();
  const bootId = `BOOT-INCIDENT-${Date.now()}`;
  const seq = Math.floor(Math.random() * 90000) + 10000;

  // Incident 1: Biomass Heating Bay (DR-001) Furnace Overheat
  // Normal range: 80.0°C - 90.0°C. Reading: 95.8°C (CRITICAL ALARM!)
  console.log("1. Generating CRITICAL Over-Temperature Incident on DR-001 (Biomass Heating Bay)...");
  console.log("   Measured Supply Temp: 95.8°C (Permissible Max: 90.0°C)\n");

  // Incident 2: Withering Bay 04 (TR-004) Excessive Hygrometric Depression
  // Normal range: 3.5°C - 4.8°C. Reading: Dry 34.5°C, Wet 28.0°C -> Delta 6.5°C (WARNING ALARM!)
  console.log("2. Generating High Depression Incident on TR-004 (Withering Bay 04)...");
  console.log("   Measured Delta: 6.5°C (Permissible Max: 4.8°C)\n");

  const payload = {
    gateway_serial: "GW-STCLAIR-01",
    readings: [
      {
        device_code: "DR-001",
        gateway_serial: "GW-STCLAIR-01",
        boot_id: bootId,
        sequence_no: seq,
        captured_at: now,
        temperature: 95.8, // CRITICAL over-temperature!
        battery_level: 99.1,
        rssi: -64,
        snr: 11.5,
      },
      {
        device_code: "TR-004",
        gateway_serial: "GW-STCLAIR-01",
        boot_id: bootId,
        sequence_no: seq + 1,
        captured_at: now,
        temp_dry: 34.5,
        temp_wet: 28.0, // Delta = 6.5°C!
        battery_level: 95.8,
        rssi: -73,
        snr: 8.9,
      },
    ],
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log(`HTTP Status: ${response.status} ${response.statusText}`);
    console.log("Response:", JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("\n[SUCCESS] Critical incident telemetry injected!");
      console.log("-> PostgreSQL trigger evaluated thresholds in Supabase.");
      console.log("-> Active alarms created in 'alarms' & 'alarm_events' tables.");
      console.log("-> Realtime WebSockets sent alert notification to your browser.");
      console.log("\nCheck your browser at http://localhost:3000/alerts or http://localhost:3000/dashboard now!");
    } else {
      console.error("[ERROR] Failed to inject incident:", result);
    }
  } catch (err) {
    console.error("[ERROR] Could not reach ingestion endpoint:", err.message);
    console.log("Tip: Make sure `npm run dev` is running on http://localhost:3000");
  }
}

triggerIncident();

