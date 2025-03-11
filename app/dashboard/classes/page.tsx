import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { ClassesTable } from "./classes-table"

export default async function ClassesPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Fetch teachers for the school
    const teachers = await prisma.user.findMany({
        where: {
            role: "TEACHER",
            schoolId: session.schoolId,
        },
        select: {
            id: true,
            name: true,
            profileImage: true,
        },
        orderBy: {
            name: "asc",
        },
    })

    // Fetch subjects for the school
    const subjects = await prisma.subject.findMany({
        where: {
            schoolId: session.schoolId,
        },
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: "asc",
        },
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
                <p className="text-muted-foreground">
                    {session.role === "teacher"
                        ? "View your assigned classes and subjects"
                        : "Manage school classes, assign teachers and subjects"}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Classes</CardTitle>
                    <CardDescription>
                        {session.role === "teacher"
                            ? "View and manage your assigned classes"
                            : "Create classes, assign teachers, and manage subjects"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ClassesTable
                        userRole={session.role}
                        userId={session.id}
                        schoolId={session.schoolId}
                        teachers={teachers}
                        subjects={subjects}
                    />
                </CardContent>
            </Card>
        </div>
    )
} 