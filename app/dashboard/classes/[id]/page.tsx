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
import { ArrowLeft, BookOpen, GraduationCap, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

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

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
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
                <StatsSkeleton />
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
            {/* Hero Header */}
            <div
                className="w-full p-8 relative overflow-hidden"
                style={{
                    background: `linear-gradient(45deg, ${schoolColors.primaryColor}, ${schoolColors.secondaryColor})`,
                }}
            >
                <div className="absolute inset-0 bg-grid-white/15 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
                <div className="container relative z-10">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push("/dashboard/classes")}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Classes
                    </Button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{classDetails.name}</h1>
                            <div className="flex items-center gap-3">
                                {classDetails.section && (
                                    <Badge variant="secondary" className="text-white bg-white/20">
                                        Section {classDetails.section}
                                    </Badge>
                                )}
                                {classDetails.level && (
                                    <Badge variant="secondary" className="text-white bg-white/20">
                                        {classDetails.level.name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        {classDetails.teacher && (
                            <div className="hidden md:flex items-center bg-white/10 rounded-lg p-3">
                                <Avatar className="h-10 w-10 mr-3">
                                    <AvatarImage
                                        src={classDetails.teacher.user.profileImage || undefined}
                                        alt={classDetails.teacher.user.name}
                                    />
                                    <AvatarFallback>
                                        {getInitials(classDetails.teacher.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-white">
                                    <p className="font-medium">{classDetails.teacher.user.name}</p>
                                    <p className="text-sm text-white/80">Class Teacher</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-blue-100 mr-4">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Students</p>
                                <h3 className="text-2xl font-bold">{classDetails.students?.length || 0}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center">
                            <div className="rounded-full p-3 bg-amber-100 mr-4">
                                <BookOpen className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Subjects</p>
                                <h3 className="text-2xl font-bold">{classDetails.subjects?.length || 0}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="md:hidden">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground mb-1">Class Teacher</p>
                            {classDetails.teacher ? (
                                <div className="flex items-center">
                                    <Avatar className="h-8 w-8 mr-2">
                                        <AvatarImage
                                            src={classDetails.teacher.user.profileImage || undefined}
                                            alt={classDetails.teacher.user.name}
                                        />
                                        <AvatarFallback>
                                            {getInitials(classDetails.teacher.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{classDetails.teacher.user.name}</span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground">No teacher assigned</span>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Content Tabs */}
                <Tabs defaultValue="students" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="students">Students</TabsTrigger>
                        <TabsTrigger value="subjects">Subjects</TabsTrigger>
                    </TabsList>

                    <TabsContent value="students">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Enrolled Students</CardTitle>
                                    <Button variant="outline" size="sm">
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
                                        {classDetails.students?.map((enrollment) => (
                                            <TableRow key={enrollment.student.user.email}>
                                                <TableCell className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage
                                                            src={enrollment.student.user.profileImage || undefined}
                                                            alt={enrollment.student.user.name}
                                                        />
                                                        <AvatarFallback>
                                                            {getInitials(enrollment.student.user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">
                                                        {enrollment.student.user.name}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {enrollment.student.department?.name || "-"}
                                                </TableCell>
                                                <TableCell>{enrollment.student.user.email}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">
                                                        View Profile
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="subjects">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Assigned Subjects</CardTitle>
                                    <Button variant="outline" size="sm">
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Add Subject
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {classDetails.subjects?.map((subjectClass) => (
                                        <Card key={subjectClass.subject.id}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">
                                                            {subjectClass.subject.name}
                                                        </h4>
                                                        {subjectClass.subject.code && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Code: {subjectClass.subject.code}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button variant="ghost" size="sm">
                                                        View Details
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
} 