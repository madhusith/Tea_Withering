/**
 * TEA WITHERING & DRYING MONITORING SYSTEM
 * Gateway Telemetry Ingestion Simulator
 * Simulates Raspberry Pi LoRa bridge uploading telemetry packets.
 */

const API_URL = process.env.INGESTION_API_URL || "http://localhost:3000/api/telemetry/ingest";
const SECRET = process.env.GATEWAY_INGESTION_SECRET || "dev-gateway-secret-2026";

async function runSimulation() {
  console.log("=================================================");
  console.log("TEA WITHERING TELEMETRY SIMULATION");
  console.log(`Target: ${API_URL}`);
  console.log("=================================================\n");

  const now = new Date().toISOString();
  const bootId = `BOOT-SIM-${Date.now()}`;
  const seq = Math.floor(Math.random() * 9000) + 1000;

  const payload = {
    gateway_serial: "GW-STCLAIR-01",
    readings: [
      // 1. Trough 1 (Normal)
      {
        device_code: "TR-001",
        gateway_serial: "GW-STCLAIR-01",
        boot_id: bootId,
        sequence_no: seq,
        captured_at: now,
        temp_dry: 28.5,
        temp_wet: 24.2,
        battery_level: 98.4,
        rssi: -72,
        snr: 9.5,
      },
      // 2. Trough 2 (Warning State: High Depression 5.8°C)
      {
        device_code: "TR-002",
        gateway_serial: "GW-STCLAIR-01",
        boot_id: bootId,
        sequence_no: seq,
        captured_at: now,
        temp_dry: 32.1,
        temp_wet: 26.3,
        battery_level: 96.1,
        rssi: -78,
        snr: 8.2,
      },
      // 3. Trough 3 (Normal)
      {
        device_code: "TR-003",
        gateway_serial: "GW-STCLAIR-01",
        boot_id: bootId,
        sequence_no: seq,
        captured_at: now,
        temp_dry: 29.8,
        temp_wet: 25.5,
        battery_level: 99.0,
        rssi: -69,
        snr: 10.1,
      },
      // 4. Trough 4 (Normal)
      {
        device_code: "TR-004",
        gateway_serial: "GW-STCLAIR-01",
        boot_id: bootId,
        sequence_no: seq,
        captured_at: now,
        temp_dry: 27.8,
        temp_wet: 23.9,
        battery_level: 97.5,
        rssi: -75,
        snr: 9.0,
      },
      // 5. Dryer Machine / Biomass Heating Bay (Single Temperature ONLY!)
      {
        device_code: "DR-001",
        gateway_serial: "GW-STCLAIR-01",
        boot_id: bootId,
        sequence_no: seq,
        captured_at: now,
        temperature: 84.8,
        battery_level: 99.8,
        rssi: -65,
        snr: 11.2,
      },
    ],
  };

  try {
    console.log("Sending telemetry batch for 4 Troughs + 1 Dryer...");
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log(`\nHTTP Status: ${response.status} ${response.statusText}`);
    console.log("Response:", JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("\n[SUCCESS] Telemetry batch accepted and processed.");
    } else {
      console.error("\n[ERROR] Ingestion failed:", result);
    }
  } catch (err) {
    console.error("\n[CONNECTION ERROR] Could not reach ingestion endpoint:", err.message);
    console.log("Tip: Make sure `npm run dev` is running on http://localhost:3000");
  }
}

runSimulation();
