import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SubjectsTable } from "./subjects-table"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { BookOpen, GraduationCap, Users } from "lucide-react"
import { Teacher as PrismaTeacher, Subject as PrismaSubject } from "@prisma/client"

// Define types for the data
interface Teacher {
    id: string;
    user: {
        id: string;
        name: string;
        profileImage: string | null;
    };
}

interface FormattedTeacher {
    id: string;
    name: string;
    profileImage: string | null;
    userId: string;
}

interface SubjectTeacher {
    teacher: {
        id: string;
        name: string;
        profileImage: string | null;
        userId: string;
    }
}

interface FormattedSubject {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    departmentId: string | null;
    department: any | null;
    levelId: string | null;
    level: any | null;
    teachers: SubjectTeacher[];
    _count?: {
        classes: number;
    }
}

export default async function SubjectsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    // Only admin can access this page
    if (session.role !== "super_admin" && session.role !== "school_admin") {
        redirect("/dashboard")
    }

    if (!session.schoolId) {
        redirect("/dashboard")
    }

    try {
        // Test connection
        await prisma.$queryRaw`SELECT 1`
    } catch (error) {
        console.error("Database connection error:", error)
        throw new Error("Failed to connect to the database. Please try again later.")
    }

    // Fetch teachers for the school
    const teachers = await prisma.teacher.findMany({
        where: {
            user: {
                schoolId: session.schoolId,
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
    }) as Teacher[];

    // Transform the teacher data
    const formattedTeachers: FormattedTeacher[] = teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.user.name,
        profileImage: teacher.user.profileImage,
        userId: teacher.user.id,
    }));

    // Fetch existing subjects
    const subjectsData = await prisma.subject.findMany({
        where: {
            schoolId: session.schoolId,
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

    // Transform the data to match the expected format
    const subjects: FormattedSubject[] = subjectsData.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
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

    // Calculate summary statistics
    const totalSubjects = subjects.length
    const totalClasses = subjects.reduce((sum: number, subject: FormattedSubject) => sum + (subject._count?.classes || 0), 0)
    const totalTeachers = new Set(subjects.flatMap((subject: FormattedSubject) =>
        subject.teachers.map((t: SubjectTeacher) => t.teacher.id)
    )).size

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Subject Management"
                text="Create subjects and assign teachers to manage your curriculum"
                showBanner={true}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                            <BookOpen className="mr-2 h-5 w-5" />
                            Subjects
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-800">{totalSubjects}</p>
                        <p className="text-sm text-blue-600 mt-1">Total subjects</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                            <GraduationCap className="mr-2 h-5 w-5" />
                            Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-purple-800">{totalClasses}</p>
                        <p className="text-sm text-purple-600 mt-1">Classes using subjects</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
                            <Users className="mr-2 h-5 w-5" />
                            Teachers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-800">{totalTeachers}</p>
                        <p className="text-sm text-emerald-600 mt-1">Teachers assigned to subjects</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/10 shadow-md">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle>Subjects</CardTitle>
                    <CardDescription>Create new subjects and manage teacher assignments</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <SubjectsTable
                        userRole={session.role}
                        schoolId={session.schoolId}
                        teachers={formattedTeachers}
                        initialSubjects={subjects}
                    />
                </CardContent>
            </Card>
        </div>
    )
} 