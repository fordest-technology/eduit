"use client"

import { useState, useEffect } from "react"
import { columns, Teacher } from "./columns"
import { Button } from "@/components/ui/button"
import { Plus, Users, GraduationCap, BookOpen, MoreHorizontal, Search, X, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AddTeacherModal } from "./add-teacher-modal"
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
import { Teacher, User, Department } from "@prisma/client"

interface TeacherData {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    phone: string | null;
    employeeId: string | null;
    qualifications: string | null;
    specialization: string | null;
    joiningDate: Date | null;
    departmentId: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    emergencyContact: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    department?: Department;
    stats: {
        totalClasses: number;
        totalStudents: number;
        totalSubjects: number;
    };
    subjects: Array<{
        id: string;
        name: string;
    }>;
    classes: Array<{
        id: string;
        name: string;
        studentCount: number;
    }>;
}

interface TeacherStats {
    total: number;
    subjects: number;
    departments: number;
    withClasses: number;
    activeStudents: number;
    activeClasses: number;
}

export interface TeachersClientProps {
    teachers: TeacherData[];
    stats: TeacherStats;
    error?: string;
}

export function TeachersClient({ teachers, stats, error }: TeachersClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false)
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(null)
    const [filteredTeachers, setFilteredTeachers] = useState<TeacherData[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filterDepartment, setFilterDepartment] = useState("all")
    const [departments, setDepartments] = useState<{ id: string, name: string }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const router = useRouter()

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
        if (teachers.length > 0) {
            setFilteredTeachers(teachers)
            setIsLoading(false)
        }
    }, [teachers])

    useEffect(() => {
        let filtered = [...teachers]

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
    }, [searchQuery, filterDepartment, teachers])

    const fetchTeachers = async () => {
        try {
            const response = await fetch("/api/teachers")
            if (!response.ok) {
                throw new Error("Failed to fetch teachers")
            }
            const data = await response.json()
            if (Array.isArray(data)) {
                const formattedData = data.map((teacher) => ({
                    ...teacher,
                    name: teacher.user.name,
                    email: teacher.user.email,
                }))
                setFilteredTeachers(formattedData)
            } else {
                console.error("Invalid data format received:", data)
                toast.error("Received invalid data format. Please refresh.")
            }
        } catch (error) {
            console.error("Error fetching teachers:", error)
            toast.error("Failed to fetch teachers")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSuccess = async () => {
        setIsRefreshing(true)
        try {
            await fetchTeachers()
            router.refresh()
            setIsAddModalOpen(false)
            toast.success("Teachers updated successfully")
        } catch (error) {
            console.error("Error refreshing teachers:", error)
            toast.error("Failed to refresh teachers data")
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleManageSubjects = (teacher: TeacherData) => {
        setSelectedTeacher(teacher)
        setIsSubjectsModalOpen(true)
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
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isLoading ? (
                    <>
                        {renderStatCardSkeleton()}
                        {renderStatCardSkeleton()}
                        {renderStatCardSkeleton()}
                    </>
                ) : (
                    <>
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                                    <Users className="mr-2 h-5 w-5" />
                                    Total Teachers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-blue-800">{stats.total}</p>
                                <p className="text-sm text-blue-600 mt-1">Teaching staff</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                                    <GraduationCap className="mr-2 h-5 w-5" />
                                    Departments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-purple-800">{stats.departments}</p>
                                <p className="text-sm text-purple-600 mt-1">With assigned teachers</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
                                    <BookOpen className="mr-2 h-5 w-5" />
                                    Class Teachers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-emerald-800">{stats.withClasses}</p>
                                <p className="text-sm text-emerald-600 mt-1">Actively teaching classes</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Error display */}
            {error && (
                <div className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm mb-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <h2 className="text-xl font-bold text-red-500">Error</h2>
                        <p className="text-center text-muted-foreground">
                            {error}
                        </p>
                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Retry
                        </Button>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle>Teachers</CardTitle>
                        <CardDescription>
                            Manage teacher profiles and assignments
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="relative flex-1 w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    type="search"
                                    placeholder="Search teachers..."
                                    className="pl-9 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={isLoading || isRefreshing}
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-7 w-7"
                                        onClick={() => setSearchQuery("")}
                                        disabled={isLoading || isRefreshing}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <Select
                                    value={filterDepartment}
                                    onValueChange={setFilterDepartment}
                                    disabled={isDepartmentsLoading || isLoading || isRefreshing}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        {isDepartmentsLoading ? (
                                            <div className="flex items-center">
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Loading...
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="Filter by department" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        <SelectItem value="none">No Department</SelectItem>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {(searchQuery || filterDepartment !== "all") && (
                                    <Button
                                        variant="outline"
                                        onClick={resetFilters}
                                        size="sm"
                                        className="mt-1 sm:mt-0"
                                        disabled={isLoading || isRefreshing}
                                    >
                                        Clear Filters
                                    </Button>
                                )}

                                <Button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="ml-auto"
                                    disabled={isLoading || isRefreshing}
                                >
                                    {isRefreshing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Teacher
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {isLoading ? (
                            renderTableSkeleton()
                        ) : filteredTeachers.length > 0 ? (
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
                                        {filteredTeachers.map((teacher) => (
                                            <TableRow key={teacher.id} className="hover:bg-primary/5">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={teacher.profileImage || undefined} />
                                                            <AvatarFallback>{teacher.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{teacher.name}</span>
                                                            <span className="text-xs text-muted-foreground">{teacher.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{teacher.phone || "-"}</TableCell>
                                                <TableCell>
                                                    {teacher.department && teacher.department !== "No Department" ? (
                                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                            {teacher.department}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">Not Assigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                                                        {teacher.classes.length}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                                                        {teacher.subjects.length}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/teachers/${teacher.id}`}>
                                                                    <span className="flex items-center">
                                                                        <span className="mr-2">👁️</span>
                                                                        View Details
                                                                    </span>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/teachers/${teacher.id}?tab=classes`}>
                                                                    <span className="flex items-center">
                                                                        <span className="mr-2">🎓</span>
                                                                        Manage Classes
                                                                    </span>
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleManageSubjects(teacher)}>
                                                                <span className="flex items-center">
                                                                    <span className="mr-2">📚</span>
                                                                    Manage Subjects
                                                                </span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedTeacher(teacher)
                                                                setIsAddModalOpen(true)
                                                            }}>
                                                                <span className="flex items-center">
                                                                    <span className="mr-2">✏️</span>
                                                                    Edit Teacher
                                                                </span>
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
                            <div className="flex flex-col items-center justify-center py-10">
                                {searchQuery || filterDepartment !== "all" ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="h-10 w-10 text-muted-foreground/50" />
                                        <p>No teachers match your search criteria</p>
                                        <Button variant="outline" size="sm" onClick={resetFilters}>
                                            Clear Filters
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="h-10 w-10 text-muted-foreground/50" />
                                        <p>No teachers found</p>
                                        <Button onClick={() => setIsAddModalOpen(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
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
                onSuccess={handleSuccess}
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