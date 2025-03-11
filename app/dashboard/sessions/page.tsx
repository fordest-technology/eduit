import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import { SessionsTable } from "./sessions-table"

export default async function SessionsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/auth/signin")
    }

    if (session.role !== "super_admin" && session.role !== "school_admin") {
        redirect("/dashboard")
    }

    // Fetch sessions based on user role
    const sessions = await prisma.academicSession.findMany({
        where: session.role === "super_admin"
            ? undefined
            : { schoolId: session.schoolId },
        include: {
            school: {
                select: {
                    id: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    studentClasses: true,
                    attendance: true,
                    results: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    })

    // If super admin, fetch all schools for the dropdown
    const schools = session.role === "super_admin"
        ? await prisma.school.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: "asc",
            },
        })
        : []

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Academic Sessions</h1>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <SessionsTable
                    initialSessions={sessions.map(session => ({
                        ...session,
                        startDate: session.startDate.toISOString(),
                        endDate: session.endDate.toISOString(),
                        createdAt: session.createdAt.toISOString(),
                        updatedAt: session.updatedAt.toISOString()
                    }))}
                    schools={schools}
                    userRole={session.role}
                    userSchoolId={session.schoolId ?? ""}
                />
            </div>
        </div>
    )
} 