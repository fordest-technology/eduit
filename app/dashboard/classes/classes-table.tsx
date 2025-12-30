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
import { MoreHorizontal, Pencil, BookOpen, Trash2, Eye, Loader2, Users, Plus, GraduationCap } from "lucide-react"
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

            // The API returns { teachers: [], stats: {} }, not a direct array
            const teachersArray = data.teachers || data

            // Validate that we have an array
            if (!Array.isArray(teachersArray)) {
                logger.error("Teachers API response is not in expected format", { data })
                return // Keep the original teachers data if API response is invalid
            }

            // Transform the data to match our interface
            const transformedTeachers = teachersArray.map((teacher: any) => ({
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
        <div className="space-y-6 font-poppins">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-3xl">
                <div className="flex-1 max-w-md relative group">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <Input
                        placeholder="Search classes or levels..."
                        className="pl-12 h-12 bg-white border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchClasses()}
                        disabled={isLoading.table}
                        className="h-12 w-12 rounded-2xl hover:bg-white hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100"
                    >
                        {isLoading.table ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                    </Button>

                    {isAdmin && (
                        <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
                            <SheetTrigger asChild>
                                <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold">
                                    <Plus className="mr-2 h-5 w-5" />
                                    New Class
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="rounded-l-[2.5rem] p-8 border-none shadow-2xl">
                                <SheetHeader className="pb-8">
                                    <SheetTitle className="text-2xl font-black font-sora text-slate-800">Assign New Class</SheetTitle>
                                    <SheetDescription className="font-medium text-slate-500">
                                        Configure the class profile and academic assignment
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-6 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Class Signature</label>
                                        <Input
                                            placeholder="e.g., Grade 10 - Science"
                                            value={newClass.name}
                                            className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all capitalize"
                                            onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Section/Arm</label>
                                        <Input
                                            placeholder="A, B, or C"
                                            value={newClass.section}
                                            className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all uppercase"
                                            onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Academic Level</label>
                                        <Select
                                            value={newClass.levelId}
                                            onValueChange={(value) => setNewClass({ ...newClass, levelId: value })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all">
                                                <SelectValue placeholder="Select rank" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                                <SelectItem value="null">General / No Level</SelectItem>
                                                {levels.map((level) => (
                                                    <SelectItem key={level.id} value={level.id}>
                                                        {level.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Form Teacher</label>
                                        <Select
                                            value={newClass.teacherId}
                                            onValueChange={(value) => setNewClass({ ...newClass, teacherId: value })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all">
                                                <SelectValue placeholder="Select educator" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                                <SelectItem value="null">Unassigned</SelectItem>
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
                                        disabled={isLoading.create}
                                        className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-tighter shadow-lg shadow-indigo-500/20 mt-8"
                                    >
                                        {isLoading.create ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                                        Finalize Class Creation
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}
                </div>
            </div>

            {/* Table Core */}
            <div className="rounded-[2.5rem] border border-slate-100 overflow-hidden bg-white shadow-xl shadow-black/5">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Division / Identity</TableHead>
                            <TableHead className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Educator in Charge</TableHead>
                            <TableHead className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Rank</TableHead>
                            <TableHead className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Enrollment</TableHead>
                            <TableHead className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Academic Load</TableHead>
                            <TableHead className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Ops</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading.table ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i} className="border-slate-100 bg-white">
                                    <TableCell className="px-6 py-6"><div className="h-6 w-32 bg-slate-50 rounded-lg animate-pulse" /></TableCell>
                                    <TableCell className="px-6 py-6"><div className="h-8 w-8 rounded-full bg-slate-50 animate-pulse" /></TableCell>
                                    <TableCell className="px-6 py-6"><div className="h-5 w-24 bg-slate-50 rounded-full animate-pulse" /></TableCell>
                                    <TableCell className="px-6 py-6"><div className="h-6 w-12 bg-slate-50 rounded-lg animate-pulse" /></TableCell>
                                    <TableCell className="px-6 py-6"><div className="h-6 w-12 bg-slate-50 rounded-lg animate-pulse" /></TableCell>
                                    <TableCell className="px-6 py-6 text-right"><div className="h-8 w-8 ml-auto bg-slate-50 rounded-lg animate-pulse" /></TableCell>
                                </TableRow>
                            ))
                        ) : classes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-24 bg-slate-50/50">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center">
                                            <GraduationCap className="h-10 w-10 text-slate-200" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 font-sora uppercase tracking-tight">Academic void detected</p>
                                            <p className="text-sm text-slate-500 font-medium mt-1">Initialize your first class to begin curriculum tracking</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            classes.map((classItem) => (
                                <TableRow key={classItem.id} className="border-slate-100 hover:bg-slate-50/30 transition-colors group">
                                    <TableCell className="px-6 py-6 font-bold font-sora text-slate-800">
                                        <div className="flex flex-col">
                                            <span className="text-lg group-hover:text-indigo-600 transition-colors">{classItem.name}</span>
                                            {classItem.section && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 flex items-center">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mr-2" />
                                                    Block {classItem.section}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-6">
                                        {classItem.teacher ? (
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 rounded-xl shadow-sm border-2 border-white">
                                                    <AvatarImage src={classItem.teacher.user.profileImage || ""} />
                                                    <AvatarFallback className="bg-indigo-50 text-indigo-700 font-black">
                                                        {classItem.teacher.user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-bold text-slate-700">{classItem.teacher.user.name}</span>
                                            </div>
                                        ) : (
                                            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-6">
                                        {classItem.level ? (
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">{classItem.level.name}</span>
                                        ) : (
                                            <span className="text-slate-300">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-black text-slate-700">{classItem._count.students}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                                <BookOpen className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-black text-slate-700">{classItem._count.subjects}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-6 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="p-2 rounded-2xl border-slate-100 shadow-2xl min-w-[200px]">
                                                <DropdownMenuItem asChild className="rounded-xl cursor-default focus:bg-slate-50 py-3">
                                                    <Link href={`/dashboard/classes/${classItem.id}`} className="flex items-center w-full">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                                                            <Eye className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-bold text-slate-700">Detailed View</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                                {isAdmin && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => setClassToEdit(classItem)} className="rounded-xl py-3 focus:bg-slate-50">
                                                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mr-3">
                                                                <Pencil className="h-4 w-4" />
                                                            </div>
                                                            <span className="font-bold text-slate-700">Modify Class</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAddStudentClick(classItem)} className="rounded-xl py-3 focus:bg-slate-50">
                                                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mr-3">
                                                                <Users className="h-4 w-4" />
                                                            </div>
                                                            <span className="font-bold text-slate-700">Add Scholars</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-slate-50 my-2" />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(classItem.id)}
                                                            className="rounded-xl py-3 text-red-600 focus:bg-red-50 focus:text-red-700"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mr-3">
                                                                <Trash2 className="h-4 w-4" />
                                                            </div>
                                                            <span className="font-black uppercase tracking-tighter text-[11px]">Decommission</span>
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