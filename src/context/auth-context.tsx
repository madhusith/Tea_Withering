"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserRole, UserProfile } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isManager: boolean;
  isViewer: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const defaultProfile: UserProfile = {
  id: "usr-default",
  full_name: "Rohan P. (Factory Manager)",
  email: "manager@kelanivalley.com",
  role: "manager",
  factory_id: "22222222-2222-2222-2222-222222222222",
  factory_name: "Ingestre Tea Factory KVPL",
  status: "active",
  created_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(defaultProfile);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserProfile = useCallback(async (supabaseUser: any) => {
    if (!supabaseUser) {
      setUser(null);
      setProfile(defaultProfile);
      setLoading(false);
      return;
    }

    setUser(supabaseUser);
    const supabase = createClient();

    try {
      const { data: memberData } = await (supabase
        .from("memberships") as any)
        .select("role, factory_id, factories(name)")
        .eq("user_id", supabaseUser.id)
        .maybeSingle();

      const role: UserRole =
        (memberData?.role as UserRole) ||
        (supabaseUser.user_metadata?.role as UserRole) ||
        "manager";

      const fullName =
        supabaseUser.user_metadata?.full_name ||
        memberData?.factories?.name ||
        supabaseUser.email?.split("@")[0] ||
        "Factory User";

      const factoryId =
        memberData?.factory_id ||
        supabaseUser.user_metadata?.factory_id ||
        "22222222-2222-2222-2222-222222222222";

      const factoryName =
        memberData?.factories?.name ||
        supabaseUser.user_metadata?.factory_name ||
        "Ingestre Tea Factory KVPL";

      setProfile({
        id: supabaseUser.id,
        full_name: fullName,
        email: supabaseUser.email || "",
        role: role,
        factory_id: factoryId,
        factory_name: factoryName,
        status: "active",
        created_at: supabaseUser.created_at || new Date().toISOString(),
      });
    } catch {
      // Fallback to metadata
      setProfile({
        id: supabaseUser.id,
        full_name: supabaseUser.user_metadata?.full_name || "Factory Manager",
        email: supabaseUser.email || "manager@kelanivalley.com",
        role: (supabaseUser.user_metadata?.role as UserRole) || "manager",
        factory_id: "22222222-2222-2222-2222-222222222222",
        factory_name: "Ingestre Tea Factory KVPL",
        status: "active",
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Check active session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchUserProfile(user);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setUser(null);
        setProfile(defaultProfile);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      setUser(data.user);
      if (data.profile) {
        setProfile(data.profile);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error during login" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(defaultProfile);
      toast.info("Signed out successfully.");
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      admin: "admin@kelanivalley.com",
      manager: "manager@kelanivalley.com",
      viewer: "viewer@kelanivalley.com",
    };
    const email = emailMap[targetRole];
    const password = "Password123!";

    const result = await login(email, password);
    if (result.success) {
      toast.success(`Switched role to ${targetRole.toUpperCase()}`);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to switch role");
    }
  };

  const currentRole = profile?.role || "manager";
  const isAdmin = currentRole === "admin";
  const isManager = currentRole === "manager";
  const isViewer = currentRole === "viewer";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: currentRole,
        isAdmin,
        isManager,
        isViewer,
        loading,
        login,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

