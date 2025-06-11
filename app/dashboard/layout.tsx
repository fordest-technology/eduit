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

  // The session already has the correct role format, no need for mapping
  const userData = {
    role: session.role,
    name: session.name,
    profileImage: session.profileImage
  }

  return <DashboardContent session={userData}>{children}</DashboardContent>
}

