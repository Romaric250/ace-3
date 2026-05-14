import { getSession } from "@/lib/get-session";

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  return session.user;
}
