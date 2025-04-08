"use client"

import { useEffect, useState } from "react"
import { TeachersClient } from "./teachers-client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/app/components/dashboard-header"

export default function TeachersPage() {
    const router = useRouter()
    const [session, setSession] = useState<any>(null)
    const [teachers, setTeachers] = useState<any[]>([])
    const [stats, setStats] = useState({
        total: 0,
        subjects: 0,
        departments: 0,
        withClasses: 0
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

                // Fetch teachers data
                const teachersRes = await fetch('/api/teachers', {
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                    },
                })

                if (!teachersRes.ok) {
                    const errorData = await teachersRes.json()
                    throw new Error(errorData.message || "Failed to fetch teachers")
                }

                const teachersData = await teachersRes.json()

                // Format data for component use
                const formattedTeachers = teachersData.map((teacher: any) => {
                    // Ensure teacher.user exists before accessing properties
                    const user = teacher.user || teacher.teacher?.user || {}
                    // Ensure teacher.department exists before accessing properties
                    const department = teacher.department || teacher.teacher?.department || {}
                    // Ensure teacher.subjects exists
                    const subjects = teacher.subjects || teacher.teacher?.subjects || []

                    return {
                        id: teacher.id || teacher.teacher?.id,
                        name: user.name || "Unknown",
                        email: user.email || "",
                        profileImage: user.profileImage || null,
                        phone: teacher.phone || teacher.teacher?.phone || "",
                        department: department.name || "Not Assigned",
                        departmentId: teacher.departmentId || teacher.teacher?.departmentId,
                        subjects: Array.isArray(subjects)
                            ? subjects.map((s: any) => (s.subject?.name || "Unknown Subject")).join(", ")
                            : "None",
                        subjectCount: Array.isArray(subjects) ? subjects.length : 0,
                        gender: teacher.gender || teacher.teacher?.gender || "",
                        qualification: teacher.qualification || teacher.teacher?.qualification || "",
                        employmentStatus: teacher.employmentStatus || teacher.teacher?.employmentStatus || "Full-time",
                    }
                })

                setTeachers(formattedTeachers)

                // Calculate stats
                const uniqueSubjects = new Set()
                const uniqueDepartments = new Set()
                const teachersWithClasses = teachersData.filter((t: any) => {
                    const classes = t.classes || t.teacher?.classes || []
                    return Array.isArray(classes) && classes.length > 0
                }).length

                teachersData.forEach((teacher: any) => {
                    // Handle both direct and nested structures
                    const departmentId = teacher.departmentId || teacher.teacher?.departmentId
                    const subjects = teacher.subjects || teacher.teacher?.subjects || []

                    if (departmentId) uniqueDepartments.add(departmentId)

                    if (Array.isArray(subjects)) {
                        subjects.forEach((s: any) => {
                            const subjectId = s.subjectId || s.subject?.id
                            if (subjectId) uniqueSubjects.add(subjectId)
                        })
                    }
                })

                setStats({
                    total: teachersData.length,
                    subjects: uniqueSubjects.size,
                    departments: uniqueDepartments.size,
                    withClasses: teachersWithClasses
                })

            } catch (error) {
                console.error("Error:", error)
                if (error instanceof Error) {
                    setError(error.message)
                } else {
                    setError("An unexpected error occurred")
                }
                toast.error("Error loading teachers data")
            } finally {
                setLoading(false)
            }
        }

        fetchSessionAndData()
    }, [router])

    // if (loading) {
    //     return (
    //         <div className="flex items-center justify-center min-h-screen">
    //             <Loader2 className="h-8 w-8 animate-spin" />
    //         </div>
    //     )
    // }

    // if (error || !session) {
    //     return (
    //         <div className="flex flex-col items-center justify-center min-h-screen gap-4">
    //             <p className="text-red-500">{error || "Not authorized"}</p>
    //             <Button onClick={() => router.push("/dashboard")}>
    //                 Back to Dashboard
    //             </Button>
    //         </div>
    //     )
    // }

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