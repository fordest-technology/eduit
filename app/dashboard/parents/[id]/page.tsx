import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ParentDetails from "./parent-details";

// Define interface for student data
interface StudentData {
    id: string;
    name: string;
    class: string;
}

export default async function ParentPage({
    params,
}: {
    params: { id: string };
}) {
    try {
        const session = await getSession();

        if (!session) {
            redirect("/dashboard");
        }

        // Fetch the parent with their children
        const parent = await prisma.user.findUnique({
            where: {
                id: params.id,
                role: "PARENT",
            },
            include: {
                parent: {
                    include: {
                        children: {
                            include: {
                                student: {
                                    include: {
                                        user: true,
                                        classes: {
                                            include: {
                                                class: true,
                                                session: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!parent) {
            redirect("/dashboard/parents");
        }

        // If school admin, ensure they only view parents from their school
        if (session.role === "school_admin" && parent.schoolId !== session.schoolId) {
            redirect("/dashboard/parents");
        }

        // Get current session and handle optional schoolId
        let currentSession = null;

        if (parent.schoolId) {
            currentSession = await prisma.academicSession.findFirst({
                where: {
                    schoolId: parent.schoolId,
                    isCurrent: true,
                },
            });
        }

        // Format children data for display
        const children = parent.parent?.children?.map((relation) => {
            const student = relation.student;

            const currentClass = student.classes && student.classes.length > 0
                ? student.classes[0].class.name
                : "Not assigned";

            return {
                id: student.id,
                name: student.user?.name || "Unknown",
                class: currentClass,
                relation: relation.relation || "Not specified",
                linkId: relation.id,
            };
        }) || [];

        // Fetch all available students for linking
        const availableStudents: StudentData[] = [];

        if (["super_admin", "school_admin", "teacher"].includes(session.role) && parent.schoolId) {
            const allStudents = await prisma.user.findMany({
                where: {
                    role: "STUDENT",
                    schoolId: parent.schoolId,
                },
                include: {
                    student: {
                        include: {
                            classes: {
                                where: currentSession ? {
                                    sessionId: currentSession.id,
                                } : undefined,
                                include: {
                                    class: true,
                                },
                            },
                        },
                    },
                },
            });

            // Filter out already linked students
            const linkedStudentIds = children.map((child) => child.id);

            // Populate availableStudents array
            for (const student of allStudents) {
                if (!linkedStudentIds.includes(student.id)) {
                    let className = "Not assigned";

                    if (student.student?.classes && student.student.classes.length > 0) {
                        className = student.student.classes[0].class.name;
                    }

                    availableStudents.push({
                        id: student.id,
                        name: student.name,
                        class: className
                    });
                }
            }
        }

        return (
            <div className="container mx-auto py-10">
                <ParentDetails
                    parent={parent}
                    children={children}
                    availableStudents={availableStudents}
                    canManage={["super_admin", "school_admin", "teacher"].includes(session.role)}
                />
            </div>
        );
    } catch (error) {
        console.error("Error in parent detail page:", error);
        return (
            <div className="container mx-auto py-10">
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Parent Details</h2>
                    <p className="text-red-600">
                        There was a problem loading this parent's information. Please try again later or contact support.
                    </p>
                </div>
            </div>
        );
    }
} 