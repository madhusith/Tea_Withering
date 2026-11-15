import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminClient = createAdminClient();

    // 1. Check if user already exists in auth.users
    const { data: userList } = await adminClient.auth.admin.listUsers();
    let existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    // 2. If user doesn't exist, auto-provision demo account with appropriate role
    if (!existingUser) {
      let role: "admin" | "manager" | "viewer" = "viewer";
      let fullName = "Agronomy Quality Viewer";

      if (cleanEmail.startsWith("admin")) {
        role = "admin";
        fullName = "Rohan P. (Estate Admin)";
      } else if (cleanEmail.startsWith("manager")) {
        role = "manager";
        fullName = "Kavinda D. (Factory Manager)";
      } else {
        role = "viewer";
        fullName = "Saman K. (Quality Specialist)";
      }

      const { data: newUser, error: createError } =
        await adminClient.auth.admin.createUser({
          email: cleanEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            role: role,
          },
        });

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 400 }
        );
      }

      existingUser = newUser.user;

      // Ensure profile and membership records are present
      if (existingUser) {
        await (adminClient.from("profiles") as any).upsert({
          id: existingUser.id,
          full_name: fullName,
          email: cleanEmail,
          status: "ACTIVE",
        });

        await (adminClient.from("memberships") as any).upsert({
          user_id: existingUser.id,
          organization_id: "11111111-1111-1111-1111-111111111111",
          factory_id: "22222222-2222-2222-2222-222222222222",
          role: role,
        });
      }
    }

    // 3. Perform server-side sign-in to attach auth cookies to the response
    const serverSupabase = await createClient();
    const { data: signInData, error: signInError } =
      await serverSupabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 401 });
    }

    // 4. Fetch membership role
    const { data: membership } = await (serverSupabase
      .from("memberships") as any)
      .select("role, factory_id, factories(name)")
      .eq("user_id", signInData.user.id)
      .maybeSingle();

    const role = membership?.role || signInData.user.user_metadata?.role || "manager";
    const fullName = signInData.user.user_metadata?.full_name || "Factory User";
    const factoryId = membership?.factory_id || "22222222-2222-2222-2222-222222222222";
    const factoryName = membership?.factories?.name || "St. Clair Tea Estate";

    return NextResponse.json({
      success: true,
      user: signInData.user,
      session: signInData.session,
      profile: {
        id: signInData.user.id,
        full_name: fullName,
        email: cleanEmail,
        role: role,
        factory_id: factoryId,
        factory_name: factoryName,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Authentication failed" },
      { status: 500 }
    );
  }
}

