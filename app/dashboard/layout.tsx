import { getSession } from "@/lib/auth"
import { DashboardContent } from "@/components/dashboard-content"
import { UserRole } from "@prisma/client"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    return null // or redirect to login
  }

  // Map the session data to match the expected types
  const userRoleMapping: Record<string, UserRole> = {
    "super_admin": UserRole.SUPER_ADMIN,
    "school_admin": UserRole.SCHOOL_ADMIN,
    "teacher": UserRole.TEACHER,
    "student": UserRole.STUDENT,
    "parent": UserRole.PARENT
  };

  const userData = {
    role: userRoleMapping[session.role] || UserRole.SCHOOL_ADMIN,
    name: session.name,
    profileImage: session.profileImage
  }

  return <DashboardContent session={userData}>{children}</DashboardContent>
}

