import { BarChart3, BookOpen, Calendar, Users } from "lucide-react"
import { DashboardHeader } from "../components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { Result, Event } from "@prisma/client"

interface DashboardStats {
  totalStudents: number
  totalClasses: number
  attendanceRate: number
  averageScore: number
}

interface ResultWithDetails extends Result {
  student: {
    name: string
  }
  subject: {
    name: string
  }
}

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  let stats: DashboardStats = {
    totalStudents: 0,
    totalClasses: 0,
    attendanceRate: 0,
    averageScore: 0
  }

  let recentActivities: ResultWithDetails[] = []
  let upcomingEvents: Event[] = []

  try {
    if (session.role === "teacher") {
      // Get current session first
      const currentSession = await prisma.academicSession.findFirst({
        where: {
          schoolId: session.schoolId,
          isCurrent: true,
        },
      })

      if (!currentSession) {
        throw new Error("No current academic session found")
      }

      // Get teacher's classes and subjects
      const teacherData = await prisma.user.findUnique({
        where: { id: session.id },
        include: {
          teacherClasses: {
            include: {
              students: {
                include: {
                  student: true
                }
              }
            }
          },
          teacherSubjects: {
            include: {
              subject: true
            }
          }
        }
      })

      if (!teacherData) {
        throw new Error("Teacher data not found")
      }

      // Count unique students across all classes
      const uniqueStudents = new Set(
        teacherData.teacherClasses.flatMap(cls =>
          cls.students.map(sc => sc.student.id)
        )
      )

      stats.totalStudents = uniqueStudents.size
      stats.totalClasses = teacherData.teacherClasses.length

      // Calculate attendance rate for teacher's students
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          sessionId: currentSession.id,
          student: {
            studentClass: {
              some: {
                classId: {
                  in: teacherData.teacherClasses.map(c => c.id)
                }
              }
            }
          }
        }
      })

      if (attendanceRecords.length > 0) {
        const presentCount = attendanceRecords.filter(
          record => record.status === "PRESENT" || record.status === "LATE"
        ).length
        stats.attendanceRate = Math.round((presentCount / attendanceRecords.length) * 100 * 10) / 10
      }

      // Get recent activities (results)
      const results = await prisma.result.findMany({
        where: {
          sessionId: currentSession.id,
          OR: [
            {
              subjectId: {
                in: teacherData.teacherSubjects.map(ts => ts.subject.id)
              }
            },
            {
              student: {
                studentClass: {
                  some: {
                    classId: {
                      in: teacherData.teacherClasses.map(c => c.id)
                    }
                  }
                }
              }
            }
          ]
        },
        include: {
          student: {
            select: {
              name: true
            }
          },
          subject: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 5
      })

      if (results.length > 0) {
        const totalPercentage = results.reduce((sum, result) => {
          return sum + (result.marks / result.totalMarks) * 100
        }, 0)
        stats.averageScore = Math.round((totalPercentage / results.length) * 10) / 10
      }

      recentActivities = results

      // Get upcoming events
      const events = await prisma.event.findMany({
        where: {
          schoolId: session.schoolId,
          endDate: {
            gte: new Date()
          }
        },
        orderBy: {
          startDate: 'asc'
        },
        take: 5
      })

      upcomingEvents = events
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
  }

  // Get role-specific title and description
  const roleTitle = {
    super_admin: "Super Admin Dashboard",
    school_admin: "School Admin Dashboard",
    teacher: "Teacher Dashboard",
    student: "Student Dashboard",
    parent: "Parent Dashboard"
  }[session.role] || "Dashboard"

  const roleDescription = {
    super_admin: "Manage all schools and system settings",
    school_admin: "Manage your school's settings and users",
    teacher: "View your classes and student performance",
    student: "Track your academic progress",
    parent: "Monitor your child's academic journey"
  }[session.role] || "Welcome to your dashboard"

  return (
    <>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DashboardHeader heading={roleTitle} text={roleDescription} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Classes
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClasses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Rate
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.attendanceRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageScore.toFixed(1)}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              {recentActivities.map((activity: any) => (
                <div key={activity.id} className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                  <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.student.name} - {activity.subject.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Score: {activity.marks}/{activity.totalMarks} ({format(new Date(activity.createdAt), 'MMM d, yyyy')})
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.map((event: any) => (
                <div key={event.id} className="mb-4 last:mb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {event.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.startDate), 'MMM d, yyyy')}
                      {event.location && ` - ${event.location}`}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

