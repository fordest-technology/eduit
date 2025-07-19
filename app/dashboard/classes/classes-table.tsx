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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet"
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
import { MoreHorizontal, Pencil, BookOpen, Trash2, Eye, Loader2, Users, Plus } from "lucide-react"
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
import { logger } from "@/lib/logger"

interface Class {
    id: string
    name: string
    section: string | null
    teacher: {
        id: string
        user: {
            name: string
            email: string
            profileImage?: string | null
        }
        department: {
            id: string
            name: string
        } | null
        specialization: string | null
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
            department: {
                id: string
                name: string
            } | null
        }
    }>
    _count: {
        students: number
        subjects: number
    }
    currentSession: {
        id: string
        name: string
        startDate: Date
        endDate: Date
    } | null
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
    const [showCreateSheet, setShowCreateSheet] = useState(false)
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
    const [teachersData, setTeachersData] = useState<Teacher[]>(teachers)

    const fetchClasses = async () => {
        const startTime = Date.now()
        try {
            setIsLoading(prev => ({ ...prev, table: true }))
            logger.info("Fetching classes", { schoolId })

            const response = await fetch("/api/classes")
            if (!response.ok) throw new Error("Failed to fetch classes")
            const data = await response.json()
            setClasses(data)

            const duration = Date.now() - startTime
            logger.api("Fetch classes", duration, { count: data.length })
        } catch (error) {
            logger.error("Failed to fetch classes", error, { schoolId })
            toast.error("Failed to load classes. Please try again.")
            setError("Failed to load classes")
        } finally {
            setIsLoading(prev => ({ ...prev, table: false }))
        }
    }

    const fetchLevels = async () => {
        try {
            logger.info("Fetching school levels")
            const response = await fetch("/api/school-levels")
            if (!response.ok) throw new Error("Failed to fetch school levels")
            const data = await response.json()
            setLevels(data)
        } catch (error) {
            logger.error("Error fetching school levels", error)
            toast.error("Error fetching school levels")
        }
    }

    const fetchAvailableStudents = async (classId: string) => {
        try {
            logger.info("Fetching available students", { classId })
            const response = await fetch(`/api/classes/${classId}/available-students`)
            if (!response.ok) throw new Error("Failed to fetch available students")
            const data = await response.json()
            setAvailableStudents(data.map((student: any) => ({
                id: student.id,
                name: student.user.name
            })))
        } catch (error) {
            logger.error("Error fetching available students", error, { classId })
            toast.error("Error fetching available students")
            setAvailableStudents([])
        }
    }

    const fetchAcademicSessions = async () => {
        try {
            logger.info("Fetching academic sessions")
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
            logger.error("Error fetching academic sessions", error)
            toast.error("Error fetching academic sessions")
        }
    }

    const fetchTeachers = async () => {
        try {
            logger.info("Fetching teachers from API")
            const response = await fetch("/api/teachers")
            if (!response.ok) throw new Error("Failed to fetch teachers")
            const data = await response.json()

            // Transform the data to match our interface
            const transformedTeachers = data.map((teacher: any) => ({
                id: teacher.id,
                name: teacher.name,
                profileImage: teacher.profileImage
            }))

            setTeachersData(transformedTeachers)
            logger.info("Teachers fetched from API", { count: transformedTeachers.length })
        } catch (error) {
            logger.error("Error fetching teachers from API", error)
            // Keep the original teachers data if API fails
        }
    }

    useEffect(() => {
        fetchClasses()
        fetchLevels()
        fetchAcademicSessions()
        setLoading(false)
    }, [])

    // Debug: Log teachers data when component mounts
    useEffect(() => {
        logger.info("Teachers data received", {
            teachersCount: teachers.length,
            teachers: teachers.map(t => ({ id: t.id, name: t.name }))
        })

        // If no teachers from server-side, try fetching from API
        if (teachers.length === 0) {
            logger.info("No teachers from server-side, fetching from API")
            fetchTeachers()
        } else {
            setTeachersData(teachers)
        }
    }, [teachers])

    const handleCreateClass = async () => {
        const startTime = Date.now()
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

            logger.info("Creating new class", formData)

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

            const duration = Date.now() - startTime
            logger.api("Create class", duration, { className: formData.name })

            toast.success("Class created successfully")
            setShowCreateSheet(false)
            setNewClass({
                name: "",
                section: "",
                teacherId: "null",
                levelId: "null",
            })
            fetchClasses()
        } catch (error) {
            logger.error("Error creating class", error, { formData: newClass })
            toast.error(error instanceof Error ? error.message : "Failed to create class")
        } finally {
            setIsLoading(prev => ({ ...prev, create: false }))
        }
    }

    const handleAssignSubject = async () => {
        const startTime = Date.now()
        try {
            if (!selectedClass || !selectedSubject) {
                toast.error("Please select both class and subject")
                return
            }

            setIsLoading(prev => ({ ...prev, assignSubject: true }))

            logger.info("Assigning subject to class", { classId: selectedClass, subjectId: selectedSubject })

            const response = await fetch(`/api/classes/${selectedClass}/subjects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subjectId: selectedSubject,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || "Failed to assign subject")
            }

            const duration = Date.now() - startTime
            logger.api("Assign subject to class", duration, { classId: selectedClass, subjectId: selectedSubject })

            toast.success("Subject assigned successfully")
            setShowAssignSubjectDialog(false)
            setSelectedClass("")
            setSelectedSubject("")
            fetchClasses()
        } catch (error) {
            logger.error("Error assigning subject", error, { classId: selectedClass, subjectId: selectedSubject })
            toast.error(error instanceof Error ? error.message : "Failed to assign subject")
        } finally {
            setIsLoading(prev => ({ ...prev, assignSubject: false }))
        }
    }

    const handleDeleteClass = async (id: string) => {
        const startTime = Date.now()
        try {
            setIsLoading(prev => ({ ...prev, delete: true }))

            logger.info("Deleting class", { classId: id })

            const response = await fetch(`/api/classes/${id}`, {
                method: "DELETE",
            })

            if (!response.ok) throw new Error("Failed to delete class")

            const duration = Date.now() - startTime
            logger.api("Delete class", duration, { classId: id })

            toast.success("Class deleted successfully")
            fetchClasses()
        } catch (error) {
            logger.error("Error deleting class", error, { classId: id })
            toast.error("Error deleting class")
        } finally {
            setIsLoading(prev => ({ ...prev, delete: false }))
        }
    }

    const handleAddStudent = async () => {
        const startTime = Date.now()
        try {
            if (!currentClass || !selectedStudent || !selectedSession) {
                toast.error("Please select class, student, and session")
                return
            }

            setIsLoading(prev => ({ ...prev, addStudent: true }))

            logger.info("Adding student to class", { classId: currentClass.id, studentId: selectedStudent })

            const response = await fetch('/api/student-classes', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    classId: currentClass.id,
                    studentId: selectedStudent,
                    sessionId: selectedSession,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || "Failed to add student")
            }

            const duration = Date.now() - startTime
            logger.api("Add student to class", duration, { classId: currentClass.id, studentId: selectedStudent })

            toast.success("Student added successfully")
            setShowAddStudentDialog(false)
            setSelectedStudent("")
            setCurrentClass(null)
            fetchClasses()
        } catch (error) {
            logger.error("Error adding student to class", error, { classId: currentClass?.id, studentId: selectedStudent })
            toast.error(error instanceof Error ? error.message : "Failed to add student")
        } finally {
            setIsLoading(prev => ({ ...prev, addStudent: false }))
        }
    }

    const handleDeleteClick = (classId: string) => {
        setClassToDelete(classId)
        setShowDeleteDialog(true)
    }

    const handleDeleteConfirm = async () => {
        if (classToDelete) {
            await handleDeleteClass(classToDelete)
            setShowDeleteDialog(false)
            setClassToDelete("")
        }
    }

    const handleAddStudentClick = (classItem: any) => {
        setCurrentClass(classItem)
        fetchAvailableStudents(classItem.id)
        setShowAddStudentDialog(true)
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Classes</h2>
                        <p className="text-muted-foreground">
                            Manage classes, assign teachers, and organize students
                        </p>
                    </div>
                </div>
                <div className="text-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading classes...</p>
                </div>
            </div>
        )
    }

    const isAdmin = userRole === "SUPER_ADMIN" || userRole === "SCHOOL_ADMIN"

    return (
        <div className="space-y-4">
            {/* Header with Create Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Classes</h2>
                    <p className="text-muted-foreground">
                        Manage your school classes and assignments
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchClasses()}
                        disabled={isLoading.table}
                    >
                        {isLoading.table ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                        Refresh
                    </Button>
                    {isAdmin && (
                        <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
                            <SheetTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Class
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Create New Class</SheetTitle>
                                    <SheetDescription>
                                        Add a new class to your school
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-4 mt-6">
                                    <div>
                                        <label className="text-sm font-medium">Class Name</label>
                                        <Input
                                            placeholder="e.g., Class 10A"
                                            value={newClass.name}
                                            onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Section</label>
                                        <Input
                                            placeholder="e.g., A, B, C"
                                            value={newClass.section}
                                            onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Level</label>
                                        <Select
                                            value={newClass.levelId}
                                            onValueChange={(value) => setNewClass({ ...newClass, levelId: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="null">No Level</SelectItem>
                                                {levels.map((level) => (
                                                    <SelectItem key={level.id} value={level.id}>
                                                        {level.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Teacher</label>
                                        <Select
                                            value={newClass.teacherId}
                                            onValueChange={(value) => setNewClass({ ...newClass, teacherId: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select teacher" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="null">No Teacher</SelectItem>
                                                {teachersData.map((teacher) => (
                                                    <SelectItem key={teacher.id} value={teacher.id}>
                                                        {teacher.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        onClick={handleCreateClass}
                                        disabled={isCreating}
                                        className="w-full"
                                    >
                                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Class
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}
                </div>
            </div>

            {/* Classes Table */}
            {isLoading.table ? (
                <div className="text-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading classes...</p>
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Class</TableHead>
                                <TableHead>Teacher</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Students</TableHead>
                                <TableHead>Subjects</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <p className="text-muted-foreground">No classes found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                classes.map((classItem) => (
                                    <TableRow key={classItem.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{classItem.name}</div>
                                                {classItem.section && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Section {classItem.section}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {classItem.teacher ? (
                                                <div className="flex items-center space-x-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={classItem.teacher.user.profileImage || ""} />
                                                        <AvatarFallback>
                                                            {classItem.teacher.user.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">{classItem.teacher.user.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">No teacher assigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {classItem.level ? (
                                                <span className="text-sm">{classItem.level.name}</span>
                                            ) : (
                                                <span className="text-muted-foreground">No level</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-1">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{classItem._count.students}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-1">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{classItem._count.subjects}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/classes/${classItem.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {isAdmin && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => setClassToEdit(classItem)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit Class
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleAddStudentClick(classItem)}>
                                                                <Users className="mr-2 h-4 w-4" />
                                                                Add Student
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(classItem.id)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Class
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
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
                            disabled={isLoading.delete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isLoading.delete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Student Dialog */}
            <AlertDialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Add Student to Class</AlertDialogTitle>
                        <AlertDialogDescription>
                            Select a student to add to {currentClass?.name}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Student</label>
                            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
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
                        <div>
                            <label className="text-sm font-medium">Session</label>
                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select session" />
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
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAddStudent}
                            disabled={isLoading.addStudent}
                        >
                            {isLoading.addStudent && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Student
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 