import { DashboardHeader } from "@/app/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import Link from "next/link"
import { redirect } from "next/navigation"
import { GraduationCap } from "lucide-react"

export default async function MyClassesPage() {
    const session = await getSession()
    if (!session) {
        redirect("/login")
    }

    // If student, redirect to their specific class page
    if (session.role === "STUDENT") {
        const student = await prisma.student.findUnique({
            where: { userId: session.id },
            include: {
                classes: {
                    where: { status: 'ACTIVE' },
                    include: { class: true },
                    take: 1
                }
            }
        })

        const activeClass = student?.classes[0]
        if (activeClass) {
            redirect(`/dashboard/my-classes/${activeClass.classId}`)
        } else {
            // If no active class, show empty state or redirect to dashboard
            redirect("/dashboard")
        }
    }

    if (session.role !== "TEACHER") {
        redirect("/dashboard")
    }

    // Fetch classes assigned to this teacher, including students and their user info
    const classes = await prisma.class.findMany({
        where: {
            teacher: { userId: session.id }
        },
        include: {
            students: {
                include: {
                    student: {
                        include: { user: true }
                    }
                }
            }
        }
    })

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="My Classes"
                text="View and manage your assigned classes. Click a class to see its students."
                showBanner={true}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {classes.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No Classes Assigned</CardTitle>
                            <CardDescription>You are not assigned to any classes yet.</CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    classes.map(cls => (
                        <Link key={cls.id} href={`/dashboard/my-classes/${cls.id}`}>
                            <Card className="hover:shadow-lg transition cursor-pointer">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-primary" />
                                        {cls.name}
                                    </CardTitle>
                                    <CardDescription>
                                        {cls.section ? `Section: ${cls.section}` : null}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground">
                                        {cls.students.length} student{cls.students.length !== 1 ? "s" : ""}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
} 