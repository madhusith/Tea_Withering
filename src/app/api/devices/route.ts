import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("devices")
      .select("id, device_code, name, type, active, factory_id, gateway_id, created_at")
      .order("device_code", { ascending: true });

    if (type) {
      query = query.eq("type", type as "TROUGH" | "DRYER");
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ devices: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch devices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { device_code, name, type = "TROUGH", factory_id, gateway_id } = body;

    if (!device_code || !name) {
      return NextResponse.json(
        { error: "Missing required fields: device_code and name" },
        { status: 400 }
      );
    }

    // Default to St. Clair factory and gateway if not specified
    const targetFactoryId = factory_id || "22222222-2222-2222-2222-222222222222";
    const targetGatewayId = gateway_id || "33333333-3333-3333-3333-333333333333";

    // 1. Insert device
    const { data: device, error: insertError } = await (supabase
      .from("devices") as any)
      .insert({
        factory_id: targetFactoryId,
        gateway_id: targetGatewayId,
        device_code: device_code.trim().toUpperCase(),
        name: name.trim(),
        type: type as "TROUGH" | "DRYER",
        active: true,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // 2. Insert initial baseline reading so telemetry gauges immediately display
    const now = new Date().toISOString();
    if (type === "TROUGH") {
      await (supabase.from("readings") as any).insert({
        device_id: device.id,
        boot_id: `BOOT-${Date.now().toString().slice(-4)}`,
        sequence_no: 1,
        captured_at: now,
        temp_dry: 28.5,
        temp_wet: 24.3,
        delta: 4.2,
      });
    } else {
      await (supabase.from("readings") as any).insert({
        device_id: device.id,
        boot_id: `BOOT-${Date.now().toString().slice(-4)}`,
        sequence_no: 1,
        captured_at: now,
        temperature: 84.5,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Device ${device.device_code} created successfully`,
      device,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create device" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const device_code = searchParams.get("device_code");

    if (!id && !device_code) {
      return NextResponse.json(
        { error: "Provide either ?id= or ?device_code= to remove a device" },
        { status: 400 }
      );
    }

    let query = supabase.from("devices") as any;
    let result;

    if (id) {
      result = await query.delete().eq("id", id);
    } else if (device_code) {
      result = await query.delete().eq("device_code", device_code);
    }

    if (result?.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Device removed successfully",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to remove device" }, { status: 500 });
  }
}
