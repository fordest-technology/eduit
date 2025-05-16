import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ClassesTable } from "./classes-table"
import { BookOpen, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

async function getData(schoolId: string) {
    try {
        const [teachers, subjects, classes, school] = await Promise.all([
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
                include: {
                    _count: {
                        select: {
                            students: true,
                            subjects: true,
                        }
                    }
                }
            }),
            prisma.school.findUnique({
                where: {
                    id: schoolId,
                },
                select: {
                    name: true,
                    primaryColor: true,
                    secondaryColor: true,
                },
            })
        ])

        return {
            teachers,
            subjects,
            classes,
            schoolColors: {
                primaryColor: school?.primaryColor || "#3b82f6",
                secondaryColor: school?.secondaryColor || "#1f2937",
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error)
        throw new Error("Failed to load data")
    }
}

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <Skeleton className="h-12 w-12 rounded-full mr-4" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                            </div>
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
        <div className="container py-6">
            {/* Hero section */}
            <div
                className="w-full p-8 mb-6 rounded-lg relative overflow-hidden"
                style={{
                    background: `linear-gradient(45deg, ${schoolColors.primaryColor}, ${schoolColors.secondaryColor})`,
                }}
            >
                <div className="absolute inset-0 bg-grid-white/15 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Class Management</h1>
                    <p className="text-white text-opacity-90 max-w-2xl">
                        {session.role === "TEACHER"
                            ? "View your assigned classes and manage enrolled students"
                            : "Create classes, assign teachers, and manage students in each class"}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <Suspense fallback={<StatsSkeleton />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-blue-100 mr-4">
                                <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Classes</p>
                                <h3 className="text-2xl font-bold">{classes.length}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-amber-100 mr-4">
                                <BookOpen className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Subjects Assigned</p>
                                <h3 className="text-2xl font-bold">{totalSubjects}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-green-100 mr-4">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Enrolled Students</p>
                                <h3 className="text-2xl font-bold">{totalStudents}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Suspense>

            {/* Classes Table */}
            <div className="border rounded-lg overflow-hidden p-6 bg-white">
                <ClassesTable
                    userRole={session.role}
                    userId={session.id}
                    schoolId={session.schoolId}
                    teachers={teachers}
                    subjects={subjects}
                />
            </div>
        </div>
    )
} 