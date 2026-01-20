"use client"

import { useState, useEffect } from "react"
import { Teacher, columns } from "./columns"
import { Button } from "@/components/ui/button"
import { Plus, Users, GraduationCap, BookOpen, MoreHorizontal, Search, X, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AddTeacherModal } from "./add-teacher-modal"
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
import { TeacherSubjectsModal } from "./teacher-subjects-modal"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
// Remove TeacherStats import if it's causing issues, or define it locally if needed
// import { TeacherStats } from "./page";

// Define TeacherStats locally if it's not exported from page.tsx
export interface TeacherStats {
    total: number;
    subjects: number;
    departments: number;
    withClasses: number;
    activeStudents: number;
    activeClasses: number;
}

export interface TeachersClientProps {
    teachers: Teacher[];
    stats: TeacherStats;
    error?: string;
}

export function TeachersClient({ teachers: initialTeachers, stats, error }: TeachersClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false)
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
    const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>(initialTeachers)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterDepartment, setFilterDepartment] = useState("all")
    const [departments, setDepartments] = useState<{ id: string, name: string }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const router = useRouter()

    // Always use the state for the list of teachers
    useEffect(() => {
        setFilteredTeachers(initialTeachers)
    }, [initialTeachers])

    useEffect(() => {
        const fetchDepartments = async () => {
            setIsDepartmentsLoading(true)
            try {
                const response = await fetch('/api/departments')
                if (!response.ok) throw new Error('Failed to fetch departments')
                const data = await response.json()
                setDepartments(data)
            } catch (error) {
                console.error('Error fetching departments:', error)
                toast.error("Failed to load departments. Please refresh the page.")
            } finally {
                setIsDepartmentsLoading(false)
            }
        }

        fetchDepartments()
    }, [])

    useEffect(() => {
        let filtered = [...initialTeachers]

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter((teacher) =>
                teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Filter by department
        if (filterDepartment !== "all") {
            filtered = filtered.filter(
                (teacher) => teacher.departmentId === filterDepartment
            )
        }

        setFilteredTeachers(filtered)
    }, [searchQuery, filterDepartment, initialTeachers])

    const fetchTeachers = async (silent = false) => {
        const promise = (async () => {
            setIsLoading(true);
            const response = await fetch("/api/teachers")
            if (!response.ok) {
                throw new Error("Failed to fetch teachers")
            }
            const data = await response.json()
            if (data && Array.isArray(data.teachers)) {
                setFilteredTeachers(data.teachers as Teacher[]);
            } else {
                throw new Error("Invalid data format received")
            }
            return true;
        })();

        if (!silent) {
            toast.promise(promise, {
                loading: 'Accessing institutional staff registry...',
                success: '✅ Teacher directory synchronized',
                error: (err) => err instanceof Error ? err.message : '❌ Failed to fetch teachers',
            });
        }

        try {
            await promise;
        } finally {
            setIsLoading(false);
        }
    }

    const handleSuccess = async () => {
        setIsRefreshing(true)
        const promise = (async () => {
            await fetchTeachers(true)
            router.refresh()
            setIsAddModalOpen(false)
            // Wait for refresh
            await new Promise(resolve => setTimeout(resolve, 800));
            return true;
        })();

        toast.promise(promise, {
            loading: 'Reconciling staff updates across systems...',
            success: '✅ Academic records updated successfully!',
            error: '❌ Failed to refresh teachers data',
        });

        try {
            await promise;
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleManageSubjects = (teacher: Teacher) => {
        setSelectedTeacher(teacher)
        setIsSubjectsModalOpen(true)
    }

    const handleAddOrEdit = (teacher: Teacher | null) => {
        setSelectedTeacher(teacher)
        setIsAddModalOpen(true)
    }

    const resetFilters = () => {
        setSearchQuery("")
        setFilterDepartment("all")
    }

    // Render loading skeletons for stats cards
    const renderStatCardSkeleton = () => (
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="pb-2">
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
        </Card>
    )

    // Render loading skeletons for the table
    const renderTableSkeleton = () => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Classes</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array(5).fill(0).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                    <div className="flex flex-col gap-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                            <TableCell className="text-right">
                                <Skeleton className="h-8 w-8 ml-auto" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-700 font-poppins pb-10">
            {/* Stats Cards Section */}
            <DashboardStatsGrid columns={3}>
                <DashboardStatsCard
                    title="Total Teachers"
                    value={isLoading ? "..." : stats.total}
                    icon={Users}
                    color="blue"
                    description="Teaching staff"
                />
                <DashboardStatsCard
                    title="Departments"
                    value={isLoading ? "..." : stats.departments}
                    icon={GraduationCap}
                    color="purple"
                    description="With assigned teachers"
                />
                <DashboardStatsCard
                    title="Class Teachers"
                    value={isLoading ? "..." : stats.withClasses}
                    icon={BookOpen}
                    color="emerald"
                    description="Actively teaching classes"
                />
            </DashboardStatsGrid>

            {/* Error display */}
            {error && (
                <Card className="border-none shadow-xl shadow-red-500/10 rounded-[2.5rem] bg-white overflow-hidden p-8 border-l-4 border-red-500">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-red-50 rounded-full">
                            <X className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-red-600 font-sora">Something went wrong</h2>
                        <p className="text-center text-slate-500 font-medium max-w-md">
                            {error}
                        </p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-8 h-12"
                        >
                            Retry Connection
                        </Button>
                    </div>
                </Card>
            )}

            <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="px-8 pt-8 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <CardTitle className="text-2xl font-bold font-sora text-slate-800">Teacher Directory</CardTitle>
                            <CardDescription className="font-medium text-slate-500">Manage academic staff and department assignments</CardDescription>
                        </div>

                        <Button
                            onClick={() => handleAddOrEdit(null)}
                            disabled={isLoading || isRefreshing}
                            style={{ backgroundColor: "#4f46e5" }}
                            className="text-white rounded-2xl px-6 h-12 shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105"
                        >
                            {isRefreshing ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Plus className="mr-2 h-5 w-5" />
                                    Add New teacher
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-4">
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                            <div className="relative flex-1 w-full sm:w-auto">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    type="search"
                                    placeholder="Search teachers by name or email..."
                                    className="pl-12 h-12 w-full bg-white border-slate-200 rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={isLoading || isRefreshing}
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:bg-slate-100 rounded-lg"
                                        onClick={() => setSearchQuery("")}
                                        disabled={isLoading || isRefreshing}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <Select
                                    value={filterDepartment}
                                    onValueChange={setFilterDepartment}
                                    disabled={isDepartmentsLoading || isLoading || isRefreshing}
                                >
                                    <SelectTrigger className="h-12 w-full sm:w-[220px] bg-white border-slate-200 rounded-2xl">
                                        {isDepartmentsLoading ? (
                                            <div className="flex items-center">
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin text-indigo-500" />
                                                Loading...
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="Department Filter" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-200 shadow-xl shadow-black/5">
                                        <SelectItem value="all">All Departments</SelectItem>
                                        <SelectItem value="none">No Department</SelectItem>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {(searchQuery || filterDepartment !== "all") && (
                                    <Button
                                        variant="ghost"
                                        onClick={resetFilters}
                                        className="h-12 px-4 text-slate-500 hover:text-indigo-600 font-bold"
                                        disabled={isLoading || isRefreshing}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        {isLoading ? (
                            renderTableSkeleton()
                        ) : filteredTeachers.length > 0 ? (
                            <div className="rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-slate-100 hover:bg-transparent">
                                            <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Staff Member</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Contact Info</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Department</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Classes</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Subjects</TableHead>
                                            <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTeachers.map((teacher) => (
                                            <TableRow key={teacher.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                                <TableCell className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-12 w-12 rounded-2xl shadow-sm border border-white group-hover:scale-110 transition-transform duration-300">
                                                            <AvatarImage src={teacher.profileImage || undefined} className="object-cover" />
                                                            <AvatarFallback className="bg-slate-100 text-slate-700 font-bold">
                                                                {teacher.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 font-sora leading-tight">{teacher.name}</span>
                                                            <span className="text-xs text-slate-400 font-medium">{teacher.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-5 font-medium text-slate-600">
                                                    {teacher.phone || <span className="text-slate-300">—</span>}
                                                </TableCell>
                                                <TableCell className="px-6 py-5">
                                                    {teacher.department && teacher.department !== "No Department" ? (
                                                        <Badge className="rounded-full px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-none font-bold text-[10px] uppercase tracking-wider">
                                                            {typeof teacher.department === 'string' ? teacher.department : teacher.department.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs font-medium">Not Assigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 py-5">
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-blue-50 text-blue-600 font-black text-xs border border-blue-100">
                                                        {teacher.classes.length}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-5">
                                                    <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-purple-50 text-purple-600 font-black text-xs border border-purple-100">
                                                        {teacher.subjects.length}
                                                    </div>
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
                                                            <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-indigo-50 focus:text-indigo-600">
                                                                <Link href={`/dashboard/teachers/${teacher.id}`} className="flex items-center">
                                                                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3 group-hover:bg-white">
                                                                        <span className="text-sm">👁️</span>
                                                                    </div>
                                                                    <span className="font-bold text-sm">View Profile</span>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-indigo-50 focus:text-indigo-600">
                                                                <Link href={`/dashboard/teachers/${teacher.id}?tab=classes`} className="flex items-center">
                                                                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3">
                                                                        <span className="text-sm">🎓</span>
                                                                    </div>
                                                                    <span className="font-bold text-sm">Academic Load</span>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleManageSubjects(teacher)} className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-indigo-50 focus:text-indigo-600">
                                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3">
                                                                    <span className="text-sm">📚</span>
                                                                </div>
                                                                <span className="font-bold text-sm">Subject Matrix</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-2 bg-slate-100" />
                                                            <DropdownMenuItem onClick={() => handleAddOrEdit(teacher)} className="rounded-xl px-3 py-2 cursor-pointer transition-colors focus:bg-amber-50 focus:text-amber-600">
                                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center mr-3">
                                                                    <span className="text-sm">✏️</span>
                                                                </div>
                                                                <span className="font-bold text-sm">Edit Details</span>
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
                                {searchQuery || filterDepartment !== "all" ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-5 bg-white rounded-3xl shadow-sm border border-slate-100">
                                            <Search className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-slate-800 font-sora">No results found</p>
                                            <p className="text-sm text-slate-500 font-medium mt-1">Try adjusting your filters or search terms</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl px-6 h-10 border-slate-200 font-bold hover:bg-white">
                                            Clear All Filters
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="p-5 bg-white rounded-3xl shadow-sm border border-slate-100">
                                            <Users className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-slate-800 font-sora">Teacher pool is empty</p>
                                            <p className="text-sm text-slate-500 font-medium mt-1">Start by adding your first academic staff member</p>
                                        </div>
                                        <Button onClick={() => handleAddOrEdit(null)} className="rounded-[1.25rem] px-8 h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25">
                                            <Plus className="mr-2 h-5 w-5" />
                                            Add Your First Teacher
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <AddTeacherModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onSuccess={fetchTeachers}
                teacherToEdit={selectedTeacher}
            />

            {selectedTeacher && (
                <TeacherSubjectsModal
                    open={isSubjectsModalOpen}
                    onOpenChange={setIsSubjectsModalOpen}
                    teacher={selectedTeacher}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
} 