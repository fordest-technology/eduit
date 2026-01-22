import { getSession } from "@/lib/auth"
import { DashboardContent } from "@/components/dashboard-content"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/db"
import { BillingLock } from "./_components/billing-lock"

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    return null 
  }

  // Check Billing Status for non-super admins
  if (session.schoolId && session.role !== UserRole.SUPER_ADMIN) {
    const school = await prisma.school.findUnique({
        where: { id: session.schoolId },
        select: { billingStatus: true }
    });
    
    if (school?.billingStatus === 'BLOCKED') {
        return <BillingLock />;
    }
  }

  const userData = {
    role: session.role as any,
    name: session.name || "",
    profileImage: session.profileImage || null,
    permissions: session.permissions
  }

  return <DashboardContent session={userData}>{children}</DashboardContent>
}
