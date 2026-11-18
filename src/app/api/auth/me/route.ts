import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const serverSupabase = await createClient();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null, profile: null }, { status: 200 });
    }

    const adminClient = createAdminClient();
    const { data: memberData } = await (adminClient
      .from("memberships") as any)
      .select("role, factory_id, factories(name)")
      .eq("user_id", user.id)
      .maybeSingle();

    const email = (user.email || "").toLowerCase();
    const fallbackRole = email.startsWith("admin")
      ? "admin"
      : email.startsWith("manager")
      ? "manager"
      : "viewer";

    const role = (
      memberData?.role ||
      user.user_metadata?.role ||
      fallbackRole
    ).toLowerCase();

    const fullName =
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Factory User";

    const factoryId =
      memberData?.factory_id ||
      user.user_metadata?.factory_id ||
      "22222222-2222-2222-2222-222222222222";

    const factoryName =
      memberData?.factories?.name ||
      user.user_metadata?.factory_name ||
      "Ingestre Tea Factory KVPL";

    return NextResponse.json({
      user,
      profile: {
        id: user.id,
        full_name: fullName,
        email: user.email || "",
        role,
        factory_id: factoryId,
        factory_name: factoryName,
        status: "active",
        created_at: user.created_at || new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load profile" },
      { status: 500 }
    );
  }
}
