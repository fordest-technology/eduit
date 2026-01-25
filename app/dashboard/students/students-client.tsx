"use client"

import { useState, useEffect, useRef } from "react"
import { columns } from "./columns"
import { Button } from "@/components/ui/button"
import { Plus, Users, GraduationCap, School, Search, X, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AddStudentSheet } from "./add-student-sheet"
import { cn } from "@/lib/utils"
import { DashboardStatsCard, DashboardStatsGrid } from "@/components/dashboard-stats-card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface StudentParams {
    classId?: string;
    departmentId?: string;
    notInClassId?: string;
}

export interface StudentStats {
    total: number
    classes: number
    withParents: number
    levels?: number
}

export interface StudentsClientProps {
    students: Student[]
    stats: StudentStats
    error?: string
}

export interface Student {
    id: string
    name: string
    email: string
    profileImage: string | null
    rollNumber?: string
    classId?: string
    classes: Array<{
        id: string
        class: {
            id: string
            name: string
            section?: string
            level: {
                id: string
                name: string
            }
        }
    }>
    currentClass?: {
        name: string
        id: string
        level: {
            id: string
            name: string
        }
    }
    hasParents: boolean
    parentNames?: string
    schoolId?: string
}

export function StudentsClient({ students: initialStudents, stats, error: initialError }: StudentsClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [filteredStudents, setFilteredStudents] = useState<Student[]>(initialStudents)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterLevel, setFilterLevel] = useState("all")
    const [filterClass, setFilterClass] = useState("all")
    const [levels, setLevels] = useState<{ id: string, name: string }[]>([])
    const [classes, setClasses] = useState<{ id: string, name: string }[]>([])
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(initialError || null)
    const [selectedClass, setSelectedClass] = useState<string>('')
    const [selectedDepartment, setSelectedDepartment] = useState<string>('')

    const isFirstMount = useRef(true)

    useEffect(() => {
        // Skip the initial fetch if we already have initialStudents from the server
        // and no filters are applied yet
        if (isFirstMount.current && !selectedClass && !selectedDepartment && initialStudents.length > 0) {
            isFirstMount.current = false
            return
        }

        async function getStudents() {
            try {
                setIsLoading(true)
                setError(null)
                const response = await fetch(`/api/students?${new URLSearchParams({
                    ...(selectedClass && { classId: selectedClass }),
                    ...(selectedDepartment && { departmentId: selectedDepartment })
                })}`)

                if (!response.ok) {
                    throw new Error('Failed to fetch students')
                }

                const data = await response.json()
                if (Array.isArray(data)) {
                    setFilteredStudents(data)
                } else {
                    setError('Invalid response format from server')
                }
            } catch (err) {
                setError('Failed to fetch students')
            } finally {
                setIsLoading(false)
            }
        }
        getStudents()
        isFirstMount.current = false
    }, [selectedClass, selectedDepartment, initialStudents])

    useEffect(() => {
        // Fetch levels for filtering
        const fetchLevels = async () => {
            try {
                const response = await fetch('/api/school-levels')
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to fetch school levels')
                }
                const data = await response.json()
                setLevels(data)
            } catch (err: any) {
                setError(err.message || 'Failed to fetch levels')
            }
        }

        // Fetch classes for filtering
        const fetchClasses = async () => {
            try {
                const response = await fetch('/api/classes')
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to fetch classes')
                }
                const data = await response.json()
                setClasses(data)
            } catch (err: any) {
                setError(err.message || 'Failed to fetch classes')
            }
        }

        fetchLevels()
        fetchClasses()
    }, [])

    useEffect(() => {
        let filtered = [...initialStudents]

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter((student) =>
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (student.currentClass?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (student.currentClass?.level.name || "").toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Apply class filter using the classes array
        if (filterClass !== "all" && filterClass !== "none") {
            filtered = filtered.filter(student =>
                student.classes.some(cls => cls.class.id === filterClass)
            )
        } else if (filterClass === "none") {
            filtered = filtered.filter(student => !student.classes.length)
        }

        // Apply level filter
        if (filterLevel !== "all" && filterLevel !== "none") {
            filtered = filtered.filter(student => student.currentClass?.level.id === filterLevel)
        } else if (filterLevel === "none") {
            filtered = filtered.filter(student => !student.currentClass?.level)
        }

        setFilteredStudents(filtered)
    }, [searchQuery, filterLevel, filterClass, initialStudents])

    // Remove debug logging - this was causing performance issues

    const handleSuccess = async () => {
        setIsLoading(true);
        const promise = (async () => {
            const response = await fetch('/api/students', {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch updated students');
            }

            const data = await response.json();
            if (Array.isArray(data)) {
                setFilteredStudents(data);
            }

            setIsAddModalOpen(false);
            setSelectedStudent(null);
            return true;
        })();

        toast.promise(promise, {
            loading: 'Synchronizing student directory with latest records...',
            success: '✅ Student database updated successfully',
            error: (err) => err instanceof Error ? err.message : '❌ Failed to refresh student list',
        });

        await promise;
        setIsLoading(false);
    }

    const resetFilters = () => {
        setSearchQuery("")
        setFilterLevel("all")
        setFilterClass("all")
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 font-poppins pb-10">
            {/* Stats Cards Section */}
            <DashboardStatsGrid columns={4}>
                <DashboardStatsCard
                    title="Total Students"
                    value={isLoading ? "..." : stats.total}
                    icon={Users}
                    color="blue"
                    description="Active enrollments"
                />
                <DashboardStatsCard
                    title="Classes"
                    value={isLoading ? "..." : stats.classes}
                    icon={GraduationCap}
                    color="purple"
                    description="With assigned students"
                />
                <DashboardStatsCard
                    title="Levels"
                    value={isLoading ? "..." : (stats.levels || 0)}
                    icon={School}
                    color="emerald"
                    description="School levels represented"
                />
                <DashboardStatsCard
                    title="Parents"
                    value={isLoading ? "..." : stats.withParents}
                    icon={Users}
                    color="rose"
                    description="With parent accounts"
                />
            </DashboardStatsGrid>

            {/* Error display */}
            {error && (
                <Card className="border-none shadow-xl shadow-red-500/10 rounded-[2.5rem] bg-white overflow-hidden p-8 border-l-4 border-red-500">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-red-50 rounded-full">
                            <X className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-red-600 font-sora">Student Database Error</h2>
                        <p className="text-center text-slate-500 font-medium max-w-md">
                            {error}
                        </p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-8 h-12"
                        >
                            Retry Loading
                        </Button>
                    </div>
                </Card>
            )}

            <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="px-8 pt-8 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <CardTitle className="text-2xl font-bold font-sora text-slate-800">Student Directory</CardTitle>
                            <CardDescription className="font-medium text-slate-500">Manage student profiles, academic progress and records</CardDescription>
                        </div>

                        <Button
                            onClick={() => {
                                setSelectedStudent(null)
                                setIsAddModalOpen(true)
                            }}
                            style={{ backgroundColor: "#4f46e5" }}
                            className="text-white rounded-2xl px-6 h-12 shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Add Student
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-4">
                    <div className="space-y-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    type="search"
                                    placeholder="Search students by name, email or class..."
                                    className="pl-12 h-12 w-full bg-white border-slate-200 rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:bg-slate-100 rounded-lg"
                                        onClick={() => setSearchQuery("")}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                <Select value={filterLevel} onValueChange={setFilterLevel}>
                                    <SelectTrigger className="h-12 w-full sm:w-[160px] bg-white border-slate-200 rounded-2xl">
                                        <SelectValue placeholder="Level Filter" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-200 shadow-xl shadow-black/5">
                                        <SelectItem value="all">All Levels</SelectItem>
                                        <SelectItem value="none">No Level</SelectItem>
                                        {levels.map(level => (
                                            <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={filterClass} onValueChange={setFilterClass}>
                                    <SelectTrigger className="h-12 w-full sm:w-[160px] bg-white border-slate-200 rounded-2xl">
                                        <SelectValue placeholder="Class Filter" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-200 shadow-xl shadow-black/5">
                                        <SelectItem value="all">All Classes</SelectItem>
                                        <SelectItem value="none">No Class</SelectItem>
                                        {classes.map(cls => (
                                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {(searchQuery || filterLevel !== "all" || filterClass !== "all") && (
                                    <Button
                                        variant="ghost"
                                        onClick={resetFilters}
                                        className="h-12 px-4 text-slate-500 hover:text-indigo-600 font-bold"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-3xl">
                                        <Skeleton className="h-12 w-12 rounded-2xl" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-1/4" />
                                            <Skeleton className="h-3 w-1/3" />
                                        </div>
                                        <Skeleton className="h-5 w-24 rounded-full" />
                                        <Skeleton className="h-8 w-8 rounded-xl" />
                                    </div>
                                ))}
                            </div>
                        ) : filteredStudents.length > 0 ? (
                            <div className="rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-slate-100 hover:bg-transparent">
                                            <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Student Identity</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Academic Path</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Ref Code</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Kinship</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStudents.map((student) => (
                                            <TableRow key={student.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                                <TableCell className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-12 w-12 rounded-2xl shadow-sm border border-white group-hover:scale-110 transition-transform duration-300">
                                                            <AvatarImage src={student.profileImage || ""} className="object-cover" />
                                                            <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">
                                                                {(student.name || "S").charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 font-sora leading-tight">{student.name}</span>
                                                            <span className="text-xs text-slate-400 font-medium">{student.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-5">
                                                    {student.currentClass ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            <Badge className="rounded-full px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 shadow-none font-bold text-[10px] uppercase tracking-wider w-fit">
                                                                {student.currentClass.name}
                                                            </Badge>
                                                            {student.classes.length > 1 && (
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight ml-1">
                                                                    +{student.classes.length - 1} Multiple Tracks
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs font-medium">No Path Assigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 py-5">
                                                    {student.rollNumber ? (
                                                        <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                                                            {student.rollNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 py-5">
                                                    {student.hasParents ? (
                                                        <Badge className="rounded-full px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-none font-bold text-[10px] uppercase tracking-wider">
                                                            Joined: {student.parentNames}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs font-medium">No Parent Linked</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 py-5 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100">
                                                                <MoreHorizontal className="h-5 w-5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-200 shadow-xl shadow-black/5 p-2 min-w-[200px]">
                                                            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => router.push(`/dashboard/students/${student.id}`)} className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-indigo-50 focus:text-indigo-600 font-bold text-sm">
                                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-white">
                                                                    <span>👁️</span>
                                                                </div>
                                                                View Student Record
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-2 bg-slate-100" />
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedStudent(student)
                                                                setIsAddModalOpen(true)
                                                            }} className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-amber-50 focus:text-amber-600 font-bold text-sm">
                                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3">
                                                                    <span>✏️</span>
                                                                </div>
                                                                Modify Profile
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                {searchQuery || filterLevel !== "all" || filterClass !== "all" ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-5 bg-white rounded-3xl shadow-sm border border-slate-100">
                                            <Search className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-slate-800 font-sora">No scholars found</p>
                                            <p className="text-sm text-slate-500 font-medium mt-1">Refine your criteria and try searching again</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl px-6 h-10 border-slate-200 font-bold hover:bg-white">
                                            Reset Filter Layout
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-5 bg-white rounded-3xl shadow-sm border border-slate-100">
                                            <Users className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-slate-800 font-sora">Student database is empty</p>
                                            <p className="text-sm text-slate-500 font-medium mt-1">Enroll your first student to begin tracking their journey</p>
                                        </div>
                                        <Button onClick={() => {
                                            setSelectedStudent(null)
                                            setIsAddModalOpen(true)
                                        }} className="rounded-[1.25rem] px-8 h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25">
                                            <Plus className="mr-2 h-5 w-5" />
                                            Admit First Student
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <AddStudentSheet
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onSuccess={handleSuccess}
                studentToEdit={selectedStudent}
            />
        </div>
    )
}

export async function fetchStudents(params: StudentParams): Promise<Student[]> {
    const searchParams = new URLSearchParams();
    if (params.classId) searchParams.set('classId', params.classId);
    if (params.departmentId) searchParams.set('departmentId', params.departmentId);
    if (params.notInClassId) searchParams.set('notInClassId', params.notInClassId);

    const response = await fetch(`/api/students?${searchParams.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch students');
    }

    const data = await response.json();

    return data.map((student: any) => {
        // Properly handle student classes
        const studentClasses = student.classes?.map((sc: any) => ({
            id: sc.id,
            class: {
                id: sc.class.id,
                name: sc.class.name,
                section: sc.class.section,
                level: {
                    id: sc.class.level.id,
                    name: sc.class.level.name
                }
            }
        })) ?? [];

        // Get the current/primary class if any
        type StudentClass = Student['classes'][0];
        const currentClass = studentClasses.find((sc: StudentClass) => sc.class.id === student.classId)?.class || studentClasses[0]?.class;

        return {
            id: student.id,
            name: student.user?.name ?? '',
            email: student.user?.email ?? '',
            profileImage: student.user?.profileImage ?? '',
            rollNumber: student.rollNumber ?? '',
            classId: student.classId ?? undefined,
            classes: studentClasses,
            currentClass: currentClass ? {
                id: currentClass.id,
                name: `${currentClass.level.name}${currentClass.section ? ' ' + currentClass.section : ''}`,
                level: currentClass.level
            } : undefined,
            hasParents: Boolean(student.parents?.length),
            parentNames: student.parents?.map((p: any) => p.parent.user?.name).filter(Boolean).join(', ') || '',
            schoolId: student.schoolId
        };
    });
} 