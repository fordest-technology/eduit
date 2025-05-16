"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, BookOpen, Trash2, Eye, Loader2, Users } from "lucide-react"
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

interface Class {
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
    level: {
        id: string
        name: string
    } | null
    subjects: Array<{
        id: string
        subject: {
            id: string
            name: string
            code: string
        }
    }>
    students: Array<{
        id: string
        student: {
            id: string
            user: {
                name: string
            }
        }
    }>
    _count?: {
        students: number
        subjects: number
    }
}

interface Teacher {
    id: string
    name: string
    profileImage?: string | null
}

interface Subject {
    id: string
    name: string
}

interface ClassesTableProps {
    userRole: string
    userId: string
    schoolId: string
    teachers: Teacher[]
    subjects: Subject[]
}

export function ClassesTable({ userRole, userId, schoolId, teachers, subjects }: ClassesTableProps) {
    const [classes, setClasses] = useState<Class[]>([])
    const [loading, setLoading] = useState(true)
    const [newClass, setNewClass] = useState({
        name: "",
        section: "",
        teacherId: "null",
        levelId: "null",
    })
    const [selectedClass, setSelectedClass] = useState<string>("")
    const [selectedSubject, setSelectedSubject] = useState<string>("")
    const [classToEdit, setClassToEdit] = useState<Class | null>(null)
    const [currentClass, setCurrentClass] = useState<Class | null>(null)
    const [showAssignSubjectDialog, setShowAssignSubjectDialog] = useState(false)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [levels, setLevels] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [showAddStudentDialog, setShowAddStudentDialog] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<string>("")
    const [availableStudents, setAvailableStudents] = useState<{ id: string; name: string }[]>([])
    const [isLoading, setIsLoading] = useState({
        table: true,
        create: false,
        delete: false,
        assignSubject: false,
        addStudent: false
    })
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [classToDelete, setClassToDelete] = useState<string>("")
    const [academicSessions, setAcademicSessions] = useState<{ id: string; name: string }[]>([])
    const [selectedSession, setSelectedSession] = useState<string>("")

    const fetchClasses = async () => {
        try {
            setIsLoading(prev => ({ ...prev, table: true }))
            const response = await fetch("/api/classes")
            if (!response.ok) throw new Error("Failed to fetch classes")
            const data = await response.json()
            setClasses(data)
        } catch (error) {
            toast.error("Failed to load classes. Please try again.")
            setError("Failed to load classes")
        } finally {
            setIsLoading(prev => ({ ...prev, table: false }))
        }
    }

    const fetchLevels = async () => {
        try {
            const response = await fetch("/api/school-levels")
            if (!response.ok) throw new Error("Failed to fetch school levels")
            const data = await response.json()
            setLevels(data)
        } catch (error) {
            toast.error("Error fetching school levels")
        }
    }

    const fetchAvailableStudents = async (classId: string) => {
        try {
            const response = await fetch(`/api/classes/${classId}/available-students`)
            if (!response.ok) throw new Error("Failed to fetch available students")
            const data = await response.json()
            setAvailableStudents(data.map((student: any) => ({
                id: student.id,
                name: student.user.name
            })))
        } catch (error) {
            toast.error("Error fetching available students")
            setAvailableStudents([])
        }
    }

    const fetchAcademicSessions = async () => {
        try {
            const response = await fetch("/api/academic-sessions")
            if (!response.ok) throw new Error("Failed to fetch academic sessions")
            const data = await response.json()
            setAcademicSessions(data)
            // Set current session as default if available
            const currentSession = data.find((session: any) => session.isCurrent)
            if (currentSession) {
                setSelectedSession(currentSession.id)
            }
        } catch (error) {
            toast.error("Error fetching academic sessions")
        }
    }

    useEffect(() => {
        fetchClasses()
        fetchLevels()
        fetchAcademicSessions()
        setLoading(false)
    }, [])

    useEffect(() => {
        if (selectedClass) {
            fetchAvailableStudents(selectedClass)
        }
    }, [selectedClass])

    const handleCreateClass = async () => {
        try {
            if (!newClass.name.trim()) {
                toast.error("Class name is required")
                return
            }

            setIsLoading(prev => ({ ...prev, create: true }))
            setError(null)

            const formData = {
                name: newClass.name.trim(),
                section: newClass.section.trim() || null,
                teacherId: newClass.teacherId === "null" ? null : newClass.teacherId,
                levelId: newClass.levelId === "null" ? null : newClass.levelId
            }

            const response = await fetch("/api/classes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Failed to create class")
            }

            toast.success("Class created successfully")
            setShowCreateDialog(false)
            setNewClass({
                name: "",
                section: "",
                teacherId: "null",
                levelId: "null",
            })
            fetchClasses()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create class")
            setError(error instanceof Error ? error.message : "Failed to create class")
        } finally {
            setIsLoading(prev => ({ ...prev, create: false }))
        }
    }

    const handleAssignSubject = async () => {
        try {
            const response = await fetch("/api/class-subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    classId: selectedClass,
                    subjectId: selectedSubject,
                }),
            })

            if (!response.ok) throw new Error("Failed to assign subject")

            toast.success("Subject assigned successfully")
            fetchClasses()
            setSelectedClass("")
            setSelectedSubject("")
        } catch (error) {
            toast.error("Error assigning subject")
        }
    }

    const handleDeleteClass = async (id: string) => {
        try {
            const response = await fetch(`/api/classes/${id}`, {
                method: "DELETE",
            })

            if (!response.ok) throw new Error("Failed to delete class")

            toast.success("Class deleted successfully")
            fetchClasses()
        } catch (error) {
            toast.error("Error deleting class")
        }
    }

    const handleAddStudent = async () => {
        try {
            const response = await fetch(`/api/classes/${selectedClass}/add-student`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: selectedStudent
                }),
            })

            if (!response.ok) throw new Error("Failed to add student")

            toast.success("Student added successfully")
            fetchClasses()
            setSelectedClass("")
            setSelectedStudent("")
            setShowAddStudentDialog(false)
        } catch (error) {
            toast.error("Error adding student")
        }
    }

    const handleDeleteClick = (classId: string) => {
        setClassToDelete(classId)
        setShowDeleteDialog(true)
    }

    const handleDeleteConfirm = async () => {
        try {
            setIsLoading(prev => ({ ...prev, delete: true }))
            const response = await fetch(`/api/classes/${classToDelete}`, {
                method: "DELETE",
            })

            if (!response.ok) throw new Error("Failed to delete class")

            toast.success("Class deleted successfully")
            fetchClasses()
        } catch (error) {
            toast.error("Error deleting class")
        } finally {
            setIsLoading(prev => ({ ...prev, delete: false }))
            setShowDeleteDialog(false)
            setClassToDelete("")
        }
    }

    if (loading) {
        return <div>Loading...</div>
    }

    const isAdmin = userRole === "SUPER_ADMIN" || userRole === "SCHOOL_ADMIN"

    return (
        <div className="space-y-4">
            {userRole !== "STUDENT" && (
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight">Classes</h2>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                Create Class
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Class</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">
                                        Class Name
                                    </label>
                                    <Input
                                        id="name"
                                        value={newClass.name}
                                        onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                        placeholder="Enter class name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="section" className="text-sm font-medium">
                                        Section
                                    </label>
                                    <Input
                                        id="section"
                                        value={newClass.section}
                                        onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                                        placeholder="Enter section (optional)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="teacher" className="text-sm font-medium">
                                        Teacher
                                    </label>
                                    <Select
                                        value={newClass.teacherId}
                                        onValueChange={(value) => setNewClass({ ...newClass, teacherId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="null">No teacher assigned</SelectItem>
                                            {teachers.map((teacher) => (
                                                <SelectItem key={teacher.id} value={teacher.id}>
                                                    {teacher.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="level" className="text-sm font-medium">
                                        Level
                                    </label>
                                    <Select
                                        value={newClass.levelId}
                                        onValueChange={(value) => setNewClass({ ...newClass, levelId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="null">No level assigned</SelectItem>
                                            {levels.map((level) => (
                                                <SelectItem key={level.id} value={level.id}>
                                                    {level.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {error && (
                                    <div className="text-sm text-destructive">{error}</div>
                                )}
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCreateDialog(false)}
                                        disabled={isLoading.create}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateClass}
                                        disabled={isLoading.create}
                                    >
                                        {isLoading.create ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Create Class"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {isLoading.table ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="bg-destructive/15 p-4 rounded-md">
                    <p className="text-destructive">{error}</p>
                    <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                            setError(null)
                            fetchClasses()
                        }}
                    >
                        Try Again
                    </Button>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Class</TableHead>
                                <TableHead>Teacher</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Students</TableHead>
                                <TableHead>Subjects</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No classes found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                classes.map((cls) => (
                                    <TableRow key={cls.id}>
                                        <TableCell>
                                            <div className="font-medium">{cls.name}</div>
                                            {cls.section && (
                                                <div className="text-sm text-muted-foreground">
                                                    Section {cls.section}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {cls.teacher ? (
                                                <div className="flex items-center space-x-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage
                                                            src={cls.teacher.user.profileImage || undefined}
                                                            alt={cls.teacher.user.name}
                                                        />
                                                        <AvatarFallback>
                                                            {cls.teacher.user.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{cls.teacher.user.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">No teacher assigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {cls.level ? (
                                                <span>{cls.level.name}</span>
                                            ) : (
                                                <span className="text-muted-foreground">No level assigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{cls._count?.students || 0}</TableCell>
                                        <TableCell>{cls._count?.subjects || 0}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/classes/${cls.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Class
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setCurrentClass(cls)
                                                            setShowAssignSubjectDialog(true)
                                                        }}
                                                    >
                                                        <BookOpen className="mr-2 h-4 w-4" />
                                                        Assign Subject
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setCurrentClass(cls)
                                                            setShowAddStudentDialog(true)
                                                        }}
                                                    >
                                                        <Users className="mr-2 h-4 w-4" />
                                                        Add Student
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteClick(cls.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Class
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the class
                            and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isLoading.delete}
                        >
                            {isLoading.delete ? (
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

            {/* Add Student Dialog */}
            <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Student to Class</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="session" className="text-sm font-medium">
                                Academic Session
                            </label>
                            <Select
                                value={selectedSession}
                                onValueChange={setSelectedSession}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select academic session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicSessions.map((session) => (
                                        <SelectItem key={session.id} value={session.id}>
                                            {session.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="student" className="text-sm font-medium">
                                Student
                            </label>
                            <Select
                                value={selectedStudent}
                                onValueChange={setSelectedStudent}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select student" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableStudents.map((student) => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowAddStudentDialog(false)}
                                disabled={isLoading.addStudent}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddStudent}
                                disabled={!selectedStudent || !selectedSession || isLoading.addStudent}
                            >
                                {isLoading.addStudent ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Student"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
} 