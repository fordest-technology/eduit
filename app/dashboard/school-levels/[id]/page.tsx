"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ChevronLeft, Loader2, PenSquare, Trash2, GraduationCap,
    BookOpen, Users, Calendar, Clock, Plus
} from "lucide-react"
import { toast } from "sonner"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { DashboardStatsCard, DashboardStatsGrid } from "@/components/dashboard-stats-card"
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from "@/components/ui/table"
import { useColors } from "@/contexts/color-context"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ClassData {
    id: string
    name: string
    section: string | null
    teacher: {
        id: string
        user: {
            name: string
            profileImage?: string | null
        }
    } | null
    _count: {
        students: number
        subjects: number
    }
}

interface SubjectData {
    id: string
    name: string
    code: string | null
    description: string | null
    _count?: {
        students: number
        teachers: number
    }
}

interface PageProps {
    params: Promise<{
        id: string
    }>
}

interface Params {
    id: string
}

export default function SchoolLevelDetailsPage({ params: paramsPromise }: PageProps) {
    const params = use(paramsPromise) as Params
    const router = useRouter()
    const { colors } = useColors()
    const [session, setSession] = useState<any>(null)
    const [level, setLevel] = useState<any>(null)
    const [classes, setClasses] = useState<ClassData[]>([])
    const [subjects, setSubjects] = useState<SubjectData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

                // Fetch school level details
                const levelRes = await fetch(`/api/school-levels/${params.id}`)
                if (!levelRes.ok) {
                    throw new Error("Failed to fetch school level")
                }

                const levelData = await levelRes.json()
                console.log("Level data:", levelData) // Debug log
                setLevel(levelData)

                // Fetch classes for this level
                const classesRes = await fetch(`/api/classes?levelId=${params.id}`)
                if (!classesRes.ok) {
                    throw new Error("Failed to fetch classes")
                }
                const classesData = await classesRes.json()
                console.log("Classes data:", classesData) // Debug log
                setClasses(classesData)

                // Fetch subjects for this level
                const subjectsRes = await fetch(`/api/subjects?levelId=${params.id}`)
                if (!subjectsRes.ok) {
                    throw new Error("Failed to fetch subjects")
                }
                const subjectsData = await subjectsRes.json()
                console.log("Subjects data:", subjectsData) // Debug log
                setSubjects(subjectsData)

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
    }, [router, params.id])

    const handleEdit = () => {
        router.push(`/dashboard/school-levels/edit/${params.id}`)
    }

    const handleDelete = async () => {
        if (!level) return

        try {
            setIsDeleting(true)
            const response = await fetch(`/api/school-levels/${params.id}`, {
                method: "DELETE"
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to delete school level")
            }

            toast.success("School level deleted successfully")
            setShowDeleteDialog(false)
            router.push("/dashboard/school-levels")
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error deleting school level")
            }
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error || !session || !level) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-red-500 mb-4">{error || "Not found or not authorized"}</p>
                <Button onClick={() => router.push("/dashboard/school-levels")}>
                    Back to School Levels
                </Button>
            </div>
        )
    }

    // Check if user has permission to manage levels
    const canManageLevels = session.role === "super_admin" || session.role === "school_admin"

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/school-levels")}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to School Levels
                </Button>

                {canManageLevels && (
                    <div className="flex gap-2">
                        {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEdit}
                        >
                            <PenSquare className="h-4 w-4 mr-2" />
                            Edit Level
                        </Button> */}
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Level
                        </Button>
                    </div>
                )}
            </div>

            <DashboardHeader
                heading={level.name}
                text={level.description || "School level details and management"}
                showBanner={true}
            />

            <DashboardStatsGrid columns={3} className="mb-6">
                <DashboardStatsCard
                    title="Classes"
                    value={level._count?.classes || 0}
                    icon={GraduationCap}
                    color="blue"
                    description="Total classes in this level"
                />
                <DashboardStatsCard
                    title="Subjects"
                    value={level._count?.subjects || 0}
                    icon={BookOpen}
                    color="purple"
                    description="Total subjects in this level"
                />
                <DashboardStatsCard
                    title="Students"
                    value={classes.reduce((sum: number, cls: any) => sum + (cls._count?.students || 0), 0)}
                    icon={Users}
                    color="emerald"
                    description="Across all classes"
                />
            </DashboardStatsGrid>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {/* Classes Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex items-center">
                                    <GraduationCap className="mr-2 h-5 w-5" />
                                    Classes
                                </CardTitle>
                                <CardDescription>
                                    Classes in this level
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-2xl font-bold">{level._count?.classes || 0}</p>
                                    {classes.slice(0, 3).map(cls => (
                                        <div key={cls.id} className="flex justify-between items-center">
                                            <span className="text-sm">{cls.name} {cls.section}</span>
                                            <span className="text-xs bg-muted rounded p-1 text-muted-foreground">
                                                {cls._count?.students || 0} students
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            {classes.length > 0 && (
                                <CardFooter>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            const classesTab = document.querySelector('[data-value="classes"]');
                                            if (classesTab instanceof HTMLElement) {
                                                classesTab.click();
                                            }
                                        }}
                                    >
                                        View All Classes
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>

                        {/* Subjects Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex items-center">
                                    <BookOpen className="mr-2 h-5 w-5" />
                                    Subjects
                                </CardTitle>
                                <CardDescription>
                                    Subjects taught in this level
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-2xl font-bold">{level._count?.subjects || 0}</p>
                                    {subjects.slice(0, 3).map(subject => (
                                        <div key={subject.id} className="flex justify-between items-center">
                                            <span className="text-sm">{subject.name}</span>
                                            <span className="text-xs bg-muted rounded p-1 text-muted-foreground">
                                                {subject.code || 'No code'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* More Info Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex items-center">
                                    <Clock className="mr-2 h-5 w-5" />
                                    Level Information
                                </CardTitle>
                                <CardDescription>
                                    Additional details
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Created:</span>
                                        <span className="text-sm">
                                            {new Date(level.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Last Updated:</span>
                                        <span className="text-sm">
                                            {new Date(level.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Order:</span>
                                        <span className="text-sm">{level.order || 'Not set'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="classes">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium">Classes</h3>
                        {canManageLevels && (
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Class
                            </Button>
                        )}
                    </div>

                    {classes.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-40">
                                <p className="text-muted-foreground mb-2">No classes found for this level</p>
                                {canManageLevels && (
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Class
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Class Name</TableHead>
                                        <TableHead>Section</TableHead>
                                        <TableHead>Class Teacher</TableHead>
                                        <TableHead className="text-center">Students</TableHead>
                                        <TableHead className="text-center">Subjects</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classes.map((cls) => (
                                        <TableRow key={cls.id}>
                                            <TableCell className="font-medium">{cls.name}</TableCell>
                                            <TableCell>{cls.section || '-'}</TableCell>
                                            <TableCell>
                                                {cls.teacher ? cls.teacher.user.name : 'Not assigned'}
                                            </TableCell>
                                            <TableCell className="text-center">{cls._count?.students || 0}</TableCell>
                                            <TableCell className="text-center">{cls._count?.subjects || 0}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm">View</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Meta Information */}
            <Card className="border-primary/10">
                <CardHeader>
                    <CardTitle className="text-base">Level Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Level Order</h4>
                            <p className="font-medium">{level.order || 0}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                            <p className="font-medium">
                                {level.createdAt
                                    ? new Date(level.createdAt).toLocaleDateString()
                                    : 'Unknown'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
                            <p className="font-medium">
                                {level.updatedAt
                                    ? new Date(level.updatedAt).toLocaleDateString()
                                    : 'Unknown'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete School Level</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this school level? This action cannot be undone.
                            {level._count?.classes > 0 || level._count?.subjects > 0 ? (
                                <p className="text-red-500 mt-2">
                                    This level has associated classes or subjects. You must remove or reassign them before deleting.
                                </p>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            disabled={isDeleting || level._count?.classes > 0 || level._count?.subjects > 0}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 