import { CreditCard, GraduationCap, Bell, LayoutDashboard, Layers, Users, Calendar, BookOpen, UserCheck, BookText } from "lucide-react"
import { DashboardHeader } from "../components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { Result, Event } from "@prisma/client"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

const AdminDashboardClient = dynamic(() => import("./admin-client"))
const ParentDashboard = dynamic(() => import("./parent/_components/parent-dashboard"))
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
    totalLevels: 0
  }

  // Initialize other dashboard data
  let recentActivities: ResultWithDetails[] = []
  let upcomingEvents: Event[] = []
  let children: any[] = []
  let pendingPayments = 0

  try {
    // Fetch comprehensive dashboard stats using Prisma
    const dashboardStats = await prisma.$transaction(async (prisma) => {
      const totalStudents = await prisma.student.count({
        where: { user: { schoolId: session.schoolId } }
      })
      const totalTeachers = await prisma.teacher.count({
        where: { user: { schoolId: session.schoolId } }
      })
      const totalClasses = await prisma.class.count({
        where: { schoolId: session.schoolId }
      })
      const totalSubjects = await prisma.subject.count({
        where: { schoolId: session.schoolId }
      })

      // Calculate attendance rate
      const totalAttendanceRecords = await prisma.attendance.count({
        where: {
          student: {
            user: { schoolId: session.schoolId }
          }
        }
      })

      const presentAttendanceRecords = await prisma.attendance.count({
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

      const totalSessions = await prisma.academicSession.count({
        where: { schoolId: session.schoolId }
      })

      const totalLevels = await prisma.schoolLevel.count({
        where: { schoolId: session.schoolId }
      })

      return {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        totalSessions,
        totalLevels,
        attendanceRate: Number(attendanceRate.toFixed(2)),
        averageScore: 0 // Remove average score logic for now
      }
    })

    // Update stats
    stats = dashboardStats

    // Handle role-specific additional data fetching
    if (session.role === 'PARENT') {
      const parentChildren = await prisma.studentParent.findMany({
        where: { parentId: session.id },
        include: {
          student: {
            include: {
              user: true,
              classes: { include: { class: true } }
            }
          }
        }
      })

      children = parentChildren.map(child => ({
        id: child.student.id,
        user: child.student.user,
        class: child.student.classes[0]?.class || null
      }))

      const studentIds = children.map(child => child.id)

      // Fetch recent activities (results)
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

      recentActivities = results

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
      // For other roles, fetch recent activities (results) for the school
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
      recentActivities = results
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

  // Default dashboard for other roles
  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-poppins pb-10">
      <DashboardHeader
        heading={roleTitle}
        text={roleDescription}
        showBanner={true}
        icon={<LayoutDashboard className="h-8 w-8 text-white" />}
      />


      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Students",
            value: stats.totalStudents,
            icon: Users,
            color: "blue",
            desc: "Active enrollments"
          },
          {
            title: "Classes",
            value: stats.totalClasses,
            icon: GraduationCap,
            color: "purple",
            desc: "Total sections"
          },
          {
            title: "Subjects",
            value: stats.totalSubjects,
            icon: BookOpen,
            color: "emerald",
            desc: "Course offerings"
          },
          {
            title: "Teachers",
            value: stats.totalTeachers,
            icon: UserCheck,
            color: "rose",
            desc: "Active educators"
          }
        ].map((stat, i) => (
          <Card key={i} className="group overflow-hidden border-none shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 rounded-[2rem] bg-white relative">
            <div className={cn(
              "absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 rounded-full transition-all duration-500 group-hover:scale-150 group-hover:opacity-20",
              `bg-${stat.color}-500`
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
        {/* Recent Activities Section */}
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
                        {activity.student.user.name}
                      </p>
                      <p className="text-sm text-slate-500 font-medium">
                        Scored <span className="text-indigo-600 font-bold">{activity.total}</span> in <span className="text-slate-700">{activity.subject.name}</span>
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

        {/* Upcoming Events Section */}
        <Card className="lg:col-span-4 border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden relative">
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

      {/* School Performance Stats Section */}
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
    </div>
  )
}