import type { Workout } from "../types/workout";

export type AuthUser = {
  id: string;
  displayName: string;
  pictureUrl?: string;
};

const configuredBaseUrl = import.meta.env.VITE_WORKOUT_API_URL as
  | string
  | undefined;

export const apiBaseUrl = configuredBaseUrl?.replace(/\/$/, "") ?? "";

export const isRemoteApiConfigured = apiBaseUrl.length > 0;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchCurrentUser() {
  return apiFetch<{ user: AuthUser | null }>("/api/me");
}

export async function logoutRemoteUser() {
  return apiFetch<{ ok: true }>("/api/logout", { method: "POST" });
}

export async function fetchRemoteWorkouts() {
  return apiFetch<{ workouts: Workout[] }>("/api/workouts");
}

export async function saveRemoteWorkouts(workouts: Workout[]) {
  return apiFetch<{ ok: true }>("/api/workouts", {
    method: "PUT",
    body: JSON.stringify({ workouts }),
  });
}

export function lineLoginUrl(returnTo = window.location.href) {
  const url = new URL(`${apiBaseUrl}/auth/line/start`);
  url.searchParams.set("return_to", returnTo);
  return url.toString();
}
