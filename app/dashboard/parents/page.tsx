"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Mail, UserPlus, BookOpen, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { ParentsTable } from "@/app/dashboard/parents/parents-table"
import { UserRole } from "@prisma/client"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface UserSession {
    id: string
    role: UserRole
    schoolId: string
    email: string
    name: string
}

interface Parent {
    id: string
    name: string
    email: string
    phone?: string | null
    childrenCount: number
    createdAt: string
}

interface ParentStats {
    total: number
    withChildren: number
    totalChildren: number
    activeChildren: number
}

interface SchoolColors {
    primaryColor: string
    secondaryColor: string
}

const defaultColors: SchoolColors = {
    primaryColor: "#3b82f6",
    secondaryColor: "#1f2937"
}

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                    <CardContent className="pt-6">
                        <div className="flex items-center">
                            <Skeleton className="h-12 w-12 rounded-full mr-4" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export default function ParentsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [parents, setParents] = useState<Parent[]>([])
    const [stats, setStats] = useState<ParentStats>({
        total: 0,
        withChildren: 0,
        totalChildren: 0,
        activeChildren: 0
    })
    const [schoolColors, setSchoolColors] = useState<SchoolColors>(defaultColors)

    useEffect(() => {
        async function fetchData() {
            try {
                // Get session
                const sessionRes = await fetch('/api/auth/session')
                if (!sessionRes.ok) {
                    throw new Error('Failed to fetch session')
                }

                const session = await sessionRes.json()
                if (!session) {
                    router.push("/login")
                    return
                }

                // Only SUPER_ADMIN and SCHOOL_ADMIN can access this page
                if (![UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN].includes(session.role)) {
                    router.push("/dashboard")
                    return
                }

                // Fetch parents data
                const parentsRes = await fetch('/api/parents')
                if (!parentsRes.ok) {
                    throw new Error('Failed to fetch parents')
                }

                const data = await parentsRes.json()
                setParents(data.parents || [])
                setStats(data.stats || {
                    total: 0,
                    withChildren: 0,
                    totalChildren: 0,
                    activeChildren: 0
                })
                if (data.schoolColors?.primaryColor && data.schoolColors?.secondaryColor) {
                    setSchoolColors({
                        primaryColor: data.schoolColors.primaryColor,
                        secondaryColor: data.schoolColors.secondaryColor
                    })
                }
            } catch (error) {
                console.error("Error:", error)
                setError(error instanceof Error ? error.message : "An unexpected error occurred")
                toast.error("Error loading parents data")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [router])

    if (loading) {
        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading="Parents"
                    text="Manage parent accounts and their connections with students"
                    showBanner={true}
                />
                <StatsSkeleton />
                <div className="border rounded-lg overflow-hidden p-6 bg-white">
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => router.push("/dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Parents"
                text="Manage parent accounts and their connections with students"
                showBanner={true}
            />

            {/* Stats Cards */}
            <Suspense fallback={<StatsSkeleton />}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-blue-100 mr-4">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Parents</p>
                                <h3 className="text-2xl font-bold">{stats.total}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-green-100 mr-4">
                                <UserPlus className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Parents with Children</p>
                                <h3 className="text-2xl font-bold">{stats.withChildren}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-purple-100 mr-4">
                                <BookOpen className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Children</p>
                                <h3 className="text-2xl font-bold">{stats.totalChildren}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-orange-100 mr-4">
                                <Mail className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Active Children</p>
                                <h3 className="text-2xl font-bold">{stats.activeChildren}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Suspense>

            {/* Parents Table */}
            <div className="border rounded-lg overflow-hidden p-6 bg-white">
                <ParentsTable parents={parents} />
            </div>
        </div>
    )
} 