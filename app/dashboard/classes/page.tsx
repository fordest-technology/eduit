import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ClassesTable } from "./classes-table"
import { BookOpen, Users, GraduationCap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { logger } from "@/lib/logger"

async function getData(schoolId: string) {
    const startTime = Date.now()

    try {
        logger.info("Fetching classes data", { schoolId })

        // Get current academic session first
        const currentSession = await prisma.academicSession.findFirst({
            where: {
                schoolId,
                isCurrent: true,
            },
            select: {
                id: true,
            },
        })

        // Optimized parallel queries with minimal data selection
        const [teachersData, subjects, classes, school] = await Promise.all([
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
                orderBy: {
                    user: {
                        name: "asc"
                    }
                }
            }),
            prisma.subject.findMany({
                where: {
                    schoolId,
                },
                select: {
                    id: true,
                    name: true,
                },
                orderBy: {
                    name: "asc",
                },
            }),
            prisma.class.findMany({
                where: {
                    schoolId,
                },
                select: {
                    id: true,
                    name: true,
                    section: true,
                    _count: {
                        select: {
                            students: {
                                where: {
                                    sessionId: currentSession?.id,
                                    status: "ACTIVE",
                                },
                            },
                            subjects: true,
                        }
                    }
                },
                orderBy: {
                    name: "asc",
                },
            }),
            prisma.school.findUnique({
                where: { id: schoolId },
                select: {
                    primaryColor: true,
                    secondaryColor: true,
                }
            })
        ])

        // Transform teachers data to match component interface
        const teachers = teachersData.map(teacher => ({
            id: teacher.id,
            name: teacher.user.name,
            profileImage: teacher.user.profileImage
        }))

        const duration = Date.now() - startTime
        logger.query("Classes data fetch", duration, {
            schoolId,
            teachersCount: teachers.length,
            subjectsCount: subjects.length,
            classesCount: classes.length
        })

        return {
            teachers,
            subjects,
            classes,
            schoolColors: school || { primaryColor: "#3b82f6", secondaryColor: "#1d4ed8" }
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

    const { teachers, subjects, classes, schoolColors } = await getData(session.schoolId)

    // Calculate totals for stats
    const totalStudents = classes.reduce((acc, cls) => acc + cls._count.students, 0)
    const totalSubjects = classes.reduce((acc, cls) => acc + cls._count.subjects, 0)

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

            {/* Stats Cards */}
            <Suspense fallback={<StatsSkeleton />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                                <GraduationCap className="mr-2 h-5 w-5" />
                                Total Classes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-blue-800">{classes.length}</p>
                            <p className="text-sm text-blue-600 mt-1">Classes across all levels</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
                                <BookOpen className="mr-2 h-5 w-5" />
                                Subjects Assigned
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-emerald-800">{totalSubjects}</p>
                            <p className="text-sm text-emerald-600 mt-1">Subjects taught in classes</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                                <Users className="mr-2 h-5 w-5" />
                                Enrolled Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-purple-800">{totalStudents}</p>
                            <p className="text-sm text-purple-600 mt-1">Students across all classes</p>
                        </CardContent>
                    </Card>
                </div>
            </Suspense>

            {/* Classes Table */}
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