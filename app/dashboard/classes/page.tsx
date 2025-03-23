import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ClassesTable } from "./classes-table"
import { BookOpen, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default async function ClassesPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    try {
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

        // Fetch classes with counts for stats
        const classes = await prisma.class.findMany({
            where: {
                schoolId: session.schoolId,
            },
            include: {
                _count: {
                    select: {
                        students: true,
                        subjects: true,
                    }
                }
            }
        })

        // Calculate totals for stats
        const totalStudents = classes.reduce((acc, cls) => acc + cls._count.students, 0)
        const totalSubjects = classes.reduce((acc, cls) => acc + cls._count.subjects, 0)

        // Get school colors for styling
        const school = await prisma.school.findUnique({
            where: {
                id: session.schoolId,
            },
            select: {
                name: true,
                primaryColor: true,
                secondaryColor: true,
            },
        })

        const schoolColors = {
            primaryColor: school?.primaryColor || "#3b82f6",
            secondaryColor: school?.secondaryColor || "#1f2937",
        }

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
                            {session.role === "teacher"
                                ? "View your assigned classes and manage enrolled students"
                                : "Create classes, assign teachers, and manage students in each class"}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
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
    } catch (error) {
        console.error("Error loading classes page:", error)
        return (
            <div className="container py-6">
                <div className="bg-destructive/15 p-4 rounded-md">
                    <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
                    <p>Failed to load classes. Please try again later.</p>
                </div>
            </div>
        )
    }
} 