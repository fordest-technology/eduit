import { getSession } from "@/lib/auth";
import { PrismaClient, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { StudentForm } from "../../../students/student-form";
import { prisma } from "@/lib/prisma";

export default async function EditStudentPage({
    params,
}: {
    params: { id: string };
}) {
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
        const student = await prisma.user.findFirst({
            where: {
                id: params.id,
                role: Role.STUDENT,
                schoolId,
            },
            include: {
                department: true,
                studentClass: {
                    include: {
                        class: true,
                        session: true,
                    },
                },
            },
        });

        if (!student) {
            return redirect("/dashboard/students");
        }

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
                    student={student}
                    departments={departments}
                    classes={classes}
                    currentSession={currentSession}
                    isEdit={true}
                />
            </div>
        );
    } catch (error) {
        console.error("Error fetching student data:", error);
        return redirect("/dashboard/students");
    }
} 