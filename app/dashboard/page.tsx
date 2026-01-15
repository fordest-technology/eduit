import { CreditCard, GraduationCap, Bell, LayoutDashboard, Layers, Users, Calendar, BookOpen, UserCheck, BookText, Wallet, Coins } from "lucide-react"
import { DashboardHeader } from "../components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { Result, Event } from "@prisma/client"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import { hasPermission } from "@/lib/permissions"

const AdminDashboardClient = dynamic(() => import("./admin-client"))
const ParentDashboard = dynamic(() => import("./parent/_components/parent-dashboard").then(mod => mod.ParentDashboard))
const TeacherDashboard = dynamic(() => import("./_components/teacher-dashboard"))
const UpcomingEvents = dynamic(() => import("./upcoming-events").then(mod => mod.UpcomingEvents))


// Define interface for dashboard stats
interface DashboardStats {
  totalStudents: number
  totalClasses: number
  totalTeachers: number
  totalSubjects: number
  attendanceRate: number
  averageScore: number
  totalSessions: number
  totalLevels: number
  walletBalance?: number
  pendingPayments?: number
}


// Enhanced type for results with more details
interface ResultWithDetails extends Result {
  student: {
    user: {
      name: string | null
    }
  }
  subject: {
    name: string | null
  }
}

export default async function DashboardPage() {
  // Get user session
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Initialize default stats
  let stats: DashboardStats = {
    totalStudents: 0,
    totalClasses: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    attendanceRate: 0,
    averageScore: 0,
    totalSessions: 0,
    totalLevels: 0,
    walletBalance: 0,
    pendingPayments: 0
  }

  // Initialize other dashboard data
  let recentActivities: ResultWithDetails[] = []
  let upcomingEvents: any[] = []
  let children: any[] = []
  let pendingPayments = 0

  // Check permissions
  const perms = session.permissions;
  const isSuperAdmin = session.role === "SUPER_ADMIN";
  const isSchoolAdmin = session.role === "SCHOOL_ADMIN";
  // Legacy full access if no permissions defined for school admin
  const hasFullAccess = isSuperAdmin || (isSchoolAdmin && (!perms || (Array.isArray(perms) && perms.length === 0)));

  const canViewFinance = hasFullAccess || hasPermission(perms, "view_fees") || hasPermission(perms, "manage_fees") || hasPermission(perms, "view_wallet") || hasPermission(perms, "manage_wallet");
  const canViewStudents = hasFullAccess || hasPermission(perms, "view_students") || hasPermission(perms, "manage_students");
  const canViewTeachers = hasFullAccess || hasPermission(perms, "view_teachers") || hasPermission(perms, "manage_teachers");
  const canViewClasses = hasFullAccess || hasPermission(perms, "manage_classes");
  const canViewSubjects = hasFullAccess || hasPermission(perms, "manage_subjects");
  const canViewResults = hasFullAccess || hasPermission(perms, "view_results");
  const canViewAcademics = canViewClasses || canViewSubjects || canViewResults || hasPermission(perms, "manage_levels");

  try {
    // Fetch comprehensive dashboard stats using Prisma
    const dashboardStats = await prisma.$transaction(async (tx) => {
      // Basic counts
      const totalStudents = await tx.student.count({
        where: { user: { schoolId: session.schoolId } }
      })
      const totalTeachers = await tx.teacher.count({
        where: { user: { schoolId: session.schoolId } }
      })
      const totalClasses = await tx.class.count({
        where: { schoolId: session.schoolId }
      })
      const totalSubjects = await tx.subject.count({
        where: { schoolId: session.schoolId }
      })

      // Calculate attendance rate
      const totalAttendanceRecords = await tx.attendance.count({
        where: {
          student: {
            user: { schoolId: session.schoolId }
          }
        }
      })

      const presentAttendanceRecords = await tx.attendance.count({
        where: {
          student: {
            user: { schoolId: session.schoolId }
          },
          status: 'PRESENT'
        }
      })

      const attendanceRate = totalAttendanceRecords > 0
        ? (presentAttendanceRecords / totalAttendanceRecords) * 100
        : 0

      // Financials (Wallet and Fees)
      const wallet = await tx.schoolWallet.findUnique({
        where: { schoolId: session.schoolId }
      })

      const totalSessions = await tx.academicSession.count({
        where: { schoolId: session.schoolId }
      })

      const totalLevels = await tx.schoolLevel.count({
        where: { schoolId: session.schoolId },
      })

      return {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        attendanceRate,
        totalSessions,
        totalLevels,
        walletBalance: wallet ? Number(wallet.balance) : 0,
        pendingPayments: 0 // Will fetch below if parent
      }
    }, {
      timeout: 10000 // Increase timeout to 10s
    })

    stats = {
      ...stats,
      ...dashboardStats,
      averageScore: 0 // Placeholder
    }

    // Role-specific data fetching
    if (session.role === "PARENT") {
      children = await prisma.student.findMany({
        where: {
          parents: {
            some: {
              parentId: session.id
            }
          }
        },
        include: {
          user: true,
          class: true
        }
      })

      const studentIds = children.map(child => child.id)
      
      const results = await prisma.result.findMany({
        where: {
          studentId: { in: studentIds }
        },
        include: {
          student: { include: { user: true } },
          subject: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      })

      recentActivities = results as any

      // Calculate pending payments
      const bills = await prisma.bill.findMany({
        where: {
          schoolId: session.schoolId,
          OR: [
            {
              assignments: {
                some: {
                  targetType: "STUDENT",
                  targetId: { in: studentIds }
                }
              }
            },
            {
              assignments: {
                some: {
                  targetType: "CLASS",
                  targetId: {
                    in: children.map(child => child.class?.id).filter(Boolean)
                  }
                }
              }
            }
          ]
        },
        include: {
          assignments: {
            include: { studentPayments: true }
          }
        }
      })

      pendingPayments = bills.reduce((total, bill) => {
        return total + bill.assignments.reduce((assignmentTotal, assignment) => {
          return assignmentTotal + (assignment.studentPayments?.length || 0)
        }, 0)
      }, 0)
    } else {
      // For admins, fetch activities only if they can see results/academics
      if (canViewResults || hasFullAccess) {
        const results = await prisma.result.findMany({
          where: {
            student: {
              user: { schoolId: session.schoolId }
            }
          },
          include: {
            student: { include: { user: true } },
            subject: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 5
        })
        recentActivities = results as any
      }
    }

    // Fetch upcoming events for all roles
    upcomingEvents = await prisma.event.findMany({
      where: {
        schoolId: session.schoolId,
        startDate: { gt: new Date() }
      },
      orderBy: { startDate: 'asc' },
      take: 5
    })

  } catch (error) {
    console.error("Error fetching dashboard data:", error)
  }

  // Get role-specific title and description
  const roleTitle = {
    SUPER_ADMIN: "Super Admin Dashboard",
    SCHOOL_ADMIN: "School Admin Dashboard",
    TEACHER: "Teacher Dashboard",
    PARENT: "Parent Dashboard",
    STUDENT: "Student Dashboard"
  }[session.role] || "Welcome to your dashboard"

  const roleDescription = {
    SUPER_ADMIN: "Manage all schools and system settings",
    SCHOOL_ADMIN: "Manage your school's settings and users",
    TEACHER: "View your classes and student performance",
    STUDENT: "Track your academic progress",
    PARENT: "Monitor your children's academic journey"
  }[session.role] || "Welcome to your dashboard"

  // Render teacher dashboard
  if (session.role === "TEACHER") {
    return <TeacherDashboard />
  }

  // Render parent dashboard
  if (session.role === "PARENT") {
    return (
      <ParentDashboard
        data={{
          children: children,
          bills: [],
          paymentAccounts: [],
          paymentRequests: [],
          paymentHistory: [],
          approvedResults: recentActivities,
          upcomingEvents: upcomingEvents,
          stats: {
            totalBilled: 0,
            totalPaid: 0,
            pendingPayments: pendingPayments,
            approvedPayments: 0,
            remainingBalance: 0
          }
        }}
      />
    )
  }

  // BUILD DYNAMIC STAT CARDS
  const statsCards = [];

  if (canViewFinance) {
    statsCards.push({
      title: "Wallet Balance",
      value: `₦${stats.walletBalance?.toLocaleString()}`,
      icon: Wallet,
      color: "emerald",
      desc: "Current funds"
    });
    statsCards.push({
      title: "Pending Fees",
      value: stats.pendingPayments || 0,
      icon: Coins,
      color: "rose",
      desc: "Unpaid assignments"
    });
  }

  if (canViewStudents) {
    statsCards.push({
      title: "Students",
      value: stats.totalStudents,
      icon: Users,
      color: "blue",
      desc: "Active enrollments"
    });
  }

  if (canViewTeachers) {
    statsCards.push({
      title: "Teachers",
      value: stats.totalTeachers,
      icon: UserCheck,
      color: "rose",
      desc: "Active educators"
    });
  }

  if (canViewClasses) {
    statsCards.push({
      title: "Classes",
      value: stats.totalClasses,
      icon: GraduationCap,
      color: "purple",
      desc: "Total sections"
    });
  }

  if (canViewSubjects) {
    statsCards.push({
      title: "Subjects",
      value: stats.totalSubjects,
      icon: BookOpen,
      color: "emerald",
      desc: "Course offerings"
    });
  }

  // Default fallback if no permissions selected to avoid empty dashboard
  if (statsCards.length === 0 && !isSuperAdmin) {
    statsCards.push({
      title: "Welcome",
      value: "EduIT",
      icon: LayoutDashboard,
      color: "blue",
      desc: "School Portal ready"
    });
  }

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

      {/* {(session.role === "SCHOOL_ADMIN" || session.role === "SUPER_ADMIN") && (
        <BillingStatus />
      )} */}

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, i) => (
          <Card key={i} className="group overflow-hidden border-none shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 rounded-[2rem] bg-white relative">
            <div className={cn(
              "absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 rounded-full transition-all duration-500 group-hover:scale-150 group-hover:opacity-20",
              stat.color === 'emerald' ? "bg-emerald-500" :
                stat.color === 'rose' ? "bg-rose-500" :
                  stat.color === 'blue' ? "bg-blue-500" :
                    "bg-purple-500"
            )} />
            <CardHeader className="pb-2 relative z-10">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "p-3 rounded-2xl shadow-inner",
                  stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                    stat.color === 'purple' ? "bg-purple-50 text-purple-600" :
                      stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                        "bg-rose-50 text-rose-600"
                )}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-4">
                {stat.title}
              </CardDescription>
              <CardTitle className="text-4xl font-black font-sora text-slate-800 tracking-tight">
                {stat.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center text-xs font-semibold text-slate-500">
                <span>{stat.desc}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 mt-8">
        {/* Recent Activities Section - Only show if canViewResults or Full Access */}
        {(canViewResults || hasFullAccess) && (
          <Card className="lg:col-span-8 border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold font-sora text-slate-800">Recent Activities</CardTitle>
                  <CardDescription className="font-medium text-slate-500">Live updates from across the institution</CardDescription>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <Bell className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-2">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                  <p className="text-slate-400 font-medium">No recent activities available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center p-5 rounded-3xl bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-black/5 border border-transparent hover:border-slate-100 transition-all duration-300 group"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mr-4 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                        <BookText className="h-6 w-6 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 font-sora truncate">
                          {activity.student?.user?.name || "Unknown Student"}
                        </p>
                        <p className="text-sm text-slate-500 font-medium">
                          Scored <span className="text-indigo-600 font-bold">{activity.total}</span> in <span className="text-slate-700">{activity.subject?.name || "Unknown Subject"}</span>
                        </p>
                      </div>
                      <div className="ml-4 text-xs font-bold text-slate-400 whitespace-nowrap bg-white px-3 py-1.5 rounded-full border border-slate-100">
                        {format(new Date(activity.updatedAt), "MMM d")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events Section - Visible to all */}
        <Card className={cn(
          "border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden relative",
          (canViewResults || hasFullAccess) ? "lg:col-span-4" : "lg:col-span-12"
        )}>
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500/50" />
          <CardHeader className="px-8 pt-8 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold font-sora text-slate-800">Timeline</CardTitle>
                <CardDescription className="font-medium text-slate-500">Upcoming calendar events</CardDescription>
              </div>
              <div className="p-2 bg-amber-50 rounded-xl">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-8 pt-2">
            <div className="bg-slate-50/50 rounded-[2rem] p-4 text-slate-600">
              <UpcomingEvents
                schoolId={session.schoolId}
                limit={5}
                showIcon={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Performance Stats Section - Only for Academics/Super Admins */}
      {(canViewAcademics || hasFullAccess) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <UserCheck className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold font-sora text-slate-800">Attendance Optimization</h4>
                <p className="text-sm text-slate-500 font-medium">Daily average attendance rate</p>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black text-slate-800 font-sora">{stats.attendanceRate}%</span>
              <div className="mb-1.5 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${stats.attendanceRate}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <Layers className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold font-sora text-slate-800">Academic Excellence</h4>
                <p className="text-sm text-slate-500 font-medium">Average school-wide performance</p>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black text-slate-800 font-sora">{stats.averageScore}%</span>
              <div className="mb-1.5 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${stats.averageScore}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}