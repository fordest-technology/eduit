"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, BookOpen, GraduationCap, Users, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { AddStudentClassModal } from "@/components/add-student-class-modal"
// import { DashboardHeader } from "@/app/components/dashboard-header"

interface User {
    name: string
    email: string
    profileImage: string | null
}

interface Department {
    id: string
    name: string
}

interface Teacher {
    user: User
    department: Department | null
}

interface Student {
    user: User
    department: Department | null
}

interface Subject {
    id: string
    name: string
    code: string | null
}

interface ClassDetails {
    id: string
    name: string
    section: string | null
    teacher: Teacher | null
    level: {
        id: string
        name: string
    } | null
    subjects: Array<{
        subject: Subject
    }>
    students: Array<{
        student: Student
    }>
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
}

function StatsCards({ studentsCount, subjectsCount, teacher }: { studentsCount: number, subjectsCount: number, teacher: Teacher | null }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                        <Users className="mr-2 h-5 w-5" />
                        Students
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold text-blue-800">{studentsCount}</p>
                    <p className="text-sm text-blue-600 mt-1">Total Students</p>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium flex items-center text-amber-700">
                        <BookOpen className="mr-2 h-5 w-5" />
                        Subjects
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold text-amber-800">{subjectsCount}</p>
                    <p className="text-sm text-amber-600 mt-1">Assigned Subjects</p>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium flex items-center text-green-700">
                        <GraduationCap className="mr-2 h-5 w-5" />
                        Teacher
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {teacher ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={teacher.user.profileImage || undefined} alt={teacher.user.name} />
                                <AvatarFallback>{getInitials(teacher.user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{teacher.user.name}</div>
                                <div className="text-xs text-muted-foreground">Class Teacher</div>
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">No teacher assigned</span>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function StudentsTable({ students }: { students: Array<{ student: Student }> }) {
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
    const params = useParams()

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Enrolled Students</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddStudentModalOpen(true)}
                    >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Add Student
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((enrollment) => (
                            <TableRow key={enrollment.student.user.email}>
                                <TableCell className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={enrollment.student.user.profileImage || undefined} alt={enrollment.student.user.name} />
                                        <AvatarFallback>{getInitials(enrollment.student.user.name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{enrollment.student.user.name}</span>
                                </TableCell>
                                <TableCell>{enrollment.student.department?.name || "-"}</TableCell>
                                <TableCell>{enrollment.student.user.email}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">View Profile</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <AddStudentClassModal
                open={isAddStudentModalOpen}
                onOpenChange={setIsAddStudentModalOpen}
                classId={params.id as string}
                onSuccess={() => {
                    // Refresh the page to show updated student list
                    window.location.reload()
                }}
            />
        </Card>
    )
}

function SubjectsGrid({ subjects }: { subjects: Array<{ subject: Subject }> }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Assigned Subjects</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((subjectClass) => (
                        <Card key={subjectClass.subject.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold">{subjectClass.subject.name}</h4>
                                        {subjectClass.subject.code && (
                                            <p className="text-sm text-muted-foreground">Code: {subjectClass.subject.code}</p>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm">View Details</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export default function ClassDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
    const [schoolColors, setSchoolColors] = useState({
        primaryColor: "#3b82f6",
        secondaryColor: "#1f2937"
    })

    useEffect(() => {
        async function fetchClassDetails() {
            try {
                setLoading(true)
                const response = await fetch(`/api/classes/${params.id}`)
                if (!response.ok) {
                    throw new Error("Failed to fetch class details")
                }
                const data = await response.json()
                setClassDetails(data)
                setError(null)
            } catch (error) {
                console.error("Error fetching class details:", error)
                setError("Failed to load class details")
                toast.error("Failed to load class details")
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchClassDetails()
        }
    }, [params.id])

    if (loading) {
        return (
            <div className="container py-6">
                <div className="flex items-center gap-2 mb-8">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <StatsCards
                    studentsCount={0}
                    subjectsCount={0}
                    teacher={null}
                />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-32" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-20 w-full" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container py-6">
                <div className="bg-destructive/15 p-4 rounded-md">
                    <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
                    <p>{error}</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.push("/dashboard/classes")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Classes
                    </Button>
                </div>
            </div>
        )
    }

    if (!classDetails) {
        return null
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading={classDetails.name}
                text={`Section ${classDetails.section || "-"} | ${classDetails.level?.name || "-"}`}
                showBanner={true}
            />
            <div className="container space-y-6">
                <StatsCards
                    studentsCount={classDetails.students?.length || 0}
                    subjectsCount={classDetails.subjects?.length || 0}
                    teacher={classDetails.teacher}
                />
                <Tabs defaultValue="students" className="space-y-6">
                    <TabsList className="flex gap-2 bg-muted p-1 rounded-lg w-fit">
                        <TabsTrigger
                            value="students"
                            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:rounded-md transition-colors"
                        >
                            <GraduationCap className="h-4 w-4" />
                            Students
                        </TabsTrigger>
                        <TabsTrigger
                            value="subjects"
                            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:rounded-md transition-colors"
                        >
                            <BookOpen className="h-4 w-4" />
                            Subjects
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="students">
                        <StudentsTable students={classDetails.students} />
                    </TabsContent>
                    <TabsContent value="subjects">
                        <SubjectsGrid subjects={classDetails.subjects} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
} 