import { prisma } from "@/lib/prisma";
import { ResultsManagement } from "./results-management";
import {
    Student,
    Subject,
    Period,
    Session,
    AssessmentComponent,
} from "../types";

interface ResultsManagementContainerProps {
    schoolId: string;
}

interface StudentWithUser {
    id: string;
    user: {
        name: string;
    };
}

export async function ResultsManagementContainer({
    schoolId,
}: ResultsManagementContainerProps) {
    const [students, subjects, sessions, config] = await Promise.all([
        prisma.student.findMany({
            where: { user: { schoolId } },
            select: {
                id: true,
                user: {
                    select: {
                        name: true,
                    },
                },
            },
        }),
        prisma.subject.findMany({
            where: { schoolId },
            select: {
                id: true,
                name: true,
            },
        }),
        prisma.academicSession.findMany({
            where: { schoolId },
            select: {
                id: true,
                name: true,
            },
        }),
        prisma.resultConfiguration.findFirst({
            where: { schoolId },
            include: {
                periods: true,
                assessmentComponents: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
    ]);

    const formattedStudents: Student[] = students.map((student) => ({
        id: student.id,
        name: student.user.name,
    }));

    const formattedSubjects: Subject[] = subjects;
    const formattedSessions: Session[] = sessions;
    const formattedPeriods: Period[] = config?.periods || [];
    const formattedComponents: AssessmentComponent[] = config?.assessmentComponents || [];

    return (
        <ResultsManagement
            students={formattedStudents}
            subjects={formattedSubjects}
            periods={formattedPeriods}
            sessions={formattedSessions}
            components={formattedComponents}
        />
    );
} 