import { getServerSession } from "./session";

export async function getAuthSession() {
  const session = await getServerSession();
  if (!session) return null;

  return {
    user: {
      id: session.userId,
      schoolId: session.schoolId,
      role: session.role,
    },
  };
}

export const authOptions = {
  authorize: async (request: Request) => {
    const session = await getServerSession();
    return session?.user?.role === "SCHOOL_ADMIN";
  },
};
