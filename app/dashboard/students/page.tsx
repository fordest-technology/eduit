"use client"

import { useEffect, useState } from "react"
import { StudentsClient } from "./students-client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/app/components/dashboard-header"

export default function StudentsPage() {
    const router = useRouter()
    const [session, setSession] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [stats, setStats] = useState({
        total: 0,
        classes: 0,
        withParents: 0,
        levels: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchSessionAndData() {
            try {
                // Get session
                const sessionRes = await fetch('/api/auth/session')
                if (!sessionRes.ok) {
                    throw new Error('Failed to fetch session')
                }

                const sessionData = await sessionRes.json()
                setSession(sessionData)

                // If no session or not allowed, redirect
                if (!sessionData) {
                    router.push("/login")
                    return
                }

                // Fetch students data
                const studentsRes = await fetch('/api/students', {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                    },
                })

                if (!studentsRes.ok) {
                    const errorData = await studentsRes.json()
                    throw new Error(errorData.message || "Failed to fetch students")
                }

                const studentsData = await studentsRes.json()

                // Format data for component use
                const formattedStudents = studentsData.map((student: any) => {
                    // Ensure student.user exists before accessing properties
                    const user = student.user || {}

                    return {
                        id: student.id,
                        name: user.name || "Unknown",
                        email: user.email || "",
                        profileImage: user.profileImage || null,
                        rollNumber: student.rollNumber || "",
                        class: student.className || "Not Assigned",
                        classId: student.classId,
                        level: student.level || "Not Assigned",
                        levelId: student.levelId,
                        gender: student.gender || "",
                        parentNames: student.parentNames || "",
                        hasParents: !!student.parentCount && student.parentCount > 0,
                    }
                })

                setStudents(formattedStudents)

                // Calculate stats
                const uniqueClasses = new Set(studentsData.map((s: any) => s.classId).filter(Boolean))
                const uniqueLevels = new Set(studentsData.map((s: any) => s.levelId).filter(Boolean))
                const studentsWithParents = studentsData.filter((s: any) => s.parentCount && s.parentCount > 0)

                setStats({
                    total: studentsData.length,
                    classes: uniqueClasses.size,
                    withParents: studentsWithParents.length,
                    levels: uniqueLevels.size
                })

            } catch (error) {
                console.error("Error:", error)
                if (error instanceof Error) {
                    setError(error.message)
                } else {
                    setError("An unexpected error occurred")
                }
                toast.error("Error loading students data")
            } finally {
                setLoading(false)
            }
        }

        fetchSessionAndData()
    }, [router])

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
                <p className="text-red-500">{error || "Not authorized"}</p>
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