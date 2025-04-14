import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { EventsTable } from "./events-table"
import { UserRole } from "@prisma/client"

export default async function EventsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Only super admin and school admin can access this page
  if (session.role !== UserRole.SUPER_ADMIN && session.role !== UserRole.SCHOOL_ADMIN) {
    redirect("/dashboard")
  }

  // Fetch schools for super admin
  let schools: { id: string; name: string }[] = []
  if (session.role === UserRole.SUPER_ADMIN) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
        <p className="text-muted-foreground">Create and manage school events, announcements, and activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Events</CardTitle>
          <CardDescription>
            Create, edit, and manage events for your school. Events can be public or private.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventsTable userRole={session.role} userId={session.id} schoolId={session.schoolId} schools={schools} />
        </CardContent>
      </Card>
    </div>
  )
}

