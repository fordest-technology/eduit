import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { UsersTable } from "./users-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function UsersPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Only super admin and school admin can access this page
  if (session.role !== "super_admin" && session.role !== "school_admin") {
    redirect("/dashboard")
  }

  // Fetch schools for super admin
  let schools = []
  if (session.role === "super_admin") {
    schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    })
  }

  // Fetch classes for student assignment
  const classes = await prisma.class.findMany({
    where: {
      schoolId: session.role === "school_admin" ? session.schoolId : undefined,
    },
    select: {
      id: true,
      name: true,
      section: true,
      school: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  // Fetch current academic session
  const currentSession = await prisma.academicSession.findFirst({
    where: {
      schoolId: session.role === "school_admin" ? session.schoolId : undefined,
      isCurrent: true,
    },
    select: {
      id: true,
      name: true,
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage users, assign roles, and set permissions</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="parents">Parents</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage all users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable
                userRole={session.role}
                userId={session.id}
                schoolId={session.schoolId}
                schools={schools}
                classes={classes}
                currentSession={currentSession}
                roleFilter="all"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Administrators</CardTitle>
              <CardDescription>Manage school administrators</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable
                userRole={session.role}
                userId={session.id}
                schoolId={session.schoolId}
                schools={schools}
                classes={classes}
                currentSession={currentSession}
                roleFilter="SCHOOL_ADMIN"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Teachers</CardTitle>
              <CardDescription>Manage teachers and their class/subject assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable
                userRole={session.role}
                userId={session.id}
                schoolId={session.schoolId}
                schools={schools}
                classes={classes}
                currentSession={currentSession}
                roleFilter="TEACHER"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>Manage students and their class assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable
                userRole={session.role}
                userId={session.id}
                schoolId={session.schoolId}
                schools={schools}
                classes={classes}
                currentSession={currentSession}
                roleFilter="STUDENT"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Parents</CardTitle>
              <CardDescription>Manage parents and link them to their children</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable
                userRole={session.role}
                userId={session.id}
                schoolId={session.schoolId}
                schools={schools}
                classes={classes}
                currentSession={currentSession}
                roleFilter="PARENT"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

