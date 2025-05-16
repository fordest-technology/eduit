"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Loader2, Users, Mail, UserPlus, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/app/components/dashboard-header"
import ParentsTable from "./parents-table"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { ParentsClient } from "./parents-client"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface UserSession {
    id: string
    role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT" | "STUDENT"
    schoolId: string
    email: string
    name: string
}

interface School {
    id: string
    name: string
    address: string
    phone: string
    email: string
    logo?: string
}

interface Parent {
    id: string
    name: string
    email: string
    profileImage?: string
    phone?: string | null
    childrenCount: number
}

interface SchoolColors {
    primaryColor: string
    secondaryColor: string
}

const defaultColors: SchoolColors = {
    primaryColor: "#3b82f6",
    secondaryColor: "#1f2937"
}

async function getData(schoolId: string) {
    try {
        const [parents, school] = await Promise.all([
            prisma.user.findMany({
                where: {
                    role: UserRole.PARENT,
                    schoolId,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                    parent: {
                        select: {
                            phone: true,
                            _count: {
                                select: {
                                    children: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    name: "asc"
                }
            }),
            prisma.school.findUnique({
                where: {
                    id: schoolId,
                },
                select: {
                    name: true,
                    primaryColor: true,
                    secondaryColor: true,
                }
            })
        ])

        return {
            parents: parents.map(parent => ({
                id: parent.id,
                name: parent.name,
                email: parent.email,
                profileImage: parent.profileImage,
                phone: parent.parent?.phone,
                childrenCount: parent.parent?._count?.children || 0
            })),
            schoolColors: {
                primaryColor: school?.primaryColor || "#3b82f6",
                secondaryColor: school?.secondaryColor || "#1f2937",
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error)
        throw new Error("Failed to load data")
    }
}

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[1, 2].map((i) => (
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
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
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
        <div className="container py-6">
            {/* Hero section */}
            <div
                className="w-full p-8 mb-6 rounded-lg relative overflow-hidden"
                style={{
                    background: `linear-gradient(45deg, ${schoolColors.primaryColor}, ${schoolColors.secondaryColor})`
                }}
            >
                <div className="absolute inset-0 bg-grid-white/15 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Parent Management</h1>
                    <p className="text-white text-opacity-90 max-w-2xl">
                        Manage parent accounts and their connections with students
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <Suspense fallback={<StatsSkeleton />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-blue-100 mr-4">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Parents</p>
                                <h3 className="text-2xl font-bold">{parents.length}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-green-100 mr-4">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Children</p>
                                <h3 className="text-2xl font-bold">
                                    {parents.reduce((acc, parent) => acc + parent.childrenCount, 0)}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Suspense>

            {/* Parents Table */}
            <div className="border rounded-lg overflow-hidden p-6 bg-white">
                <ParentsClient parents={parents} />
            </div>
        </div>
    )
} 