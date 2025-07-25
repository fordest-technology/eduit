import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { DepartmentsTable } from "./departments-table"
import { UserRole } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, GraduationCap, Building2 } from "lucide-react"

export default async function DepartmentsPage() {
    const session = await getSession()

    // Redirect unauthenticated users to login
    if (!session) {
        redirect("/login")
    }

    // Only SUPER_ADMIN and SCHOOL_ADMIN should have access
    if (session.role !== UserRole.SUPER_ADMIN && session.role !== UserRole.SCHOOL_ADMIN) {
        redirect("/dashboard")
    }

    try {
        // Fetch departments with counts for the current school
        const departments = await prisma.department.findMany({
            where: {
                schoolId: session.schoolId,
            },
            include: {
                _count: {
                    select: {
                        subjects: true,
                        students: true,
                        teachers: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        })

        // Get school colors for styling the banner
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

        // Calculate summary statistics
        const totalSubjects = departments.reduce((sum, dept) => sum + (dept._count?.subjects || 0), 0)
        const totalTeachers = departments.reduce((sum, dept) => sum + (dept._count?.teachers || 0), 0)
        const totalStudents = departments.reduce((sum, dept) => sum + (dept._count?.students || 0), 0)

        const schoolColors = {
            primaryColor: school?.primaryColor || "#3b82f6",
            secondaryColor: school?.secondaryColor || "#1f2937",
        }

        return (
            <div className="container py-6">
                {/* Banner section */}
                <div
                    className="w-full p-8 mb-6 rounded-lg relative overflow-hidden"
                    style={{
                        background: `linear-gradient(45deg, ${schoolColors.primaryColor}, ${schoolColors.secondaryColor})`,
                    }}
                >
                    <div className="absolute inset-0 bg-grid-white/15 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold text-white mb-2">Departments</h1>
                        <p className="text-white text-opacity-90 max-w-2xl">
                            Manage academic departments across your institution. Create new departments, assign students and faculty, and track department performance.
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-purple-100 rounded-full">
                                    <Building2 className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Departments</p>
                                    <h3 className="text-2xl font-bold text-purple-600">{departments.length}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                                    <h3 className="text-2xl font-bold text-blue-600">{totalStudents}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-green-100 rounded-full">
                                    <GraduationCap className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Teachers</p>
                                    <h3 className="text-2xl font-bold text-green-600">{totalTeachers}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-amber-100 rounded-full">
                                    <BookOpen className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Subjects</p>
                                    <h3 className="text-2xl font-bold text-amber-600">{totalSubjects}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Display the departments table */}
                <div className="border rounded-lg overflow-hidden bg-white">
                    <DepartmentsTable departments={departments} userRole={session.role} />
                </div>
            </div>
        )
    } catch (error) {
        console.error("Error loading departments:", error)
        return (
            <div className="container py-6">
                <div className="bg-destructive/15 p-4 rounded-md">
                    <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
                    <p>Failed to load departments. Please try again later.</p>
                </div>
            </div>
        )
    }
} 