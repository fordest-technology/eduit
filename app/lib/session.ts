export async function getServerSession() {
  const response = await fetch("/api/auth/session");
  if (!response.ok) return null;

  return response.json();
}
