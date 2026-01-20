"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClassDetailHeader } from "./_components/ClassDetailHeader";
import { ClassStudentList } from "./_components/ClassStudentList";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getSession, UserRole } from "@/lib/auth-client";

interface ClassDetail {
    id: string;
    name: string;
    section: string | null;
    level: {
        id: string;
        name: string;
    };
    teacher: {
        id: string;
        user: {
            name: string;
            email: string;
            profileImage: string | null;
        };
    } | null;
    currentSession: {
        id: string;
        name: string;
    };
    students: Array<{
        id: string;
        userId: string;
        name: string;
        email: string;
        profileImage: string | null;
        rollNumber: string | null;
        gender: string | null;
        dateOfBirth: Date | null;
    }>;
    subjects: Array<{
        id: string;
        name: string;
        code: string | null;
        teacher: {
            id: string;
            user: {
                name: string;
            };
        } | null;
    }>;
    stats: {
        totalStudents: number;
        totalSubjects: number;
        attendance: {
            total: number;
            present: number;
            absent: number;
            late: number;
            notMarked: number;
        };
        performance: {
            averageScore: number;
            highestScore: number;
            lowestScore: number;
            totalResults: number;
        };
    };
}

export default function ClassDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [classData, setClassData] = useState<ClassDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);

    useEffect(() => {
        async function fetchClassDetail() {
            try {
                setLoading(true);
                setError(null);

                const [session, response] = await Promise.all([
                    getSession(),
                    fetch(`/api/classes/${id}/detail`)
                ]);

                if (session) {
                    setUserRole(session.role);
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to fetch class details");
                }

                const data = await response.json();
                setClassData(data);
            } catch (error) {
                console.error("Error fetching class details:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to load class details";
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchClassDetail();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-slate-500">Loading class details...</p>
                </div>
            </div>
        );
    }

    if (error || !classData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-md">
                    <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Error Loading Class</h2>
                    <p className="text-slate-500 mb-6">{error || "Class not found"}</p>
                    <Link href="/dashboard/my-classes">
                        <Button variant="outline" className="rounded-xl">
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back to My Classes
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link href={userRole === "STUDENT" ? "/dashboard" : "/dashboard/my-classes"}>
                <Button variant="ghost" className="rounded-xl">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {userRole === "STUDENT" ? "Back to Dashboard" : "Back to My Classes"}
                </Button>
            </Link>

            <ClassDetailHeader classData={classData} userRole={userRole || undefined} />
            <ClassStudentList students={classData.students} />
        </div>
    );
}
