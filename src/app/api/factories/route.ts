import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: factories, error } = await supabase
      .from("factories")
      .select(`
        id,
        organization_id,
        name,
        code,
        location,
        timezone,
        status,
        created_at
      `)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ factories: factories || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch factories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      name,
      code,
      location = "Central Highlands, Sri Lanka",
      gateway_serial,
      trough_count = 4,
    } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Factory Name and Factory Code are required." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    const orgId = "11111111-1111-1111-1111-111111111111"; // Kelani Valley Plantations

    // 1. Create Factory
    const { data: newFactory, error: factoryError } = await (supabase
      .from("factories") as any)
      .insert({
        organization_id: orgId,
        name: cleanName,
        code: cleanCode,
        location: location.trim(),
        timezone: "Asia/Colombo",
        status: "ACTIVE",
      })
      .select()
      .single();

    if (factoryError) {
      return NextResponse.json({ error: factoryError.message }, { status: 400 });
    }

    // 2. Create Primary LoRa Gateway for this factory
    const gwSerial = gateway_serial?.trim().toUpperCase() || `GW-${cleanCode}-01`;
    const { data: newGateway, error: gwError } = await (supabase
      .from("gateways") as any)
      .insert({
        factory_id: newFactory.id,
        serial_number: gwSerial,
        firmware_version: "v1.2.0",
        status: "NORMAL",
      })
      .select()
      .single();

    if (gwError) {
      console.warn("Gateway creation warning:", gwError);
    }

    const gatewayId = newGateway?.id || "33333333-3333-3333-3333-333333333333";
    const now = new Date().toISOString();

    // 3. Provision Initial Withering Troughs
    const count = Math.min(Math.max(Number(trough_count) || 4, 1), 12);
    const troughInserts = [];
    for (let i = 1; i <= count; i++) {
      const padNum = i < 10 ? `0${i}` : `${i}`;
      troughInserts.push({
        factory_id: newFactory.id,
        gateway_id: gatewayId,
        device_code: `TR-${padNum}`,
        name: `Bay ${padNum}`,
        type: "TROUGH",
        active: true,
      });
    }

    const { data: createdTroughs } = await (supabase
      .from("devices") as any)
      .insert(troughInserts)
      .select();

    // Create baseline readings for each trough
    if (createdTroughs && createdTroughs.length > 0) {
      const readings = createdTroughs.map((t: any, index: number) => ({
        device_id: t.id,
        boot_id: `BOOT-INIT`,
        sequence_no: 1,
        captured_at: now,
        temp_dry: 28.0 + (index % 3) * 0.4,
        temp_wet: 23.8 + (index % 3) * 0.2,
        delta: Math.round((4.2 + (index % 3) * 0.2) * 10) / 10,
      }));
      await (supabase.from("readings") as any).insert(readings);
    }

    // 4. Provision Biomass Heating Bay (Dryer)
    const { data: dryerDevice } = await (supabase
      .from("devices") as any)
      .insert({
        factory_id: newFactory.id,
        gateway_id: gatewayId,
        device_code: "DR-001",
        name: "Biomass Heating Bay",
        type: "DRYER",
        active: true,
      })
      .select()
      .single();

    if (dryerDevice) {
      await (supabase.from("readings") as any).insert({
        device_id: dryerDevice.id,
        boot_id: `BOOT-INIT`,
        sequence_no: 1,
        captured_at: now,
        temperature: 85.0,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Factory ${cleanName} (${cleanCode}) successfully created with Gateway ${gwSerial} and ${count} Troughs.`,
      factory: newFactory,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create factory" },
      { status: 500 }
    );
  }
}

