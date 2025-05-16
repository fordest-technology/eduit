"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, Calendar, BookOpen, Users, Clock } from "lucide-react"
import { SessionsTable } from "./sessions-table"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/app/components/dashboard-header"

interface Session {
    id: string
    name: string
    startDate: string
    endDate: string
    isCurrent: boolean
    isActive: boolean
    schoolId: string
    school: {
        id: string
        name: string
    }
    _count: {
        studentClasses: number
        attendance: number
        results: number
    }
    createdAt: string
    updatedAt: string
}

interface School {
    id: string
    name: string
}

export default function SessionsPage() {
    const router = useRouter()
    const [session, setSession] = useState<any>(null)
    const [sessions, setSessions] = useState<Session[]>([])
    const [schools, setSchools] = useState<School[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        students: 0,
        currentSession: "None"
    })
    const [normalizedRole, setNormalizedRole] = useState<string>("")

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

                // Normalize role for consistent usage
                const normalizedRole = sessionData.role === "SCHOOL_ADMIN" ? "school_admin" : sessionData.role;
                setNormalizedRole(normalizedRole)

                // Only admin can access this page
                if (normalizedRole !== "super_admin" && normalizedRole !== "school_admin") {
                    router.push("/dashboard")
                    return
                }

                // Fetch academic sessions - ensure proper filtering by schoolId for school_admin
                let url = '/api/sessions';

                // Add schoolId for filtering if school_admin
                if (normalizedRole === "school_admin" && sessionData.schoolId) {
                    url += `?schoolId=${sessionData.schoolId}`;
                }

                const sessionsRes = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                    },
                    credentials: 'include',
                    cache: 'no-store'
                })

                if (!sessionsRes.ok) {
                    const errorData = await sessionsRes.json()
                    console.error("Sessions fetch error:", errorData)

                    // Handle specific error cases
                    if (sessionsRes.status === 403) {
                        throw new Error("You don't have permission to view sessions. Please contact your administrator.")
                    } else if (sessionsRes.status === 401) {
                        router.push("/login")
                        return
                    }

                    throw new Error(errorData.message || "Failed to fetch academic sessions")
                }

                const sessionsData = await sessionsRes.json()

                // Ensure consistent isActive state and proper data structure
                const normalizedSessions = sessionsData.map((session: Session) => ({
                    ...session,
                    isActive: session.isCurrent,
                    startDate: session.startDate,
                    endDate: session.endDate,
                    schoolId: session.schoolId || sessionData.schoolId // Ensure schoolId is always set
                }))

                setSessions(normalizedSessions)

                // If super admin, fetch all schools for the dropdown
                if (normalizedRole === "super_admin") {
                    try {
                        const schoolsRes = await fetch('/api/schools', {
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        })

                        if (schoolsRes.ok) {
                            const schoolsData = await schoolsRes.json()
                            setSchools(schoolsData)
                        } else {
                            console.error("Failed to fetch schools")
                        }
                    } catch (error) {
                        console.error("Error fetching schools:", error)
                    }
                }

                // Calculate stats
                const activeCount = sessionsData.filter((s: Session) => s.isActive).length
                const studentCount = sessionsData.reduce((sum: number, s: Session) => sum + s._count.studentClasses, 0)
                const currentSessionObj = sessionsData.find((s: Session) => s.isCurrent)

                setStats({
                    total: sessionsData.length,
                    active: activeCount,
                    students: studentCount,
                    currentSession: currentSessionObj ? currentSessionObj.name : "None"
                })

            } catch (error) {
                console.error("Error:", error)
                if (error instanceof Error) {
                    setError(error.message)
                } else {
                    setError("An unexpected error occurred")
                }
                toast.error("Error loading academic sessions data")
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
                heading="Academic Sessions"
                text="Create and manage academic sessions for your school"
                showBanner={true}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                            <Calendar className="mr-2 h-5 w-5" />
                            Total Sessions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-800">{stats.total}</p>
                        <p className="text-sm text-blue-600 mt-1">Academic periods</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-green-700">
                            <Clock className="mr-2 h-5 w-5" />
                            Active Sessions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-800">{stats.active}</p>
                        <p className="text-sm text-green-600 mt-1">Currently running</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                            <Users className="mr-2 h-5 w-5" />
                            Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-purple-800">{stats.students}</p>
                        <p className="text-sm text-purple-600 mt-1">Enrolled across sessions</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-amber-700">
                            <BookOpen className="mr-2 h-5 w-5" />
                            Current Session
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold text-amber-800 truncate">{stats.currentSession}</p>
                        <p className="text-sm text-amber-600 mt-1">Default for new entries</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/10 shadow-md">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle>Academic Sessions</CardTitle>
                    <CardDescription>Manage school years, terms, and enrollment periods</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <SessionsTable
                        initialSessions={sessions}
                        schools={schools}
                        userRole={normalizedRole}
                        userSchoolId={session.schoolId ?? ""}
                    />
                </CardContent>
            </Card>
        </div>
    )
} 