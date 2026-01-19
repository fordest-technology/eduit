import { getSession } from "@/lib/auth"
import { prisma, withErrorHandling } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ClassesTable } from "./classes-table"
import { BookOpen, Users, GraduationCap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DashboardStatsCard, DashboardStatsGrid } from "@/components/dashboard-stats-card"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { logger } from "@/lib/logger"

async function getData(schoolId: string) {
    const startTime = Date.now()

    try {
        // Fetch essential data in parallel with retry logic
        const [currentSession, teachers, subjects, uniqueClasses] = await withErrorHandling(() => 
            Promise.all([
                prisma.academicSession.findFirst({
                    where: {
                        schoolId,
                        isCurrent: true,
                    },
                    select: {
                        id: true,
                    },
                }),
                prisma.teacher.findMany({
                    where: {
                        user: {
                            role: "TEACHER",
                            schoolId,
                        }
                    },
                    select: {
                        id: true,
                        user: {
                            select: {
                                name: true,
                                profileImage: true
                            }
                        }
                    },
                }),
                prisma.subject.findMany({
                    where: { schoolId },
                    select: {
                        id: true,
                        name: true,
                    },
                }),
                prisma.class.groupBy({
                    by: ["name"],
                    where: { schoolId },
                }),
            ])
        )

        const classesCount = uniqueClasses.length

        const duration = Date.now() - startTime
        logger.query("Classes page data fetch", duration, {
            schoolId,
            classesCount,
            teachersCount: teachers.length,
            subjectsCount: subjects.length,
        })

        return {
            classesCount,
            currentSessionId: currentSession?.id || null,
            teachers: teachers.map(t => ({
                id: t.id,
                name: t.user.name,
                profileImage: t.user.profileImage
            })),
            subjects,
        }
    } catch (error) {
        logger.error("Error fetching classes data", error, { schoolId })
        throw error
    }
}

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardContent className="pt-6 flex items-center">
                        <Skeleton className="h-12 w-12 rounded-full mr-4" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export default async function ClassesPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    if (!session.schoolId) {
        redirect("/dashboard")
    }

    const { classesCount, teachers, subjects } = await getData(session.schoolId)

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Class Management"
                text={session.role === "TEACHER"
                    ? "View your assigned classes and manage enrolled students"
                    : "Create classes, assign teachers, and manage students in each class"}
                showBanner={true}
                icon={<GraduationCap className="h-6 w-6" />}
            />

            {/* Stats Cards Section */}
            <DashboardStatsGrid columns={3}>
                <DashboardStatsCard
                    title="Total Classes"
                    value={classesCount}
                    icon={GraduationCap}
                    color="blue"
                    description="Classes across all levels"
                />
                <DashboardStatsCard
                    title="Subjects Assigned"
                    value={subjects.length}
                    icon={BookOpen}
                    color="emerald"
                    description="Subjects taught in classes"
                />
                <DashboardStatsCard
                    title="Teachers"
                    value={teachers.length}
                    icon={Users}
                    color="purple"
                    description="Faculty members"
                />
            </DashboardStatsGrid>

            {/* Classes Table - fetches own data client-side */}
            <Card>
                <CardContent className="p-6">
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