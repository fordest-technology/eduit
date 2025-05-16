import { getServerSession } from "./session";
import { UserRole } from "@prisma/client";

export async function getSession() {
  const session = await getServerSession();
  if (!session) return null;

  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role as UserRole,
    schoolId: session.schoolId,
    profileImage: session.profileImage,
  };
}

export const authOptions = {
  authorize: async (request: Request) => {
    const session = await getServerSession();
    return session?.role === UserRole.SCHOOL_ADMIN;
  },
};
