import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AdminAuthState {
  authenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refetch: () => void;
}

const BASE = ((import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL) as string).replace(/\/+$/, "");

async function fetchMe(): Promise<{ authenticated: boolean }> {
  const res = await fetch(`${BASE}/api/auth/me`, { credentials: "include" });
  if (res.status === 401) return { authenticated: false };
  if (!res.ok) return { authenticated: false };
  return res.json() as Promise<{ authenticated: boolean }>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-auth-me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  const login = useCallback(async (password: string) => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = await res.json() as { ok?: boolean; error?: string };
    if (res.ok && body.ok) {
      queryClient.setQueryData(["admin-auth-me"], { authenticated: true });
      return { ok: true };
    }
    return { ok: false, error: body.error ?? "Login failed" };
  }, [queryClient]);

  const logout = useCallback(async () => {
    queryClient.setQueryData(["admin-auth-me"], { authenticated: false });
    fetch(`${BASE}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => null);
  }, [queryClient]);

  return (
    <AdminAuthContext.Provider
      value={{
        authenticated: data?.authenticated ?? false,
        isLoading,
        login,
        logout,
        refetch,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
