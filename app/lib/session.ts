import { Session } from "./types/auth";

export async function getServerSession(): Promise<Session | null> {
  const response = await fetch("/api/auth/session");
  if (!response.ok) return null;

  const data = await response.json();
  return data;
}
