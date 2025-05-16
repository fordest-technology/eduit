import { UserRole } from "@prisma/client";

// Re-export UserRole from Prisma
export { UserRole };

// Add any additional auth-related types here
export interface Session {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId: string | null;
  profileImage: string | null;
}
