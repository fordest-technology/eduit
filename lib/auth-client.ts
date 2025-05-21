export type UserRole =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string;
  profileImage?: string;
}

// Client-side session getter
export async function getSession(): Promise<UserSession | null> {
  try {
    const response = await fetch("/api/auth/session");

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error("Failed to fetch session");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}
