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

export default function ParentsPage() {
    const router = useRouter()
    const [session, setSession] = useState<any>(null)
    const [parents, setParents] = useState<any[]>([])
    const [totalStudents, setTotalStudents] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [schoolData, setSchoolData] = useState<any>(null)

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

                // Only admin and school admin can access this page
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

                // Fetch existing parents
                await fetchParents()

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

    const fetchParents = async () => {
        try {
            const parentsRes = await fetch("/api/parents")
            if (!parentsRes.ok) {
                throw new Error("Failed to fetch parents")
            }

            const parentsData = await parentsRes.json()

            // Format parent data to include child count and related information
            const formattedParents = parentsData.map((parent: any) => ({
                id: parent.id,
                name: parent.name,
                email: parent.email,
                profileImage: parent.profileImage,
                phone: parent.phone,
                childrenCount: parent.parent?.children?.length || 0,
                children: parent.parent?.children?.map((child: any) => child.student?.user?.name).join(", ") || ""
            }))

            setParents(formattedParents)

            // Calculate total students
            let totalStudents = 0
            formattedParents.forEach((parent: any) => {
                totalStudents += parent.childrenCount || 0
            })
            setTotalStudents(totalStudents)

            return formattedParents
        } catch (error) {
            console.error("Error fetching parents:", error)
            toast.error("Failed to load parents")
            return []
        }
    }

    const refreshData = async () => {
        await fetchParents()
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
                heading="Parents Management"
                text="Create and manage parent accounts and link them to students"
                showBanner={true}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                            <Users className="mr-2 h-5 w-5" />
                            Total Parents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-800">{parents.length}</p>
                        <p className="text-sm text-blue-600 mt-1">Registered parent accounts</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                            <UserPlus className="mr-2 h-5 w-5" />
                            Connected Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-purple-800">{totalStudents}</p>
                        <p className="text-sm text-purple-600 mt-1">Students linked to parents</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
                            <Mail className="mr-2 h-5 w-5" />
                            Communications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-800">
                            {parents.length > 0 ? "Active" : "None"}
                        </p>
                        <p className="text-sm text-emerald-600 mt-1">Parent portal access</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/10 shadow-md">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle>Parents Directory</CardTitle>
                    <CardDescription>Create, manage, and link parent accounts to students</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <ParentsTable
                        userRole={session.role}
                        schoolId={session.schoolId}
                        initialParents={parents}
                        onDataChange={refreshData}
                    />
                </CardContent>
            </Card>
        </div>
    )
} 