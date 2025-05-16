"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import TeacherDetails from "./teacher-details"
import TeacherClasses from "./teacher-classes"
import TeacherSubjects from "./teacher-subjects"
import { UserRole } from "@prisma/client"

interface SessionData {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    schoolId: string | null;
    profileImage: string | null;
    teacherId?: string;
}

export default function TeacherPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const activeTab = searchParams.get("tab") || "details"
    const [session, setSession] = useState<SessionData | null>(null)
    const [teacher, setTeacher] = useState<any>(null)
    const [availableClasses, setAvailableClasses] = useState<any[]>([])
    const [availableSubjects, setAvailableSubjects] = useState<any[]>([])
    const [currentSubjects, setCurrentSubjects] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function fetchData() {
        try {
            setLoading(true)
            setError(null)

            // Get session
            const sessionRes = await fetch('/api/auth/session')
            if (!sessionRes.ok) {
                throw new Error('Failed to fetch session')
            }

            const sessionData: SessionData = await sessionRes.json()
            setSession(sessionData)

            // If no session or not allowed, redirect
            if (!sessionData) {
                router.push("/login")
                return
            }

            // Check permissions
            if (
                sessionData.role !== UserRole.SUPER_ADMIN &&
                sessionData.role !== UserRole.SCHOOL_ADMIN &&
                sessionData.role !== UserRole.TEACHER
            ) {
                router.push("/dashboard")
                return
            }

            // Check if teacher is accessing another teacher's profile
            if (sessionData.role === UserRole.TEACHER && sessionData.teacherId !== params.id) {
                router.push("/dashboard")
                return
            }

            // Fetch teacher data
            const teacherRes = await fetch(`/api/teachers/${params.id}`)
            if (!teacherRes.ok) {
                throw new Error("Failed to fetch teacher details")
            }

            const teacherData = await teacherRes.json()
            setTeacher(teacherData)

            // Fetch available classes
            const classesRes = await fetch('/api/classes')
            if (classesRes.ok) {
                const classesData = await classesRes.json()
                setAvailableClasses(classesData)
            }

            // Fetch available subjects
            const subjectsRes = await fetch('/api/subjects')
            if (subjectsRes.ok) {
                const subjectsData = await subjectsRes.json()
                setAvailableSubjects(subjectsData)
            }

            // Set current subjects from teacher data
            if (teacherData.teacherSubjects) {
                setCurrentSubjects(teacherData.teacherSubjects.map((ts: any) => ({
                    id: ts.subject.id,
                    name: ts.subject.name
                })))
            }

            // Fetch departments
            const departmentsRes = await fetch('/api/departments')
            if (departmentsRes.ok) {
                const departmentsData = await departmentsRes.json()
                setDepartments(departmentsData)
            }
        } catch (error) {
            console.error("Error:", error)
            if (error instanceof Error) {
                setError(error.message)
            } else {
                setError("An unexpected error occurred")
            }
            toast.error("Error loading teacher details")
        } finally {
            setLoading(false)
        }
    }

    // Initial data fetch
    useEffect(() => {
        fetchData()
    }, [params.id])

    // Listen for router changes to refresh data
    useEffect(() => {
        const handleRouteChange = () => {
            fetchData()
        }

        window.addEventListener('popstate', handleRouteChange)
        return () => {
            window.removeEventListener('popstate', handleRouteChange)
        }
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error || !session || !teacher) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-red-500 mb-4">{error || "Not found or not authorized"}</p>
                <Button onClick={() => router.push("/dashboard/teachers")}>
                    Back to Teachers
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10">
            <div className="mb-8">
                <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/teachers")}
                    className="mb-4"
                >
                    Back to Teachers
                </Button>
            </div>

            <Tabs defaultValue={activeTab} value={activeTab} className="w-full">
                {/* <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                    <TabsTrigger value="subjects">Subjects</TabsTrigger>
                </TabsList> */}

                <TabsContent value="details">
                    <TeacherDetails
                        teacher={teacher}
                        availableClasses={availableClasses}
                        availableSubjects={availableSubjects}
                        currentSubjects={currentSubjects}
                        departments={departments}
                        onUpdate={fetchData}
                    />
                </TabsContent>

                <TabsContent value="classes">
                    <TeacherClasses teacher={teacher} onUpdate={fetchData} />
                </TabsContent>

                <TabsContent value="subjects">
                    <TeacherSubjects teacher={teacher} onUpdate={fetchData} />
                </TabsContent>
            </Tabs>
        </div>
    )
}