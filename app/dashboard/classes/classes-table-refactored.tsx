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
    SheetFooter,
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
import { MoreHorizontal, Pencil, BookOpen, Trash2, Eye, Loader2, Users, Plus, GraduationCap, ChevronDown, ChevronRight } from "lucide-react"
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

interface GroupedLevel {
    levelId: string | null
    levelName: string
    arms: Class[]
    totalStudents: number
    totalSubjects: number
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
    const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set())
    const [newArm, setNewArm] = useState({
        levelId: "",
        section: "",
        teacherId: "null",
    })
    const [showCreateArmSheet, setShowCreateArmSheet] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [levels, setLevels] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState({
        table: true,
        create: false,
        delete: false,
    })
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [classToDelete, setClassToDelete] = useState<string>("")
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

    useEffect(() => {
        fetchClasses()
        fetchLevels()
    }, [])

    // Group classes by level
    const groupedLevels: GroupedLevel[] = classes.reduce((acc: GroupedLevel[], cls) => {
        const levelId = cls.level?.id || null
        const levelName = cls.level?.name || "No Level"

        let group = acc.find(g => g.levelId === levelId)
        if (!group) {
            group = {
                levelId,
                levelName,
                arms: [],
                totalStudents: 0,
                totalSubjects: 0
            }
            acc.push(group)
        }

        group.arms.push(cls)
        group.totalStudents += cls._count.students
        group.totalSubjects += cls._count.subjects

        return acc
    }, [])

    const toggleLevel = (levelId: string | null) => {
        const key = levelId || "null"
        const newExpanded = new Set(expandedLevels)
        if (newExpanded.has(key)) {
            newExpanded.delete(key)
        } else {
            newExpanded.add(key)
        }
        setExpandedLevels(newExpanded)
    }

    const handleCreateArm = async () => {
        try {
            if (!newArm.levelId || !newArm.section) {
                toast.error("Please select a level and specify a section")
                return
            }

            setIsCreating(true)

            const selectedLevel = levels.find(l => l.id === newArm.levelId)
            const className = `${selectedLevel?.name || "Class"}`

            const response = await fetch("/api/classes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: className,
                    section: newArm.section,
                    levelId: newArm.levelId,
                    teacherId: newArm.teacherId === "null" ? null : newArm.teacherId,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || "Failed to create arm")
            }

            toast.success(`✅ ${className} - Section ${newArm.section} created successfully`)
            setShowCreateArmSheet(false)
            setNewArm({ levelId: "", section: "", teacherId: "null" })
            fetchClasses()
        } catch (error) {
            logger.error("Error creating arm", error)
            toast.error(error instanceof Error ? error.message : "Failed to create arm")
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteClick = (classId: string) => {
        setClassToDelete(classId)
        setShowDeleteDialog(true)
    }

    const handleDeleteConfirm = async () => {
        if (!classToDelete) return

        try {
            setIsLoading(prev => ({ ...prev, delete: true }))

            const promise = fetch(`/api/classes/${classToDelete}`, {
                method: "DELETE",
            }).then(async (response) => {
                if (!response.ok) throw new Error("Failed to delete class")
                return response.json()
            })

            toast.promise(promise, {
                loading: 'Deleting class...',
                success: () => {
                    setShowDeleteDialog(false)
                    setClassToDelete("")
                    fetchClasses()
                    return '✅ Class deleted successfully'
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
                        <Sheet open={showCreateArmSheet} onOpenChange={setShowCreateArmSheet}>
                            <SheetTrigger asChild>
                                <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold">
                                    <Plus className="mr-2 h-5 w-5" />
                                    Add Class Arm
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="rounded-l-[2.5rem] p-8 border-none shadow-2xl">
                                <SheetHeader className="pb-8">
                                    <SheetTitle className="text-2xl font-black font-sora text-slate-800">Create Class Arm</SheetTitle>
                                    <SheetDescription className="font-medium text-slate-500">
                                        Add a new section/arm to an existing class level
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="space-y-6 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Class Level</label>
                                        <Select
                                            value={newArm.levelId}
                                            onValueChange={(value) => setNewArm({ ...newArm, levelId: value })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all">
                                                <SelectValue placeholder="Select level (e.g., JSS 1, SS 2)" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                                {levels.map((level) => (
                                                    <SelectItem key={level.id} value={level.id}>
                                                        {level.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Section/Arm</label>
                                        <Input
                                            placeholder="A, B, or C"
                                            value={newArm.section}
                                            className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all uppercase"
                                            onChange={(e) => setNewArm({ ...newArm, section: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Form Teacher (Optional)</label>
                                        <Select
                                            value={newArm.teacherId}
                                            onValueChange={(value) => setNewArm({ ...newArm, teacherId: value })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all">
                                                <SelectValue placeholder="Assign teacher" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl border-slate-100">
                                                <SelectItem value="null">No Teacher</SelectItem>
                                                {teachersData.map((teacher) => (
                                                    <SelectItem key={teacher.id} value={teacher.id}>
                                                        {teacher.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <SheetFooter className="mt-8">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowCreateArmSheet(false)}
                                        className="rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateArm}
                                        disabled={isCreating}
                                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Arm
                                    </Button>
                                </SheetFooter>
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
                            <TableHead className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Class / Level</TableHead>
                            <TableHead className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Arms</TableHead>
                            <TableHead className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Total Students</TableHead>
                            <TableHead className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Subjects</TableHead>
                            <TableHead className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Actions</TableHead>
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
                                    <TableCell className="px-6 py-6 text-right"><div className="h-8 w-8 ml-auto bg-slate-50 rounded-lg animate-pulse" /></TableCell>
                                </TableRow>
                            ))
                        ) : groupedLevels.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-24 bg-slate-50/50">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center">
                                            <GraduationCap className="h-10 w-10 text-slate-200" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 font-sora uppercase tracking-tight">No classes found</p>
                                            <p className="text-sm text-slate-500 font-medium mt-1">Create your first class to get started</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            groupedLevels.map((group) => {
                                const isExpanded = expandedLevels.has(group.levelId || "null")
                                return (
                                    <>
                                        <TableRow 
                                            key={group.levelId || "null"} 
                                            className="border-slate-100 hover:bg-slate-50/30 transition-colors group cursor-pointer"
                                            onClick={() => toggleLevel(group.levelId)}
                                        >
                                            <TableCell className="px-6 py-6 font-bold font-sora text-slate-800">
                                                <div className="flex items-center gap-3">
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-5 w-5 text-indigo-600" />
                                                    ) : (
                                                        <ChevronRight className="h-5 w-5 text-slate-400" />
                                                    )}
                                                    <span className="text-lg group-hover:text-indigo-600 transition-colors">{group.levelName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-6">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-widest rounded-full border border-indigo-100">
                                                    {group.arms.length} {group.arms.length === 1 ? 'Arm' : 'Arms'}
                                                </span>
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
                                                    <span className="text-sm font-black text-slate-700">{group.totalSubjects}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-6 text-right">
                                                <Button variant="ghost" size="sm" className="rounded-xl">
                                                    View Details
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        {isExpanded && group.arms.map((classItem) => (
                                            <TableRow key={classItem.id} className="border-slate-100 bg-slate-50/30 hover:bg-slate-100/50 transition-colors">
                                                <TableCell className="px-6 py-4 pl-16">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-slate-600">Section {classItem.section || "—"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    {classItem.teacher ? (
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-8 w-8 rounded-lg shadow-sm border-2 border-white">
                                                                <AvatarImage src={classItem.teacher.user.profileImage || ""} />
                                                                <AvatarFallback className="bg-indigo-50 text-indigo-700 font-black text-xs">
                                                                    {classItem.teacher.user.name.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-xs font-medium text-slate-600">{classItem.teacher.user.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-100">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <span className="text-sm font-medium text-slate-600">{classItem._count.students}</span>
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <span className="text-sm font-medium text-slate-600">{classItem._count.subjects}</span>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="p-2 rounded-2xl">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/classes/${classItem.id}`} className="flex items-center">
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    View Details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            {isAdmin && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteClick(classItem.id)}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </>
                                )
                            })
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
        </div>
    )
}
