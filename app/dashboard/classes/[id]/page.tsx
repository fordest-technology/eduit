"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
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
import { ArrowLeft, BookOpen, Layers, School, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EditClassModal } from "@/components/edit-class-modal"
import { AddStudentClassModal } from "@/components/add-student-class-modal"
import { AssignTeacherModal } from "@/components/assign-teacher-modal"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { Skeleton } from "@/components/ui/skeleton"

interface Student {
    id: string;
    student: {
        id: string;
        user: {
            name: string;
            email: string;
            profileImage: string | null;
        };
        department: {
            id: string;
            name: string;
        } | null;
    };
    rollNumber: string | null;
}

interface ClassData {
    id: string;
    name: string;
    section: string | null;
    teacher: {
        user: {
            name: string;
            email: string;
            profileImage: string | null;
        };
        department: {
            id: string;
            name: string;
        } | null;
        specialization: string | null;
    } | null;
    level: {
        id: string;
        name: string;
    } | null;
    subjects: Array<{
        id: string;
        subject: {
            id: string;
            name: string;
            code: string;
        };
    }>;
    students: Student[];
    currentSession: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
    } | null;
    school?: {
        primaryColor: string;
        secondaryColor: string;
    };
}

function StatCardSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6 flex items-center">
                <div className="rounded-full p-3 bg-muted mr-4">
                    <Skeleton className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-12" />
                </div>
            </CardContent>
        </Card>
    );
}

function StudentRowSkeleton() {
    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full mr-2" />
                    <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell className="text-right">
                <Skeleton className="h-8 w-20 ml-auto" />
            </TableCell>
        </TableRow>
    );
}

export default function ClassDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { theme } = useTheme();

    const [mounted, setMounted] = useState(false);
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [session, setSession] = useState<any>(null);

    // Modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
    const [assignTeacherModalOpen, setAssignTeacherModalOpen] = useState(false);

    // Handle mounting state
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchClassData();
        }
    }, [id, mounted]);

    const fetchClassData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            // Fetch session info if not already loaded
            if (!session) {
                const sessionRes = await fetch('/api/auth/session');
                if (!sessionRes.ok) {
                    throw new Error('Failed to load session');
                }
                const sessionData = await sessionRes.json();
                setSession(sessionData);
            }

            // Fetch class details
            const classRes = await fetch(`/api/classes/${id}`);
            if (!classRes.ok) {
                throw new Error('Failed to load class data');
            }

            const classDetails = await classRes.json();
            setClassData(classDetails);
            setError(null);
        } catch (error) {
            console.error('Error fetching class data:', error);
            setError('Failed to load class data. Please try again later.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        try {
            const response = await fetch(`/api/classes/${id}/remove-student`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ studentId }),
            });

            if (!response.ok) {
                throw new Error("Failed to remove student from class");
            }

            toast.success("Student removed from class successfully");
            fetchClassData(true); // Refresh data
        } catch (error) {
            console.error("Error removing student:", error);
            toast.error("Failed to remove student from class");
        }
    };

    if (!mounted) {
        return null;
    }

    if (loading) {
        return (
            <div className="container py-6">
                {/* Banner skeleton */}
                <div className="w-full p-8 mb-6 rounded-lg bg-muted/20">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>

                {/* Stats Cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>

                {/* Class Info skeleton */}
                <div className="mb-8">
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-muted/20 p-4 rounded-lg">
                            <Skeleton className="h-6 w-40 mb-4" />
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-5 w-32 mb-2" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-muted/20 p-4 rounded-lg">
                            <Skeleton className="h-6 w-32 mb-4" />
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-6 w-28" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Students Table skeleton */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Student</TableHead>
                                    <TableHead>Roll Number</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[1, 2, 3].map((i) => (
                                    <StudentRowSkeleton key={i} />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !classData) {
        return (
            <div className="container py-6">
                <div className="bg-destructive/15 p-4 rounded-md">
                    <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
                    <p>{error || "Failed to load class details. Please try again later."}</p>
                </div>
            </div>
        );
    }

    // Get school colors for styling
    const schoolColors = {
        primaryColor: classData.school?.primaryColor || "#3b82f6",
        secondaryColor: classData.school?.secondaryColor || "#1f2937",
    };

    return (
        <div className="container py-6">
            {refreshing && (
                <div className="fixed top-4 right-4 bg-primary text-white px-4 py-2 rounded-md shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Refreshing...</span>
                    </div>
                </div>
            )}

            {/* Banner section */}
            <div
                className="w-full p-8 mb-6 rounded-lg relative overflow-hidden"
                style={{
                    background: `linear-gradient(45deg, ${schoolColors.primaryColor}, ${schoolColors.secondaryColor})`,
                }}
            >
                <div className="absolute inset-0 bg-grid-white/15 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-white/70 mb-4">
                        <Button asChild variant="ghost" className="text-white/90 hover:text-white p-0 hover:bg-transparent">
                            <Link href="/dashboard/classes" className="flex items-center">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                <span>Back to Classes</span>
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{classData.name} {classData.section ? `- ${classData.section}` : ''}</h1>
                    <p className="text-white text-opacity-90 max-w-2xl">
                        Manage students, view class information, and assign subjects for this class.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardContent className="pt-6 flex items-center">
                        <div className="rounded-full p-3 bg-blue-100 mr-4">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Students</p>
                            <h3 className="text-2xl font-bold">{classData.students?.length || 0}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center">
                        <div className="rounded-full p-3 bg-green-100 mr-4">
                            <School className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Teacher</p>
                            <h3 className="text-2xl font-bold">
                                {classData?.teacher?.user?.name || 'Not Assigned'}
                            </h3>
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
                            <h3 className="text-2xl font-bold">{classData.subjects?.length || 0}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Class Information and Actions */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Class Information</h2>
                    <div className="flex gap-2">
                        {(session?.role === "super_admin" || session?.role === "school_admin") && (
                            <>
                                <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                                    Edit Class
                                </Button>
                                <Button onClick={() => setAddStudentModalOpen(true)}>
                                    Add Student
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-muted/20 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">Teacher Information</h3>
                            {(session?.role === "super_admin" || session?.role === "school_admin") && !classData.teacher && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAssignTeacherModalOpen(true)}
                                >
                                    Assign Teacher
                                </Button>
                            )}
                        </div>
                        {classData.teacher ? (
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage
                                        src={classData.teacher?.user?.profileImage || ''}
                                        alt={classData.teacher?.user?.name || 'Teacher'}
                                    />
                                    <AvatarFallback>
                                        {classData.teacher?.user?.name?.charAt(0) || 'T'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{classData.teacher?.user?.name || 'Unknown Teacher'}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {classData.teacher?.specialization || 'No specialization listed'}
                                    </div>
                                </div>
                                {(session?.role === "super_admin" || session?.role === "school_admin") && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="ml-auto"
                                        onClick={() => setAssignTeacherModalOpen(true)}
                                    >
                                        Change
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No teacher assigned to this class yet.</p>
                        )}
                    </div>

                    <div className="bg-muted/20 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">Subjects</h3>
                        {classData?.subjects?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {classData.subjects.map((subjectClass) => (
                                    <Badge
                                        key={subjectClass?.subject?.id}
                                        variant="secondary"
                                    >
                                        {subjectClass?.subject?.name || 'Unnamed Subject'}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No subjects assigned to this class yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Students</h2>
                    {session?.role === "school_admin" && (
                        <Button onClick={() => setAddStudentModalOpen(true)}>
                            <Users className="h-4 w-4 mr-2" />
                            Add Student
                        </Button>
                    )}
                </div>

                {classData.students?.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg bg-muted/5">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-medium">No Students</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {classData.currentSession
                                ? "There are no students enrolled in this class for the current session."
                                : "Please set up an academic session before adding students."}
                        </p>
                        {session?.role === "school_admin" && classData.currentSession && (
                            <Button onClick={() => setAddStudentModalOpen(true)} variant="outline">
                                <Users className="h-4 w-4 mr-2" />
                                Add First Student
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Student</TableHead>
                                    <TableHead>Roll Number</TableHead>
                                    <TableHead>Department</TableHead>
                                    {session?.role === "school_admin" && (
                                        <TableHead className="text-right">Actions</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classData.students.map((enrollment) => (
                                    <TableRow key={enrollment.id} className="hover:bg-muted/50">
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Avatar className="h-8 w-8 mr-2">
                                                    <AvatarImage src={enrollment.student.user.profileImage || ''} />
                                                    <AvatarFallback className="bg-primary/10">
                                                        {enrollment.student.user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{enrollment.student.user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{enrollment.student.user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {enrollment.rollNumber || "Not assigned"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {enrollment.student.department ? (
                                                <span className="font-medium">{enrollment.student.department.name}</span>
                                            ) : (
                                                <span className="text-muted-foreground">Not assigned</span>
                                            )}
                                        </TableCell>
                                        {session?.role === "school_admin" && (
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleRemoveStudent(enrollment.student.id)}
                                                >
                                                    Remove
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {editModalOpen && (
                <EditClassModal
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    classData={classData}
                    onSuccess={() => fetchClassData(true)}
                />
            )}

            {addStudentModalOpen && (
                <AddStudentClassModal
                    open={addStudentModalOpen}
                    onOpenChange={setAddStudentModalOpen}
                    classId={id}
                    sessionId={classData.currentSession?.id}
                    onSuccess={() => fetchClassData(true)}
                />
            )}

            {assignTeacherModalOpen && (
                <AssignTeacherModal
                    open={assignTeacherModalOpen}
                    onOpenChange={setAssignTeacherModalOpen}
                    classId={id}
                    onSuccess={() => fetchClassData(true)}
                />
            )}
        </div>
    );
} 