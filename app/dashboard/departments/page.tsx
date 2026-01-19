import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { DepartmentsTable } from "./departments-table"
import { BookOpen, Users, GraduationCap, Building2 } from "lucide-react"
import { DashboardStatsCard, DashboardStatsGrid } from "@/components/dashboard-stats-card"
import { DashboardHeader } from "@/app/components/dashboard-header"

export default async function DepartmentsPage() {
    const session = await getSession()

    // Redirect unauthenticated users to login
    if (!session) {
        redirect("/login")
    }

    // Only SUPER_ADMIN and SCHOOL_ADMIN should have access
    if (session.role !== "SUPER_ADMIN" && session.role !== "SCHOOL_ADMIN") {
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
        const totalSubjects = departments.reduce((sum: number, dept: any) => sum + (dept._count?.subjects || 0), 0)
        const totalTeachers = departments.reduce((sum: number, dept: any) => sum + (dept._count?.teachers || 0), 0)
        const totalStudents = departments.reduce((sum: number, dept: any) => sum + (dept._count?.students || 0), 0)

        const schoolColors = {
            primaryColor: school?.primaryColor || "#3b82f6",
            secondaryColor: school?.secondaryColor || "#1f2937",
        }

        return (
            <div className="container py-6">
                <DashboardHeader
                    heading="Departments"
                    text="Manage academic departments across your institution. Create new departments, assign students and faculty, and track department performance."
                    showBanner={true}
                    icon={<Building2 className="h-6 w-6" />}
                />

                {/* Stats Cards Section */}
                <DashboardStatsGrid columns={4} className="mb-8">
                    <DashboardStatsCard
                        title="Departments"
                        value={departments.length}
                        icon={Building2}
                        color="purple"
                        description="Academic divisions"
                    />
                    <DashboardStatsCard
                        title="Students"
                        value={totalStudents}
                        icon={Users}
                        color="blue"
                        description="Enrolled learners"
                    />
                    <DashboardStatsCard
                        title="Teachers"
                        value={totalTeachers}
                        icon={GraduationCap}
                        color="emerald"
                        description="Faculty members"
                    />
                    <DashboardStatsCard
                        title="Subjects"
                        value={totalSubjects}
                        icon={BookOpen}
                        color="amber"
                        description="Curriculum courses"
                    />
                </DashboardStatsGrid>

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