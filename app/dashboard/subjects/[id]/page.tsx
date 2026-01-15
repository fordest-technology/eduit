"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ChevronLeft, Loader2, PenSquare, Trash2, BookOpen,
    UsersRound, GraduationCap, Plus, UserPlus
} from "lucide-react"
import { toast } from "sonner"
import { DashboardHeader } from "@/app/components/dashboard-header"
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Teacher {
    id: string
    userId: string
    name: string
    email: string
    profileImage: string | null
}

interface SubjectTeacher {
    id: string
    teacherId: string
    name: string
    email: string
    profileImage: string | null
    userId: string
}

interface Department {
    id: string
    name: string
}

interface SchoolLevel {
    id: string
    name: string
}

export default function SubjectPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { colors } = useColors()
    const [session, setSession] = useState<any>(null)
    const [subject, setSubject] = useState<any>(null)
    const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacher[]>([])
    const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingTeachers, setLoadingTeachers] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showAddTeacherDialog, setShowAddTeacherDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [addingTeacher, setAddingTeacher] = useState(false)
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
    const [removingTeacherId, setRemovingTeacherId] = useState<string | null>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [levels, setLevels] = useState<SchoolLevel[]>([])
    const [editForm, setEditForm] = useState({
        name: "",
        code: "",
        description: "",
        departmentId: "",
        levelId: ""
    })
    const [isEditing, setIsEditing] = useState(false)

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

                // Fetch subject details
                const subjectRes = await fetch(`/api/subjects/${params.id}`)
                if (!subjectRes.ok) {
                    throw new Error("Failed to fetch subject")
                }

                const subjectData = await subjectRes.json()
                setSubject(subjectData)

                // Fetch teachers for this subject
                await fetchSubjectTeachers()

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

    useEffect(() => {
        if (subject) {
            setEditForm({
                name: subject.name || "",
                code: subject.code || "",
                description: subject.description || "",
                departmentId: subject.departmentId || "",
                levelId: subject.levelId || ""
            })
        }
    }, [subject])

    useEffect(() => {
        async function fetchDepartmentsAndLevels() {
            try {
                const [deptRes, levelRes] = await Promise.all([
                    fetch('/api/departments'),
                    fetch('/api/school-levels')
                ])

                if (deptRes.ok) {
                    const deptData = await deptRes.json()
                    setDepartments(deptData)
                }

                if (levelRes.ok) {
                    const levelData = await levelRes.json()
                    setLevels(levelData)
                }
            } catch (error) {
                console.error("Error fetching departments and levels:", error)
            }
        }

        if (showEditDialog) {
            fetchDepartmentsAndLevels()
        }
    }, [showEditDialog])

    const fetchSubjectTeachers = async () => {
        try {
            setLoadingTeachers(true)
            const teachersRes = await fetch(`/api/subjects/${params.id}/teachers`)
            if (!teachersRes.ok) {
                throw new Error("Failed to fetch subject teachers")
            }

            const teachersData = await teachersRes.json()
            setSubjectTeachers(teachersData)
        } catch (error) {
            console.error("Error fetching teachers:", error)
            toast.error("Failed to load subject teachers")
        } finally {
            setLoadingTeachers(false)
        }
    }

    const fetchAvailableTeachers = async () => {
        try {
            setLoadingTeachers(true)
            const res = await fetch('/api/teachers')
            if (!res.ok) throw new Error('Failed to fetch teachers')

            const allTeachers = await res.json()

            // Filter out teachers already assigned to this subject
            const assignedTeacherIds = new Set(subjectTeachers.map(t => t.teacherId))
            const available = allTeachers.filter((t: any) => !assignedTeacherIds.has(t.id))

            setAvailableTeachers(available)
            setLoadingTeachers(false)
        } catch (error) {
            console.error("Error fetching available teachers:", error)
            toast.error("Failed to load available teachers")
            setLoadingTeachers(false)
        }
    }

    const handleEdit = () => {
        setShowEditDialog(true)
    }

    const handleEditSubmit = async () => {
        try {
            setIsEditing(true)
            const response = await fetch(`/api/subjects/${params.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(editForm),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to update subject")
            }

            const updatedSubject = await response.json()
            setSubject(updatedSubject)
            toast.success("Subject updated successfully")
            setShowEditDialog(false)
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error updating subject")
            }
        } finally {
            setIsEditing(false)
        }
    }

    const handleDelete = async () => {
        if (!subject) return

        try {
            setIsDeleting(true)
            const response = await fetch(`/api/subjects/${params.id}`, {
                method: "DELETE"
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to delete subject")
            }

            toast.success("Subject deleted successfully")
            setShowDeleteDialog(false)
            router.push("/dashboard/subjects")
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error deleting subject")
            }
        } finally {
            setIsDeleting(false)
        }
    }

    const handleOpenAddTeacherDialog = () => {
        fetchAvailableTeachers()
        setShowAddTeacherDialog(true)
    }

    const handleAddTeacher = async () => {
        if (!selectedTeacherId) {
            toast.error("Please select a teacher")
            return
        }

        try {
            setAddingTeacher(true)
            const response = await fetch(`/api/subjects/${params.id}/teachers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ teacherId: selectedTeacherId }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to assign teacher")
            }

            const data = await response.json()
            setSubjectTeachers([...subjectTeachers, data])
            toast.success("Teacher assigned successfully")
            setShowAddTeacherDialog(false)
            setSelectedTeacherId("")
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error assigning teacher")
            }
        } finally {
            setAddingTeacher(false)
        }
    }

    const handleRemoveTeacher = async (assignmentId: string) => {
        try {
            setRemovingTeacherId(assignmentId)
            const response = await fetch(`/api/subjects/${params.id}/teachers?assignmentId=${assignmentId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to remove teacher")
            }

            setSubjectTeachers(subjectTeachers.filter(t => t.id !== assignmentId))
            toast.success("Teacher removed successfully")
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error removing teacher")
            }
        } finally {
            setRemovingTeacherId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (error || !session || !subject) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-red-500 mb-4">{error || "Not found or not authorized"}</p>
                <Button onClick={() => router.push("/dashboard/subjects")}>
                    Back to Subjects
                </Button>
            </div>
        )
    }

    // Check if user has permission to manage subjects
    const canManageSubjects = session.role === "super_admin" || session.role === "school_admin"

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard/subjects")}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Subjects
                </Button>

                {canManageSubjects && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEdit}
                        >
                            <PenSquare className="h-4 w-4 mr-2" />
                            Edit Subject
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Subject
                        </Button>
                    </div>
                )}
            </div>

            <DashboardHeader
                heading={subject.name}
                text={subject.description || "Subject details and management"}
                showBanner={true}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                            <BookOpen className="mr-2 h-5 w-5" />
                            Code
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-blue-800">{subject.code || "—"}</p>
                        <p className="text-sm text-blue-600 mt-1">Subject code</p>
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
                        <p className="text-3xl font-bold text-purple-800">{subject._count?.classes || 0}</p>
                        <p className="text-sm text-purple-600 mt-1">Classes using this subject</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
                            <UsersRound className="mr-2 h-5 w-5" />
                            Teachers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-800">{subjectTeachers.length}</p>
                        <p className="text-sm text-emerald-600 mt-1">Teachers assigned</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="teachers">Teachers</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Subject Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold mb-1">Name</h3>
                                    <p>{subject.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold mb-1">Code</h3>
                                    <p>{subject.code || "—"}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold mb-1">Description</h3>
                                    <p className="text-sm text-muted-foreground">{subject.description || "No description provided"}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Classification</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold mb-1">Department</h3>
                                    {subject.department ? (
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                            {subject.department.name}
                                        </Badge>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Not assigned to any department</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold mb-1">School Level</h3>
                                    {subject.level ? (
                                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                            {subject.level.name}
                                        </Badge>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Not assigned to any school level</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold mb-1">Classes</h3>
                                    <p>{subject._count?.classes || 0} classes using this subject</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="teachers">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium">Teachers</h3>
                        {canManageSubjects && (
                            <Button size="sm" onClick={handleOpenAddTeacherDialog}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign Teacher
                            </Button>
                        )}
                    </div>

                    {loadingTeachers ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : subjectTeachers.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-40">
                                <p className="text-muted-foreground mb-2">No teachers assigned to this subject</p>
                                {canManageSubjects && (
                                    <Button size="sm" onClick={handleOpenAddTeacherDialog}>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Assign First Teacher
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Teacher</TableHead>
                                        <TableHead>Email</TableHead>
                                        {canManageSubjects && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subjectTeachers.map((teacher) => (
                                        <TableRow key={teacher.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        {teacher.profileImage ? (
                                                            <AvatarImage src={teacher.profileImage} alt={teacher.name} />
                                                        ) : (
                                                            <AvatarFallback>{teacher.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    <div className="font-medium">{teacher.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{teacher.email}</TableCell>
                                            {canManageSubjects && (
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleRemoveTeacher(teacher.id)}
                                                        disabled={removingTeacherId === teacher.id}
                                                    >
                                                        {removingTeacherId === teacher.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                        )}
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
                </TabsContent>
            </Tabs>

            {/* Meta Information */}
            <Card className="border-primary/10">
                <CardHeader>
                    <CardTitle className="text-base">Subject Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                            <p className="font-medium">
                                {subject.createdAt
                                    ? new Date(subject.createdAt).toLocaleDateString()
                                    : 'Unknown'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
                            <p className="font-medium">
                                {subject.updatedAt
                                    ? new Date(subject.updatedAt).toLocaleDateString()
                                    : 'Unknown'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">ID</h4>
                            <p className="font-medium text-xs">{subject.id}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this subject? This action cannot be undone.
                            {subject._count?.classes > 0 ? (
                                <p className="text-red-500 mt-2">
                                    This subject is associated with {subject._count.classes} classes. You must remove or reassign them before deleting.
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
                            disabled={isDeleting || subject._count?.classes > 0}
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

            {/* Add Teacher Sheet */}
            <Sheet open={showAddTeacherDialog} onOpenChange={setShowAddTeacherDialog}>
                <SheetContent className="sm:max-w-[425px] w-full overflow-y-auto" side="right">
                    <SheetHeader>
                        <SheetTitle>Assign Teacher</SheetTitle>
                        <SheetDescription>
                            Select a teacher to assign to this subject.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        {loadingTeachers ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : availableTeachers.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                No available teachers to assign. All teachers are already assigned to this subject.
                            </p>
                        ) : (
                            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTeachers.map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.id}>
                                            {teacher.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <SheetFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddTeacherDialog(false)}
                            disabled={addingTeacher}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddTeacher}
                            disabled={addingTeacher || availableTeachers.length === 0 || !selectedTeacherId}
                        >
                            {addingTeacher ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                "Assign"
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <Sheet open={showEditDialog} onOpenChange={setShowEditDialog}>
                <SheetContent className="sm:max-w-[500px] w-full overflow-y-auto" side="right">
                    <SheetHeader>
                        <SheetTitle>Edit Subject</SheetTitle>
                        <SheetDescription>
                            Update the subject details. Click save when you're done.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Subject Name</Label>
                            <Input
                                id="name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Subject Code</Label>
                            <Input
                                id="code"
                                value={editForm.code}
                                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Select
                                value={editForm.departmentId}
                                onValueChange={(value) => setEditForm({ ...editForm, departmentId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="level">Level</Label>
                            <Select
                                value={editForm.levelId}
                                onValueChange={(value) => setEditForm({ ...editForm, levelId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {levels.map((level) => (
                                        <SelectItem key={level.id} value={level.id}>
                                            {level.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowEditDialog(false)}
                            disabled={isEditing}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleEditSubmit} disabled={isEditing}>
                            {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
} 