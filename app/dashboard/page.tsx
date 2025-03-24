import { CreditCard, GraduationCap, Bell, Users, Calendar } from "lucide-react"
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

interface DashboardStats {
  totalStudents: number
  totalClasses: number
  attendanceRate: number
  averageScore: number
  totalTeachers: number
  totalSubjects: number
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
    averageScore: 0,
    totalTeachers: 0,
    totalSubjects: 0
  }

  let recentActivities: ResultWithDetails[] = []
  let upcomingEvents: Event[] = []
  let children: any[] = []
  let pendingPayments = 0

  try {
    if (session.role === "parent") {
      // Fetch children linked to this parent
      const parentChildren = await prisma.studentParent.findMany({
        where: {
          parentId: session.id
        },
        include: {
          student: {
            include: {
              user: true,
              classes: {
                include: {
                  class: true
                }
              }
            }
          }
        }
      })

      children = parentChildren.map(child => ({
        id: child.student.id,
        user: child.student.user,
        class: child.student.classes[0]?.class || null
      }))

      // Fetch upcoming events
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

      // Fetch pending payments
      const studentIds = children.map(child => child.id)
      const bills = await prisma.bill.findMany({
        where: {
          schoolId: session.schoolId,
          assignments: {
            some: {
              OR: [
                {
                  targetType: "STUDENT",
                  targetId: {
                    in: studentIds
                  }
                },
                {
                  targetType: "CLASS",
                  targetId: {
                    in: children.flatMap(child =>
                      child.class ? [child.class.id] : []
                    )
                  }
                }
              ]
            }
          }
        },
        include: {
          assignments: {
            include: {
              studentPayments: {
                where: {
                  studentId: {
                    in: studentIds
                  }
                }
              }
            }
          }
        }
      })

      // Calculate pending payments
      pendingPayments = bills.reduce((total, bill) => {
        return total + bill.assignments.reduce((assignmentTotal, assignment) => {
          return assignmentTotal + assignment.studentPayments.length
        }, 0)
      }, 0)

      // Get recent activities (results)
      const results = await prisma.result.findMany({
        where: {
          studentId: {
            in: studentIds
          }
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

      recentActivities = results
    } else if (session.role === "teacher") {
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
    parent: "Monitor your children's academic journey"
  }[session.role] || "Welcome to your dashboard"

  if (session.role === "parent") {
    return (
      <div className="space-y-6">
        <DashboardHeader
          heading="Parent Dashboard"
          text="Welcome to your dashboard. Manage your children's education journey."
          showBanner={true}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                <Users className="mr-2 h-5 w-5" />
                My Children
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-800">{children.length}</p>
              <p className="text-sm text-blue-600 mt-1">Linked students</p>
              <Button asChild variant="link" className="p-0 h-auto mt-2 text-blue-700">
                <Link href="/dashboard/children">View Details</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center text-green-700">
                <CreditCard className="mr-2 h-5 w-5" />
                Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-800">{pendingPayments}</p>
              <p className="text-sm text-green-600 mt-1">Pending payments</p>
              <Button asChild variant="link" className="p-0 h-auto mt-2 text-green-700">
                <Link href="/dashboard/fees">Manage Payments</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                <Calendar className="mr-2 h-5 w-5" />
                Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-800">{upcomingEvents.length}</p>
              <p className="text-sm text-purple-600 mt-1">Upcoming events</p>
              <Button asChild variant="link" className="p-0 h-auto mt-2 text-purple-700">
                <Link href="/dashboard/events">View Calendar</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center text-amber-700">
                <GraduationCap className="mr-2 h-5 w-5" />
                Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-800">{recentActivities.length}</p>
              <p className="text-sm text-amber-600 mt-1">Available results</p>
              <Button asChild variant="link" className="p-0 h-auto mt-2 text-amber-700">
                <Link href="/dashboard/result">View Results</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                My Children
              </CardTitle>
              <CardDescription>Students linked to your account</CardDescription>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <p className="text-muted-foreground">No children linked to your account yet.</p>
              ) : (
                <div className="space-y-4">
                  {children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">{child.user.name}</p>
                        <p className="text-sm text-muted-foreground">Class: {child.class?.name || "Not assigned"}</p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/children/${child.id}`}>View Details</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/children">View All Children</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Upcoming Events
              </CardTitle>
              <CardDescription>School events and activities</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground">No upcoming events at this time.</p>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="border-b pb-3">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.startDate), "MMM d, yyyy")}
                        {event.endDate && event.startDate !== event.endDate &&
                          ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`}
                      </p>
                      <p className="text-sm mt-1 line-clamp-2">{event.description}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/events">View All Events</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DashboardHeader heading={roleTitle} text={roleDescription} />

        {(session.role === "super_admin" || session.role === "school_admin") ? (
          <AdminDashboardClient stats={stats} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary/20 hover:border-primary/50 transition-all shadow-sm hover:shadow-md group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5 group-hover:bg-primary/10 transition-colors">
                <CardTitle className="text-sm font-medium">
                  Total Students
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active students in your school
                </p>
              </CardContent>
            </Card>
            <Card className="border-secondary/20 hover:border-secondary/50 transition-all shadow-sm hover:shadow-md group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-secondary/5 group-hover:bg-secondary/10 transition-colors">
                <CardTitle className="text-sm font-medium">
                  Total Classes
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <BookOpen className="h-4 w-4 text-secondary" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.totalClasses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Classes across all departments
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 hover:border-primary/50 transition-all shadow-sm hover:shadow-md group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary/5 group-hover:bg-primary/10 transition-colors">
                <CardTitle className="text-sm font-medium">
                  Total Teachers
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <UserCheck className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Teachers in your school
                </p>
              </CardContent>
            </Card>
            <Card className="border-secondary/20 hover:border-secondary/50 transition-all shadow-sm hover:shadow-md group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-secondary/5 group-hover:bg-secondary/10 transition-colors">
                <CardTitle className="text-sm font-medium">
                  Total Subjects
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <BookText className="h-4 w-4 text-secondary" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.totalSubjects}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Subjects taught in your school
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 border-primary/20 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {recentActivities.length === 0 ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">No recent activities</p>
                  </div>
                ) : (
                  <div>
                    {recentActivities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className={cn(
                          "flex items-center p-4 hover:bg-primary/5 transition-colors",
                          index !== recentActivities.length - 1 ? "border-b border-primary/10" : ""
                        )}
                      >
                        <div className="space-y-1 flex-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.student.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Scored {activity.marks}/{activity.totalMarks} in{" "}
                            {activity.subject.name}
                          </p>
                        </div>
                        <div className="ml-auto text-xs text-muted-foreground">
                          {format(new Date(activity.updatedAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3 border-secondary/20 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="bg-secondary/5 border-b border-secondary/10">
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {upcomingEvents.length === 0 ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">No upcoming events</p>
                  </div>
                ) : (
                  <div>
                    {upcomingEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className={cn(
                          "flex items-center p-4 hover:bg-secondary/5 transition-colors",
                          index !== upcomingEvents.length - 1 ? "border-b border-secondary/10" : ""
                        )}
                      >
                        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                          <Calendar className="h-5 w-5 text-secondary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {event.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.startDate), "MMM d, yyyy")}
                            {event.endDate && event.startDate !== event.endDate &&
                              ` - ${format(
                                new Date(event.endDate),
                                "MMM d, yyyy"
                              )}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
