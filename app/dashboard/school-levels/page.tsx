"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Loader2, School, GraduationCap, BookOpen } from "lucide-react"
import { SchoolLevelTable } from "./school-level-table"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/app/components/dashboard-header"

interface SchoolLevel {
    id: string;
    name: string;
    description: string | null;
    order: number;
    _count: {
        classes: number;
        subjects: number;
    };
    classes: Array<{
        _count: {
            students: number;
            subjects: number;
        };
    }>;
    createdAt: string;
    updatedAt: string;
    schoolId: string;
}

export default function SchoolLevelsPage() {
    const router = useRouter()
    const [session, setSession] = useState<any>(null)
    const [levels, setLevels] = useState<SchoolLevel[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [schoolData, setSchoolData] = useState<any>(null)

    // Calculate total students across all levels
    const totalStudents = levels.reduce((sum, level) => {
        return sum + level.classes.reduce((classSum, cls) => classSum + (cls._count?.students || 0), 0);
    }, 0);

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

                // Only admin can access this page
                if (sessionData.role !== "super_admin" && sessionData.role !== "school_admin") {
                    router.push("/dashboard")
                    return
                }

                if (!sessionData.schoolId) {
                    router.push("/dashboard")
                    return
                }

                // Fetch school data
                const schoolRes = await fetch("/api/schools/current")
                if (schoolRes.ok) {
                    const schoolData = await schoolRes.json()
                    setSchoolData(schoolData.school)
                }

                // Fetch existing school levels
                const levelsRes = await fetch("/api/school-levels")
                if (!levelsRes.ok) {
                    throw new Error("Failed to fetch school levels")
                }

                const levelsData = await levelsRes.json()
                setLevels(levelsData)

            } catch (error) {
                console.error("Error:", error)
                if (error instanceof Error) {
                    setError(error.message)
                } else {
                    setError("An unexpected error occurred")
                }
                toast.error("Error loading page")
            } finally {
                setLoading(false)
            }
        }

        fetchSessionAndData()
    }, [router])

    const refreshData = async () => {
        try {
            const response = await fetch("/api/school-levels")
            if (!response.ok) {
                throw new Error("Failed to refresh school levels")
            }
            const data = await response.json()
            setLevels(data)
        } catch (error) {
            toast.error("Failed to refresh school levels")
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error || !session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-red-500 mb-4">{error || "Not authorized"}</p>
                <Button onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="School Levels"
                text="Create and manage academic levels for your institution"
                showBanner={true}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                            <School className="mr-2 h-5 w-5" />
                            Total Levels
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-800">{levels.length}</p>
                        <p className="text-sm text-blue-600 mt-1">Academic progression paths</p>
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
                        <p className="text-3xl font-bold text-purple-800">
                            {levels.reduce((sum, level) => sum + (level._count?.classes || 0), 0)}
                        </p>
                        <p className="text-sm text-purple-600 mt-1">Total classes across all levels</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
                            <BookOpen className="mr-2 h-5 w-5" />
                            Subjects
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-800">
                            {levels.reduce((sum, level) => sum + (level._count?.subjects || 0), 0)}
                        </p>
                        <p className="text-sm text-emerald-600 mt-1">Total subjects across all levels</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/10 shadow-md">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle>School Levels</CardTitle>
                    <CardDescription>Create and manage educational levels for your school</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <SchoolLevelTable
                        userRole={session.role}
                        schoolId={session.schoolId}
                        initialLevels={levels}
                        onDataChange={refreshData}
                    />
                </CardContent>
            </Card>
        </div>
    )
} 