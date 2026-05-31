import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface TeamMemberInfo {
  id: number;
  fullName: string;
  username: string;
  whatsapp: string;
  status: string;
  createdAt: string;
  // Store profile fields
  displayName: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  coverImageUrl: string | null;
}

interface MeResponse {
  authenticated: boolean;
  forcePasswordChange?: boolean;
  member?: TeamMemberInfo;
}

interface TeamAuthState {
  authenticated: boolean;
  isLoading: boolean;
  forcePasswordChange: boolean;
  member: TeamMemberInfo | null;
  login: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; forcePasswordChange?: boolean }>;
  logout: () => Promise<void>;
  refetch: () => void;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchTeamMe(): Promise<MeResponse> {
  const res = await fetch(`${BASE}/api/team/auth/me`, { credentials: "include" });
  if (res.status === 401) return { authenticated: false };
  if (!res.ok) return { authenticated: false };
  return res.json() as Promise<MeResponse>;
}

const TeamAuthContext = createContext<TeamAuthState | null>(null);

export function TeamAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["team-auth-me"],
    queryFn: fetchTeamMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await fetch(`${BASE}/api/team/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        forcePasswordChange?: boolean;
        member?: TeamMemberInfo;
      };
      if (res.ok && body.ok) {
        queryClient.setQueryData<MeResponse>(["team-auth-me"], {
          authenticated: true,
          forcePasswordChange: body.forcePasswordChange ?? false,
          member: body.member,
        });
        return { ok: true, forcePasswordChange: body.forcePasswordChange };
      }
      return { ok: false, error: body.error ?? "Login failed" };
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    await fetch(`${BASE}/api/team/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    queryClient.setQueryData<MeResponse>(["team-auth-me"], { authenticated: false });
  }, [queryClient]);

  return (
    <TeamAuthContext.Provider
      value={{
        authenticated: data?.authenticated ?? false,
        isLoading,
        forcePasswordChange: data?.forcePasswordChange ?? false,
        member: data?.member ?? null,
        login,
        logout,
        refetch: () => { void refetch(); },
      }}
    >
      {children}
    </TeamAuthContext.Provider>
  );
}

export function useTeamAuth(): TeamAuthState {
  const ctx = useContext(TeamAuthContext);
  if (!ctx) throw new Error("useTeamAuth must be used within TeamAuthProvider");
  return ctx;
}
