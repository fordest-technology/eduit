import { Suspense } from "react"
import { LayoutDashboard } from "lucide-react"
import { DashboardHeader } from "../components/dashboard-header"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import dynamic from "next/dynamic"

// New server components for PPR
import { DashboardStatsSection, StatsSkeleton } from "./_components/dashboard-stats-server"
import { RecentActivitiesSection, ActivitiesSkeleton } from "./_components/recent-activities-server"

const TeacherDashboard = dynamic(() => import("./_components/teacher-dashboard"))
const ParentDashboardLoading = () => <div className="p-8"><StatsSkeleton /></div>
const ParentDashboard = dynamic(() => import("./parent/_components/parent-dashboard").then(mod => mod.ParentDashboard), {
    loading: ParentDashboardLoading
})
const UpcomingEvents = dynamic(() => import("./upcoming-events").then(mod => mod.UpcomingEvents))

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Teacher specific dashboard
  if (session.role === "TEACHER") {
    return <TeacherDashboard />
  }

  // Parent specific dashboard
  if (session.role === "PARENT") {
    // Note: Parent dashboard might need its own PPR refactor later if it's slow
    return <ParentDashboard data={{ children: [], bills: [], paymentAccounts: [], paymentRequests: [], paymentHistory: [], approvedResults: [], upcomingEvents: [], stats: { totalBilled: 0, totalPaid: 0, pendingPayments: 0, approvedPayments: 0, remainingBalance: 0 } }} />
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
                    schoolId={session.schoolId}
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