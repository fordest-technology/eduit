import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import { AttendanceTable } from "./attendance-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AttendancePage() {
    const session = await getSession()

    if (!session) {
        redirect("/auth/signin")
    }

    // Fetch current academic session
    const currentSession = await prisma.academicSession.findFirst({
        where: {
            schoolId: session.schoolId,
            isCurrent: true,
        },
    })

    if (!currentSession) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>No Active Session</CardTitle>
                        <CardDescription>
                            There is no active academic session. Please contact your administrator.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }
    // Fetch data based on user role
    let classes: any[] = []
    const students: any[] = []

    if (session.role === "teacher") {
        // Get teacher's classes
        classes = await prisma.class.findMany({
            where: {
                teacherId: session.id,
                schoolId: session.schoolId,
            },
            include: {
                _count: {
                    select: {
                        students: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        })
    } else if (session.role === "super_admin" || session.role === "school_admin") {
        // Get all classes for the school
        classes = await prisma.class.findMany({
            where: {
                schoolId: session.schoolId,
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        students: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        })
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
                    <p className="text-muted-foreground">
                        {session.role === "student"
                            ? "View your attendance records"
                            : session.role === "parent"
                                ? "View your children's attendance"
                                : "Record and manage student attendance"}
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {session.role === "student"
                                ? "My Attendance"
                                : session.role === "parent"
                                    ? "Children's Attendance"
                                    : "Class Attendance"}
                        </CardTitle>
                        <CardDescription>
                            {session.role === "student" || session.role === "parent"
                                ? "View attendance records and statistics"
                                : "Record and manage attendance for your classes"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AttendanceTable
                            userRole={session.role}
                            userId={session.id}
                            schoolId={session.schoolId!}
                            currentSession={currentSession}
                            classes={classes}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 