"use client"

import { useEffect, useState } from "react"
import { StudentsClient } from "./students-client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/app/components/dashboard-header"

interface Student {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    rollNumber: string;
    classes: Array<{
        id: string;
        class: {
            id: string;
            name: string;
            section?: string;
            level: {
                id: string;
                name: string;
            };
        };
        status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
        rollNumber?: string;
    }>;
    currentClass?: {
        id: string;
        name: string;
        section?: string;
        level?: {
            id: string;
            name: string;
        };
        rollNumber?: string;
        status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    };
    hasParents: boolean;
    parentNames: string;
}

async function fetchClassById(classId: string) {
    console.log(`Fetching class with ID: ${classId}`);
    const res = await fetch(`/api/classes/${classId}`);

    if (!res.ok) {
        console.error(`Failed to fetch class ${classId}. Status: ${res.status}`);
        return null;
    }

    const data = await res.json();
    console.log(`Class data received for ${classId}:`, data);
    return data;
}

export default function StudentsPage() {
    const router = useRouter()
    const [session, setSession] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [stats, setStats] = useState({
        total: 0,
        classes: 0,
        withParents: 0,
        levels: 0,
        active: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchSessionAndData() {
            try {
                setLoading(true);
                setError(null);

                // First fetch the session
                const sessionRes = await fetch('/api/auth/session');
                if (!sessionRes.ok) {
                    throw new Error('Failed to fetch session');
                }

                const sessionData = await sessionRes.json();
                if (!sessionData) {
                    router.push('/auth/signin');
                    return;
                }

                // Check if user has required role
                const allowedRoles = ['super_admin', 'school_admin', 'teacher'];
                const userRole = sessionData.role?.toLowerCase();
                if (!userRole || !allowedRoles.includes(userRole)) {
                    throw new Error('You do not have permission to access this page');
                }

                setSession(sessionData);

                // Fetch students data with proper error handling
                const studentsRes = await fetch('/api/students', {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                    },
                });

                if (!studentsRes.ok) {
                    const errorData = await studentsRes.json();
                    throw new Error(errorData.message || "Failed to fetch students");
                }

                const studentsData = await studentsRes.json() as Student[];
                console.log('Raw students data from API:', studentsData);

                // Calculate stats from the transformed data
                const stats = {
                    total: studentsData.length,
                    classes: studentsData.filter((s: Student) =>
                        s.currentClass && s.currentClass.status === 'ACTIVE'
                    ).length,
                    withParents: studentsData.filter((s: Student) => s.hasParents).length,
                    levels: new Set(studentsData
                        .filter((s: Student) => s.currentClass?.level?.id && s.currentClass.status === 'ACTIVE')
                        .map((s: Student) => s.currentClass!.level!.id)
                    ).size,
                    active: studentsData.filter((s: Student) =>
                        s.currentClass?.status === 'ACTIVE'
                    ).length,
                };

                console.log('Calculated stats:', stats);

                setStudents(studentsData);
                setStats(stats);

            } catch (error) {
                console.error("Error:", error);
                if (error instanceof Error) {
                    setError(error.message);
                } else {
                    setError("An unexpected error occurred");
                }
                toast.error("Error loading students data");
            } finally {
                setLoading(false);
            }
        }

        fetchSessionAndData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error || !session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-destructive">{error || "Not authorized"}</p>
                <Button onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Students"
                text="Manage student profiles and track academic progress"
                showBanner={true}
            />

            <StudentsClient
                students={students}
                stats={stats}
                error={undefined}
            />
        </div>
    )
} 