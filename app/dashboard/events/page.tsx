import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { EventsTable } from "./events-table"

export default async function EventsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Only super admin and school admin can access this page
  if (session.role !== "super_admin" && session.role !== "school_admin") {
    redirect("/dashboard")
  }

  // Fetch schools for super admin
  let schools: { id: string; name: string }[] = []
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

