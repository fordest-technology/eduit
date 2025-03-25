import { CreditCard, GraduationCap, Bell, Users, Calendar, BookOpen, UserCheck, BookText } from "lucide-react"
import { DashboardHeader } from "../components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { Result, Event } from "@prisma/client"
import { cn } from "@/lib/utils"
import AdminDashboardClient from "./admin-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ParentDashboard } from "./parent/_components/parent-dashboard"
import { UpcomingEvents } from "./upcoming-events"

// Define interface for dashboard stats
interface DashboardStats {
  totalStudents: number
  totalClasses: number
  totalTeachers: number
  totalSubjects: number
  attendanceRate: number
  averageScore: number
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
    averageScore: 0
  }

  // Initialize other dashboard data
  let recentActivities: ResultWithDetails[] = []
  let upcomingEvents: Event[] = []
  let children: any[] = []
  let pendingPayments = 0

  try {
    // Fetch comprehensive dashboard stats using Prisma
    const dashboardStats = await prisma.$transaction(async (prisma) => {
      // Fetch total students
      const totalStudents = await prisma.student.count({
        where: { user: { schoolId: session.schoolId } }
      })

      // Fetch total teachers
      const totalTeachers = await prisma.teacher.count({
        where: { user: { schoolId: session.schoolId } }
      })

      // Fetch total classes
      const totalClasses = await prisma.class.count({
        where: { schoolId: session.schoolId }
      })

      // Fetch total subjects
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

      // Calculate average score
      const averageScoreResult = await prisma.result.aggregate({
        where: {
          student: {
            user: { schoolId: session.schoolId }
          }
        },
        _avg: { marks: true }
      })

      return {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        attendanceRate: Number(attendanceRate.toFixed(2)),
        averageScore: Number(averageScoreResult._avg.marks?.toFixed(2) || 0)
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
    <div className="space-y-6">
      <DashboardHeader
        heading={roleTitle}
        text={roleDescription}
        showBanner={true}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-blue-700">
              <Users className="mr-2 h-5 w-5" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-800">{stats.totalStudents}</p>
            <p className="text-sm text-blue-600 mt-1">Active students in your school</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-purple-700">
              <GraduationCap className="mr-2 h-5 w-5" />
              Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-800">{stats.totalClasses}</p>
            <p className="text-sm text-purple-600 mt-1">Total classes across all levels</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
              <BookOpen className="mr-2 h-5 w-5" />
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-800">{stats.totalSubjects}</p>
            <p className="text-sm text-emerald-600 mt-1">Subjects taught in your school</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Dashboard or Regular Stats */}
      {(session.role === "SUPER_ADMIN" || session.role === "SCHOOL_ADMIN") ? (
        <AdminDashboardClient stats={stats} />
      ) : null}

      {/* Recent Activities and Events */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 border-primary/10 shadow-sm">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates and activities</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivities.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">No recent activities</p>
              </div>
            ) : (
              <div className="divide-y divide-primary/10">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center p-4 hover:bg-primary/5 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.student.user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Scored {activity.marks}/{activity.totalMarks} in {activity.subject.name}
                      </p>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {format(new Date(activity.updatedAt), "MMM d, yyyy")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-secondary/10 shadow-sm">
          <CardHeader className="bg-secondary/5 border-b border-secondary/10">
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Schedule and important dates</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <UpcomingEvents
              schoolId={session.schoolId}
              limit={5}
              showIcon={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Meta Information */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-base">School Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Attendance Rate</h4>
              <p className="font-medium">{stats.attendanceRate}%</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Average Score</h4>
              <p className="font-medium">{stats.averageScore}%</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Teachers</h4>
              <p className="font-medium">{stats.totalTeachers}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}