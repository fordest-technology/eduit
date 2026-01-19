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
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
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
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Pencil, BookOpen, Trash2, Eye, Loader2, Users, Plus, GraduationCap, Sparkles } from "lucide-react"
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

            const promise = fetch("/api/classes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            }).then(async (response) => {
                const data = await response.json()
                if (!response.ok) {
                    throw new Error(data.message || "Failed to create class")
                }
                return data
            })

            toast.promise(promise, {
                loading: 'Initializing new class section...',
                success: () => {
                    setShowCreateSheet(false)
                    setNewClass({
                        name: "",
                        section: "",
                        teacherId: "null",
                        levelId: "null",
                    })
                    fetchClasses()
                    return `✅ Class "${formData.name}" initialized successfully!`
                },
                error: (err) => err instanceof Error ? err.message : "❌ Failed to create class",
            })

            await promise
        } catch (error) {
            console.error("Error creating class:", error)
        } finally {
            setIsLoading(prev => ({ ...prev, create: false }))
        }
    }

    const handleAssignSubject = async () => {
        try {
            if (!selectedClass || !selectedSubject) {
                toast.error("Please select both class and subject")
                return
            }

            setIsLoading(prev => ({ ...prev, assignSubject: true }))

            const promise = fetch(`/api/classes/${selectedClass}/subjects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subjectId: selectedSubject,
                }),
            }).then(async (response) => {
                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.message || "Failed to assign subject")
                }
                return response.json()
            })

            toast.promise(promise, {
                loading: 'Linking subject to class curriculum...',
                success: () => {
                    setShowAssignSubjectDialog(false)
                    setSelectedClass("")
                    setSelectedSubject("")
                    fetchClasses()
                    return '✅ Subject linked successfully!'
                },
                error: (err) => err instanceof Error ? err.message : '❌ Failed to assign subject',
            })

            await promise
        } catch (error) {
            console.error("Error assigning subject:", error)
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
        if (!classToDelete) return;

        try {
            setIsLoading(prev => ({ ...prev, delete: true }))
            
            const promise = fetch(`/api/classes/${classToDelete}`, {
                method: "DELETE",
            }).then(async (response) => {
                if (!response.ok) throw new Error("Failed to decommission class")
                return response.json()
            })

            toast.promise(promise, {
                loading: 'Decommissioning institutional class record...',
                success: () => {
                    setShowDeleteDialog(false)
                    setClassToDelete("")
                    fetchClasses()
                    return '✅ Class decommissioned successfully'
                },
                error: (err) => err instanceof Error ? err.message : '❌ Failed to delete class',
            })

            await promise
        } catch (error) {
            console.error("Error deleting class:", error)
        } finally {
            setIsLoading(prev => ({ ...prev, delete: false }))
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
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <Input
                        placeholder="Search classes or levels..."
                        className="pl-12 h-12 bg-white border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchClasses()}
                        disabled={isLoading.table}
                        className="h-12 w-12 rounded-2xl hover:bg-white hover:text-primary transition-all border border-transparent hover:border-slate-100"
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
                        <>
                            <Button
                                onClick={() => setShowCreateSheet(true)}
                                className="h-12 px-6 rounded-2xl font-black uppercase tracking-tighter shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Add Class
                            </Button>
                            
                            <ResponsiveSheet 
                                open={showCreateSheet} 
                                onOpenChange={setShowCreateSheet}
                                title="Assign New Class"
                                description="Configure the class profile and academic assignment"
                            >
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Class Identity</label>
                                        <Input
                                            placeholder="e.g., JSS 1"
                                            value={newClass.name}
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all capitalize"
                                            onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section Identifier</label>
                                        <Input
                                            placeholder="A, B, or C"
                                            value={newClass.section}
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all uppercase"
                                            onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Rank</label>
                                        <Select
                                            value={newClass.levelId}
                                            onValueChange={(value) => setNewClass({ ...newClass, levelId: value })}
                                        >
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white font-bold text-lg">
                                                <SelectValue placeholder="Select rank" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                                <SelectItem value="null" className="font-bold">General Enrollment</SelectItem>
                                                {levels.map((level) => (
                                                    <SelectItem key={level.id} value={level.id} className="font-bold">
                                                        {level.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">
                                            Linking to a rank auto-populates the curriculum for this section.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Educator</label>
                                        <Select
                                            value={newClass.teacherId}
                                            onValueChange={(value) => setNewClass({ ...newClass, teacherId: value })}
                                        >
                                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white font-bold text-lg">
                                                <SelectValue placeholder="Select faculty member" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                                <SelectItem value="null" className="font-bold text-slate-400 italic">No Lead Assigned</SelectItem>
                                                {teachersData.map((teacher) => (
                                                    <SelectItem key={teacher.id} value={teacher.id} className="font-bold">
                                                        {teacher.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => setShowCreateSheet(false)}
                                            className="flex-1 h-16 rounded-2xl font-bold text-slate-500 hover:text-slate-800"
                                        >
                                            Discard
                                        </Button>
                                        <Button
                                            onClick={handleCreateClass}
                                            disabled={isLoading.create}
                                            className="flex-[2] h-16 rounded-2xl font-black shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {isLoading.create ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                            Establish Class Arm
                                        </Button>
                                    </div>
                                </div>
                            </ResponsiveSheet>
                        </>
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
                        ) : (() => {
                            // Group classes by name
                            const grouped = classes.reduce((acc: any, cls) => {
                                if (!acc[cls.name]) {
                                    acc[cls.name] = {
                                        name: cls.name,
                                        arms: [],
                                        level: cls.level,
                                        totalStudents: 0,
                                        maxSubjects: 0,
                                        teachers: [] as any[]
                                    }
                                }
                                acc[cls.name].arms.push(cls)
                                acc[cls.name].totalStudents += cls._count.students
                                acc[cls.name].maxSubjects = Math.max(acc[cls.name].maxSubjects, cls._count.subjects)
                                if (cls.teacher) {
                                    acc[cls.name].teachers.push(cls.teacher)
                                }
                                return acc
                            }, {})

                            const groups = Object.values(grouped)

                            if (groups.length === 0) {
                                return (
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
                                )
                            }

                            return groups.map((group: any) => (
                                <TableRow key={group.name} className="border-slate-100 hover:bg-slate-50/30 transition-colors group">
                                    <TableCell className="px-6 py-6 font-bold font-sora text-slate-800">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-lg group-hover:text-primary transition-colors">
                                                {group.name}
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {group.arms.map((arm: any) => (
                                                    <Link key={arm.id} href={`/dashboard/classes/${arm.id}`}>
                                                        <Badge 
                                                            className="text-[10px] h-6 px-2.5 font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-primary/10 ring-4 ring-white"
                                                        >
                                                            {arm.section || "?"}
                                                        </Badge>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-6">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {group.teachers.length > 0 ? (
                                                group.teachers.map((teacher: any, idx: number) => (
                                                    <Avatar key={`${teacher.id}-${idx}`} className="inline-block h-9 w-9 rounded-xl border-2 border-white shadow-sm" title={teacher.user.name}>
                                                        <AvatarImage src={teacher.user.profileImage || ""} />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">{teacher.user.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                ))
                                            ) : (
                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100">Unassigned</span>
                                            )}
                                        </div>
                                        {group.teachers.length > 0 && (
                                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight">
                                                {group.teachers.length === 1 ? group.teachers[0].user.name : `${group.teachers.length} Educators`}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-6">
                                        {group.level ? (
                                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">{group.level.name}</span>
                                        ) : (
                                            <span className="text-slate-300">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-black text-slate-700">{group.totalStudents}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                                <BookOpen className="h-4 w-4" />
                                            </div>
                                            <span className="text-sm font-black text-slate-700">{group.maxSubjects}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-6 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white text-slate-400 hover:text-primary transition-all border border-transparent hover:border-slate-100">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="p-2 rounded-2xl border-slate-100 shadow-2xl min-w-[200px]">
                                                <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Arm to Manage</DropdownMenuLabel>
                                                {group.arms.map((arm: any) => (
                                                    <DropdownMenuItem key={arm.id} asChild className="rounded-xl focus:bg-slate-50 py-2.5">
                                                        <Link href={`/dashboard/classes/${arm.id}`} className="flex items-center w-full">
                                                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center mr-3 font-black text-[10px]">
                                                                {arm.section || "?"}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-700 text-sm">Class Section {arm.section}</span>
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase">{arm._count.students} Students</span>
                                                            </div>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ))}
                                                <DropdownMenuSeparator className="bg-slate-50 my-2" />
                                                <DropdownMenuItem 
                                                    onClick={() => {
                                                        const firstArm = group.arms[0];
                                                        if (firstArm) setClassToEdit(firstArm);
                                                    }} 
                                                    className="rounded-xl py-2.5 focus:bg-slate-50"
                                                >
                                                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mr-3">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">Quick Edit (Section {group.arms[0]?.section})</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        })()}
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

            {/* Add Student ResponsiveSheet */}
            <ResponsiveSheet 
                open={showAddStudentDialog} 
                onOpenChange={setShowAddStudentDialog}
                title="Enroll Student"
                description={`Assign a registered learner to ${currentClass?.name}.`}
                className="sm:max-w-md"
            >
                <div className="flex flex-col gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Learner</label>
                            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white font-bold text-lg">
                                    <SelectValue placeholder="Select student" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                    {availableStudents.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase">No available students found</div>
                                    ) : (
                                        availableStudents.map((student) => (
                                            <SelectItem key={student.id} value={student.id} className="rounded-xl">
                                                {student.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Academic Session</label>
                            <Select value={selectedSession} onValueChange={setSelectedSession}>
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white font-bold text-lg">
                                    <SelectValue placeholder="Select session" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                    {academicSessions.map((session) => (
                                        <SelectItem key={session.id} value={session.id} className="rounded-xl">
                                            {session.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50">
                        <Button 
                            variant="ghost" 
                            onClick={() => setShowAddStudentDialog(false)}
                            className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:text-slate-800"
                        >
                            Discard
                        </Button>
                        <Button
                            onClick={handleAddStudent}
                            disabled={isLoading.addStudent || !selectedStudent}
                            className="flex-[2] h-14 rounded-2xl font-black shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading.addStudent ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                            Process Enrollment
                        </Button>
                    </div>
                </div>
            </ResponsiveSheet>
        </div>
    )
} 