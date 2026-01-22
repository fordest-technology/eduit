import { Suspense } from "react"
import { LayoutDashboard, School as SchoolIcon, Activity, Coins } from "lucide-react"
import { DashboardHeader } from "../components/dashboard-header"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import dynamic from "next/dynamic"
import { prisma } from "@/lib/db"

// New server components for PPR
import { DashboardStatsSection, StatsSkeleton } from "./_components/dashboard-stats-server"
import { RecentActivitiesSection, ActivitiesSkeleton } from "./_components/recent-activities-server"

const TeacherDashboard = dynamic(() => import("./_components/teacher-dashboard"))
const ParentDashboardLoading = () => <div className="p-8"><StatsSkeleton /></div>
const ParentDashboard = dynamic(() => import("./parent/_components/parent-dashboard").then(mod => mod.ParentDashboard), {
  loading: ParentDashboardLoading
})
const StudentDashboard = dynamic(() => import("./_components/student-dashboard"))
const UpcomingEvents = dynamic(() => import("./upcoming-events").then(mod => mod.UpcomingEvents))
const SuperAdminDashboard = dynamic(() => import("./_components/super-admin-dashboard").then(mod => mod.SuperAdminDashboard))

export default async function DashboardPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const session = await getSession()
  const show = searchParams.show as string | undefined;

  if (!session) {
    redirect("/login")
  }

  // Super Admin specific dashboard
  if (session.role === "SUPER_ADMIN") {
    const titles: Record<string, { h: string, t: string, i: any }> = {
      schools: { h: "Institutional Ledger", t: "Global governance of all onboarded schools", i: <SchoolIcon className="h-8 w-8 text-white" /> },
      analytics: { h: "Global Performance Index", t: "System-wide academic success and health analytics", i: <Activity className="h-8 w-8 text-white" /> },
      revenue: { h: "Financial Control Center", t: "Real-time usage billing and revenue monitoring", i: <Coins className="h-8 w-8 text-white" /> },
      default: { h: "System Control Center", t: "Global oversight and institutional governance", i: <LayoutDashboard className="h-8 w-8 text-white" /> }
    };

    const currentHeader = titles[show || "default"] || titles.default;

    return (
      <div className="flex-1 space-y-8 p-8 pt-6 min-h-screen bg-slate-50/50 relative overflow-hidden">
         {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-50/50 rounded-full blur-3xl -z-10 -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-50/50 rounded-full blur-3xl -z-10 -ml-64 -mb-64" />

        <DashboardHeader
          heading={currentHeader.h}
          text={currentHeader.t}
          showBanner={true}
          variant="brand"
          icon={currentHeader.i}
        />
        <SuperAdminDashboard />
      </div>
    )
  }

  // Teacher specific dashboard
  if (session.role === "TEACHER") {
    return <TeacherDashboard />
  }

  // Parent specific dashboard
  if (session.role === "PARENT") {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.id },
      include: {
        children: {
          include: {
            student: {
              include: {
                user: { select: { name: true, profileImage: true } },
                classes: {
                  include: { class: true },
                  where: { session: { isCurrent: true } },
                  take: 1
                }
              }
            }
          }
        }
      }
    })

    const childrenIds = parent?.children.map(c => c.studentId) || []

    // Get fee stats for all children
    const billAssignments = await prisma.billAssignment.findMany({
      where: {
        AND: [
          { targetType: 'STUDENT', targetId: { in: childrenIds } },
          ...(session.schoolId ? [{ bill: { schoolId: session.schoolId } }] : [])
        ]
      },
      include: {
        bill: true,
        studentPayments: true
      }
    })

    const stats = billAssignments.reduce((acc, curr) => {
      acc.totalBilled += curr.bill.amount
      const paid = curr.studentPayments.reduce((pAcc, p) => pAcc + p.amountPaid, 0)
      acc.totalPaid += paid
      if (curr.status === 'PENDING') acc.pendingPayments++
      return acc
    }, { totalBilled: 0, totalPaid: 0, pendingPayments: 0 })

    return <ParentDashboard data={{
      children: parent?.children.map(c => ({
        id: c.student.id,
        name: c.student.user.name,
        profileImage: c.student.user.profileImage,
        class: c.student.classes[0]?.class.name
      })) || [],
      stats: {
        ...stats,
        approvedPayments: billAssignments.filter(b => b.status === 'PAID').length,
        remainingBalance: stats.totalBilled - stats.totalPaid
      }
    }} />
  }

  // Student specific dashboard
  if (session.role === "STUDENT") {
    return <StudentDashboard />
  }

  const roleTitle = {
    SUPER_ADMIN: "Super Admin Dashboard",
    SCHOOL_ADMIN: "School Admin Dashboard",
    STUDENT: "Student Dashboard"
  }[session.role] || "Welcome to your dashboard"

  const roleDescription = {
    SUPER_ADMIN: "Manage all schools and system settings",
    SCHOOL_ADMIN: "Manage your school's settings and users",
    STUDENT: "Track your academic progress",
  }[session.role] || "Welcome to your dashboard"

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 min-h-screen bg-slate-50/50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -z-10 -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl -z-10 -ml-64 -mb-64" />

      <DashboardHeader
        heading={roleTitle}
        text={roleDescription}
        showBanner={true}
        icon={<LayoutDashboard className="h-8 w-8 text-white" />}
      />

      {/* Stats Cards Section - PRE-RENDERED SHELL WITH STREAMED DATA */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStatsSection />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-12 mt-8">
        <Suspense fallback={<ActivitiesSkeleton />}>
          <RecentActivitiesSection />
        </Suspense>

        {/* Timeline - Also streamed */}
        <div className="lg:col-span-4 border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden relative min-h-[400px]">
          <Suspense fallback={<div className="p-8 space-y-4"><div className="h-8 w-1/2 bg-slate-100 animate-pulse rounded" /><div className="h-64 bg-slate-50 animate-pulse rounded-2xl" /></div>}>
            <div className="p-8">
              <UpcomingEvents
                schoolId={session.schoolId || undefined}
                limit={5}
                showIcon={true}
              />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  )
}