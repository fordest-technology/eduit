import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { SubjectsTable } from "./subjects-table"

export default async function SubjectsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only admin can access this page
    if (session.role !== "super_admin" && session.role !== "school_admin") {
        redirect("/dashboard")
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

    // Fetch existing subjects
    const subjects = await prisma.subject.findMany({
        where: {
            schoolId: session.schoolId,
        },
        include: {
            teachers: {
                include: {
                    teacher: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Subject Management</h1>
                <p className="text-muted-foreground">Create subjects and assign teachers</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Subjects</CardTitle>
                    <CardDescription>Create new subjects and manage teacher assignments</CardDescription>
                </CardHeader>
                <CardContent>
                    <SubjectsTable
                        userRole={session.role}
                        schoolId={session.schoolId}
                        teachers={teachers}
                        initialSubjects={subjects}
                    />
                </CardContent>
            </Card>
        </div>
    )
} 