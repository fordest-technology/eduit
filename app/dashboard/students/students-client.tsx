"use client"

import { useState, useEffect } from "react"
import { columns } from "./columns"
import { Button } from "@/components/ui/button"
import { Plus, Users, GraduationCap, School, Search, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AddStudentModal } from "./add-student-modal"
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

    useEffect(() => {
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
                    console.error('Invalid response format:', data)
                    setError('Invalid response format from server')
                }
            } catch (err) {
                setError('Failed to fetch students')
                console.error('Error fetching students:', err)
            } finally {
                setIsLoading(false)
            }
        }
        getStudents()
    }, [selectedClass, selectedDepartment])

    useEffect(() => {
        // Fetch levels for filtering
        const fetchLevels = async () => {
            try {
                const response = await fetch('/api/school-levels')
                if (!response.ok) throw new Error('Failed to fetch school levels')
                const data = await response.json()
                setLevels(data)
            } catch (err) {
                console.error('Error fetching levels:', err)
                setError('Failed to fetch levels')
            }
        }

        // Fetch classes for filtering
        const fetchClasses = async () => {
            try {
                const response = await fetch('/api/classes')
                if (!response.ok) throw new Error('Failed to fetch classes')
                const data = await response.json()
                setClasses(data)
            } catch (err) {
                console.error('Error fetching classes:', err)
                setError('Failed to fetch classes')
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

    useEffect(() => {
        initialStudents.forEach(student => {
            if (student.schoolId) {
                console.log('School ID for student', student.id, ':', student.schoolId);
            }
        });
    }, [initialStudents]);

    const handleSuccess = async () => {
        try {
            // Fetch the latest student data
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

            // Close the modal
            setIsAddModalOpen(false);
            setSelectedStudent(null);

            // Show success message
            toast.success("Student created successfully");
        } catch (error) {
            console.error('Error refreshing students:', error);
            toast.error('Failed to refresh student list');
        }
    }

    const resetFilters = () => {
        setSearchQuery("")
        setFilterLevel("all")
        setFilterClass("all")
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                            <Users className="mr-2 h-5 w-5" />
                            Students
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-800">{stats.total}</p>
                        <p className="text-sm text-blue-600 mt-1">Total students</p>
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
                        <p className="text-3xl font-bold text-purple-800">{stats.classes}</p>
                        <p className="text-sm text-purple-600 mt-1">With assigned students</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-green-700">
                            <School className="mr-2 h-5 w-5" />
                            Levels
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-800">{stats.levels || 0}</p>
                        <p className="text-sm text-green-600 mt-1">School levels represented</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-emerald-700">
                            <Users className="mr-2 h-5 w-5" />
                            Parents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-800">{stats.withParents}</p>
                        <p className="text-sm text-emerald-600 mt-1">Students with parent accounts</p>
                    </CardContent>
                </Card>
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
                        <CardTitle>Students</CardTitle>
                        <CardDescription>
                            Manage student profiles and track academic progress
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
                                    placeholder="Search students..."
                                    className="pl-9 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-7 w-7"
                                        onClick={() => setSearchQuery("")}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <Select value={filterLevel} onValueChange={setFilterLevel}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Levels</SelectItem>
                                        <SelectItem value="none">No Level</SelectItem>
                                        {levels.map(level => (
                                            <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={filterClass} onValueChange={setFilterClass}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        <SelectItem value="none">No Class</SelectItem>
                                        {classes.map(cls => (
                                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {(searchQuery || filterLevel !== "all" || filterClass !== "all") && (
                                    <Button variant="outline" onClick={resetFilters} size="sm" className="mt-1 sm:mt-0">
                                        Clear Filters
                                    </Button>
                                )}

                                <Button onClick={() => {
                                    setSelectedStudent(null)
                                    setIsAddModalOpen(true)
                                }} className="ml-auto">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Student
                                </Button>
                            </div>
                        </div>

                        {filteredStudents.length > 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Roll Number</TableHead>
                                            <TableHead>Parents</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStudents.map((student) => (
                                            <TableRow key={student.id} className="hover:bg-primary/5">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage
                                                                src={student.profileImage || ""}
                                                                alt={student.name || "Student"}
                                                            />
                                                            <AvatarFallback>
                                                                {(student.name || "S").charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            {student.name ? (
                                                                <p className="font-medium">{student.name}</p>
                                                            ) : (
                                                                <Skeleton className="h-4 w-24" />
                                                            )}
                                                            {student.email ? (
                                                                <p className="text-sm text-muted-foreground">{student.email}</p>
                                                            ) : (
                                                                <Skeleton className="h-3 w-32" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {student.currentClass ? (
                                                        <div className="flex flex-col gap-1">
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                {student.currentClass.name}
                                                            </Badge>
                                                            {student.classes.length > 1 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    +{student.classes.length - 1} more classes
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">Not Assigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {student.currentClass?.level ? (
                                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                            {student.currentClass.level.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">Not Assigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {student.rollNumber ? (
                                                        <span className="font-mono text-xs">{student.rollNumber}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {student.hasParents ? (
                                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                                            {student.parentNames}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">No Parents</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <span className="text-xl">⋯</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => router.push(`/dashboard/students/${student.id}`)}>
                                                                <span className="flex items-center">
                                                                    <span className="mr-2">👁️</span>
                                                                    View Details
                                                                </span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedStudent(student)
                                                                setIsAddModalOpen(true)
                                                            }}>
                                                                <span className="flex items-center">
                                                                    <span className="mr-2">✏️</span>
                                                                    Edit Student
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
                                {searchQuery || filterLevel !== "all" || filterClass !== "all" ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="h-10 w-10 text-muted-foreground/50" />
                                        <p>No students match your search criteria</p>
                                        <Button variant="outline" size="sm" onClick={resetFilters}>
                                            Clear Filters
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="h-10 w-10 text-muted-foreground/50" />
                                        <p>No students found</p>
                                        <Button onClick={() => {
                                            setSelectedStudent(null)
                                            setIsAddModalOpen(true)
                                        }}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Your First Student
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <AddStudentModal
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