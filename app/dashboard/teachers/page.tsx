"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { TeachersClient } from "./teachers-client"
import { Button } from "@/components/ui/button"
import { Teacher, User, Department, UserRole } from "@prisma/client"

interface TeacherData {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    phone: string | null;
    employeeId: string | null;
    qualifications: string | null;
    specialization: string | null;
    joiningDate: Date | null;
    departmentId: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    emergencyContact: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    department?: Department;
    stats: {
        totalClasses: number;
        totalStudents: number;
        totalSubjects: number;
    };
    subjects: Array<{
        id: string;
        name: string;
    }>;
    classes: Array<{
        id: string;
        name: string;
        studentCount: number;
    }>;
}

interface TeacherStats {
    total: number;
    subjects: number;
    departments: number;
    withClasses: number;
    activeStudents: number;
    activeClasses: number;
}

interface SessionData {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    schoolId: string | null;
    profileImage: string | null;
}

interface TeachersResponse {
    teachers: TeacherData[];
    stats: TeacherStats;
}

export default function TeachersPage() {
    const router = useRouter()
    const [session, setSession] = useState<SessionData | null>(null)
    const [teachers, setTeachers] = useState<TeacherData[]>([])
    const [stats, setStats] = useState<TeacherStats>({
        total: 0,
        subjects: 0,
        departments: 0,
        withClasses: 0,
        activeStudents: 0,
        activeClasses: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchSessionAndData() {
            try {
                setLoading(true)
                // Get session
                const sessionRes = await fetch('/api/auth/session')
                if (!sessionRes.ok) {
                    throw new Error('Failed to fetch session')
                }

                const sessionData: SessionData = await sessionRes.json()
                setSession(sessionData)

                // If no session or not allowed role, redirect
                if (!sessionData ||
                    (sessionData.role !== UserRole.SUPER_ADMIN &&
                        sessionData.role !== UserRole.SCHOOL_ADMIN)) {
                    router.push("/login")
                    return
                }

                // Fetch teachers data
                const teachersRes = await fetch('/api/teachers')
                if (!teachersRes.ok) {
                    throw new Error("Failed to fetch teachers")
                }

                const data: TeachersResponse = await teachersRes.json()

                // Ensure we have both teachers and stats
                if (!data.teachers || !Array.isArray(data.teachers)) {
                    throw new Error("Invalid teachers data received")
                }

                setTeachers(data.teachers)
                setStats(data.stats || {
                    total: 0,
                    subjects: 0,
                    departments: 0,
                    withClasses: 0,
                    activeStudents: 0,
                    activeClasses: 0
                })

            } catch (error) {
                console.error("Error:", error)
                setError(error instanceof Error ? error.message : "An unexpected error occurred")
                toast.error("Error loading teachers data")
            } finally {
                setLoading(false)
            }
        }

        fetchSessionAndData()
    }, [router])

    if (loading) {
        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading="Teachers"
                    text="Manage teacher profiles and their academic assignments"
                    showBanner={true}
                />
                <TeachersClient
                    teachers={[]}
                    stats={{
                        total: 0,
                        subjects: 0,
                        departments: 0,
                        withClasses: 0,
                        activeStudents: 0,
                        activeClasses: 0
                    }}
                    error={undefined}
                />
            </div>
        )
    }

    if (error || !session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-destructive">{error || "Not authorized"}</p>
                <Button onClick={() => router.push("/login")}>
                    Back to Login
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Teachers"
                text="Manage teacher profiles and their academic assignments"
                showBanner={true}
            />

            <TeachersClient
                teachers={teachers}
                stats={stats}
                error={undefined}
            />
        </div>
    )
} 