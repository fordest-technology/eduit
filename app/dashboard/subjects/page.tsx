import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { SubjectsTable } from "./subjects-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, GraduationCap, Users } from "lucide-react"
import { Suspense } from "react"
import { SubjectsTableSkeleton } from "./subjects-table-skeleton"
import { SubjectsClient } from "./subjects-client"
import { UserRole } from "@prisma/client"
import { DashboardHeader } from "@/app/components/dashboard-header"

const roleMap: Record<string, UserRole> = {
    "SUPER_ADMIN": UserRole.SUPER_ADMIN,
    "SCHOOL_ADMIN": UserRole.SCHOOL_ADMIN,
    "TEACHER": UserRole.TEACHER,
    "STUDENT": UserRole.STUDENT,
    "PARENT": UserRole.PARENT,
};

export const metadata: Metadata = {
    title: "Subject Management",
    description: "Create and manage subjects, assign teachers, and organize your curriculum"
}

export default async function SubjectsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/auth/signin")
    }

    const userRole = roleMap[session.role]

    // Only admin can access this page
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.SCHOOL_ADMIN) {
        redirect("/dashboard")
    }

    if (!session.schoolId) {
        redirect("/dashboard")
    }

    // Test database connection
    try {
        await prisma.$queryRaw`SELECT 1`
    } catch (error) {
        console.error("Database connection error:", error)
        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading="Subject Management"
                    text="Create and manage subjects, assign teachers, and organize your curriculum"
                    showBanner={true}
                    icon={<BookOpen className="h-6 w-6" />}
                />
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight">Database Error</h2>
                    </div>
                    <p className="text-muted-foreground">
                        We couldn't connect to the database. Please try again later.
                    </p>
                </div>
            </div>
        )
    }

    const data = await getSubjectsData(session.schoolId)

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Subject Management"
                text="Create and manage subjects, assign teachers, and organize your curriculum"
                showBanner={true}
                icon={<BookOpen className="h-6 w-6" />}
            />
            <SubjectsClient stats={data.stats}>
                <Suspense fallback={<SubjectsTableSkeleton />}>
                    <SubjectsTable
                        userRole={userRole}
                        schoolId={session.schoolId}
                        teachers={data.teachers}
                        classes={data.classes}
                        initialSubjects={data.subjects}
                        departments={data.departments}
                        levels={data.levels}
                    />
                </Suspense>
            </SubjectsClient>
        </div>
    )
}

// Fetch data function to keep the code organized
async function getSubjectsData(schoolId: string) {
    try {
        // Fetch teachers for the school
        const teachers = await prisma.teacher.findMany({
            where: {
                user: {
                    schoolId: schoolId,
                },
            },
            select: {
                id: true,
                user: {
                    select: {
                        id: true,
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
        })

        // Fetch departments
        const departments = await prisma.department.findMany({
            where: {
                schoolId: schoolId,
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: "asc"
            }
        })

        // Fetch levels
        const levels = await prisma.schoolLevel.findMany({
            where: {
                schoolId: schoolId,
            },
            select: {
                id: true,
                name: true,
                description: true
            },
            orderBy: {
                name: "asc"
            }
        })

        // Transform the teacher data
        const formattedTeachers = teachers.map(teacher => ({
            id: teacher.id,
            name: teacher.user.name,
            profileImage: teacher.user.profileImage,
            userId: teacher.user.id,
        }))

        // Fetch existing subjects
        const subjects = await prisma.subject.findMany({
            where: {
                schoolId: schoolId,
            },
            include: {
                department: true,
                level: true,
                teachers: {
                    include: {
                        teacher: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        profileImage: true,
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        classes: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        })

        // Transform the subjects data
        const formattedSubjects = subjects.map(subject => ({
            id: subject.id,
            name: subject.name,
            code: subject.code || "",
            description: subject.description,
            departmentId: subject.departmentId,
            department: subject.department,
            levelId: subject.levelId,
            level: subject.level,
            teachers: subject.teachers.map(teacherRel => ({
                teacher: {
                    id: teacherRel.teacher.id,
                    name: teacherRel.teacher.user.name,
                    profileImage: teacherRel.teacher.user.profileImage,
                    userId: teacherRel.teacher.user.id
                }
            })),
            _count: subject._count
        }))

        // Fetch classes
        const classes = await prisma.class.findMany({
            where: {
                schoolId: schoolId,
            },
            select: {
                id: true,
                name: true,
                section: true,
            },
            orderBy: {
                name: "asc"
            }
        });

        // Calculate summary statistics
        const totalSubjects = subjects.length
        const totalClasses = subjects.reduce((sum, subject) => sum + (subject._count?.classes || 0), 0)
        const totalTeachers = new Set(subjects.flatMap(subject =>
            subject.teachers.map(t => t.teacher.id)
        )).size

        return {
            teachers: formattedTeachers,
            subjects: formattedSubjects,
            departments,
            levels,
            classes,
            stats: {
                totalSubjects,
                totalClasses,
                totalTeachers
            }
        }
    } catch (error) {
        console.error("Error fetching subjects data:", error)
        throw new Error("Failed to load subjects data. Please try again later.")
    }
}

// Separate component for the content to enable suspense
async function SubjectsContent({
    schoolId,
    userRole
}: {
    schoolId: string
    userRole: UserRole
}) {
    const data = await getSubjectsData(schoolId)

    return (
        <SubjectsTable
            userRole={userRole}
            schoolId={schoolId}
            teachers={data.teachers}
            classes={data.classes}
            initialSubjects={data.subjects}
            departments={data.departments}
            levels={data.levels}
        />
    )
} 