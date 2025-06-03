import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { DepartmentsTable } from "./departments-table"
import { UserRole } from "@prisma/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen } from "lucide-react"

// Fetch data function to keep the code organized
async function getDepartmentsData(schoolId: string) {
    try {
        // Fetch departments with counts
        const departments = await prisma.department.findMany({
            where: {
                schoolId,
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

        // Get school colors for styling
        const school = await prisma.school.findUnique({
            where: {
                id: schoolId,
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

        return {
            departments,
            schoolColors: {
                primaryColor: school?.primaryColor || "#3b82f6",
                secondaryColor: school?.secondaryColor || "#1f2937",
            },
            stats: {
                totalDepartments: departments.length,
                totalSubjects,
                totalTeachers,
                totalStudents,
            }
        }
    } catch (error) {
        console.error("Error fetching departments data:", error)
        throw new Error("Failed to load departments data")
    }
}

// Loading skeleton for stats
function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
            ))}
        </div>
    )
}

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
        const data = await getDepartmentsData(session.schoolId!)

        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading="Department Management"
                    text="Create and manage departments, assign students and teachers, and organize your institution's academic structure."
                    icon={<BookOpen className="h-6 w-6" />}
                />

                {/* Stats Cards */}
                <Suspense fallback={<StatsSkeleton />}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatsCard
                            title="Total Departments"
                            value={data.stats.totalDepartments}
                            description="Active departments"
                            className="bg-blue-50"
                        />
                        <StatsCard
                            title="Total Students"
                            value={data.stats.totalStudents}
                            description="Enrolled students"
                            className="bg-green-50"
                        />
                        <StatsCard
                            title="Total Teachers"
                            value={data.stats.totalTeachers}
                            description="Assigned teachers"
                            className="bg-purple-50"
                        />
                        <StatsCard
                            title="Total Subjects"
                            value={data.stats.totalSubjects}
                            description="Active subjects"
                            className="bg-amber-50"
                        />
                    </div>
                </Suspense>

                {/* Departments Table */}
                <div className="border rounded-lg">
                    <DepartmentsTable
                        departments={data.departments}
                        userRole={session.role}
                    />
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

// Stats card component
function StatsCard({
    title,
    value,
    description,
    className = "",
}: {
    title: string
    value: number
    description: string
    className?: string
}) {
    return (
        <div className={`rounded-lg border p-4 ${className}`}>
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <div className="mt-2">
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    )
} 