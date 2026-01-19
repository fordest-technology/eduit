import { getSession } from "@/lib/auth";
import { PrismaClient, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { StudentForm } from "../../../students/student-form";
import { prisma } from "@/lib/prisma";

export default async function EditStudentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
        redirect("/auth/signin");
    }

    const userId = session.id;
    const schoolId = session.schoolId;

    if (!schoolId) {
        redirect("/dashboard/students");
    }

    try {
        // Get the student with relations
        const studentData = await prisma.student.findFirst({
            where: {
                userId: id,
                user: {
                    schoolId,
                }
            },
            include: {
                user: true,
                department: true,
                classes: {
                    include: {
                        class: {
                            include: {
                                level: true,
                            }
                        },
                        session: true,
                    },
                },
            },
        });

        if (!studentData) {
            return redirect("/dashboard/students");
        }

        // Transform the data to match StudentWithUser interface
        const student = {
            ...studentData,
            studentClass: studentData.classes,
        };

        // Get current session
        const currentSession = await prisma.academicSession.findFirst({
            where: {
                schoolId,
                isCurrent: true,
            },
        });

        // Get all departments
        const departments = await prisma.department.findMany({
            where: {
                schoolId,
            },
        });

        // Get all classes for the current session
        const classes = await prisma.class.findMany({
            where: {
                schoolId,
            },
        });

        return (
            <div className="container mx-auto py-10">
                <h1 className="text-3xl font-bold mb-10">Edit Student</h1>
                <StudentForm
                    student={student as any}
                    departments={departments}
                    classes={classes as any}
                    currentSession={currentSession as any}
                />
            </div>
        );
    } catch (error) {
        console.error("Error fetching student data:", error);
        return redirect("/dashboard/students");
    }
} 