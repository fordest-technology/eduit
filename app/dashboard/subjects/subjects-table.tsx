"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Search, BookOpen, X, Users, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { SubjectsDialog } from "./subjects-dialog"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef, Row } from "@tanstack/react-table"
import { TeacherAssignmentModal } from "./teacher-assignment-modal"
import { ClassAssignmentModal } from "./class-assignment-modal"
import { UserRole } from "@/lib/auth"
import { useColors } from "@/contexts/color-context"

interface Department {
    id: string
    name: string
}

interface SchoolLevel {
    id: string
    name: string
    description: string | null
}

interface Teacher {
    id: string
    name: string
    profileImage?: string | null
    userId: string
}

interface SubjectTeacher {
    teacher: Teacher
}

interface Subject {
    id: string
    name: string
    code: string | null
    description: string | null
    departmentId: string | null
    department: {
        id: string
        name: string
    } | null
    levelId: string | null
    level: {
        id: string
        name: string
    } | null
    teachers: {
        teacher: {
            id: string
            name: string
            profileImage: string | null
            userId: string
        }
    }[] | undefined
    _count: {
        classes: number
        teachers?: number
    }
}

interface Class {
    id: string
    name: string
    section?: string | null
}

interface SubjectsTableProps {
    userRole: UserRole
    schoolId: string
    teachers: Teacher[]
    classes: Class[]
    initialSubjects: Subject[]
    departments: Department[]
    levels: SchoolLevel[]
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function SubjectsTable({
    userRole,
    schoolId,
    teachers,
    classes,
    initialSubjects,
    departments: initialDepartments = [],
    levels: initialLevels = [],
    open,
    onOpenChange
}: SubjectsTableProps) {
    const [subjects, setSubjects] = useState<Subject[]>(initialSubjects || [])
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>(initialSubjects || [])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false)
    const [isLevelsLoading, setIsLevelsLoading] = useState(false)
    const [departmentsError, setDepartmentsError] = useState<string | null>(null)
    const [levelsError, setLevelsError] = useState<string | null>(null)
    const [isSubjectsLoading, setIsSubjectsLoading] = useState(false)
    const [subjectsError, setSubjectsError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterLevel, setFilterLevel] = useState<string>("all")
    const [filterDepartment, setFilterDepartment] = useState<string>("all")
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        departmentId: "none",
        levelId: "none"
    })
    const [departments, setDepartments] = useState<Department[]>(initialDepartments)
    const [levels, setLevels] = useState<SchoolLevel[]>(initialLevels)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
    const [isClassModalOpen, setIsClassModalOpen] = useState(false)

    const colors = useColors()

    useEffect(() => {
        if (initialSubjects.length === 0) {
            fetchSubjects()
        }
    }, [initialSubjects])

    useEffect(() => {
        let result = [...subjects]

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                subject =>
                    subject.name.toLowerCase().includes(query) ||
                    (subject.code?.toLowerCase() || "").includes(query) ||
                    (subject.description?.toLowerCase() || "").includes(query)
            )
        }

        if (filterLevel !== "all") {
            if (filterLevel === "none") {
                result = result.filter(subject => !subject.levelId)
            } else {
                result = result.filter(subject => subject.levelId === filterLevel)
            }
        }

        if (filterDepartment !== "all") {
            if (filterDepartment === "none") {
                result = result.filter(subject => !subject.departmentId)
            } else {
                result = result.filter(subject => subject.departmentId === filterDepartment)
            }
        }

        setFilteredSubjects(result)
    }, [subjects, searchQuery, filterLevel, filterDepartment])

    const fetchSubjects = async () => {
        setIsSubjectsLoading(true)
        setSubjectsError(null)
        try {
            const response = await fetch(`/api/subjects?schoolId=${schoolId}`)
            if (!response.ok) {
                throw new Error("Failed to fetch subjects")
            }
            const data = await response.json()
            setSubjects(data)
            setFilteredSubjects(data)
        } catch (error: any) {
            console.error("Error fetching subjects:", error)
            setSubjectsError(error.message || "Failed to load subjects")
        } finally {
            setIsSubjectsLoading(false)
        }
    }

    useEffect(() => {
        const fetchDepartments = async () => {
            setIsDepartmentsLoading(true)
            setDepartmentsError(null)
            try {
                const response = await fetch("/api/departments")
                if (!response.ok) {
                    throw new Error("Failed to fetch departments")
                }
                const data = await response.json()
                setDepartments(data)
            } catch (error: any) {
                console.error("Error fetching departments:", error)
                setDepartmentsError(error.message || "Failed to load departments")
            } finally {
                setIsDepartmentsLoading(false)
            }
        }

        const fetchLevels = async () => {
            setIsLevelsLoading(true)
            setLevelsError(null)
            try {
                const response = await fetch("/api/school-levels")
                if (!response.ok) {
                    throw new Error("Failed to fetch school levels")
                }
                const data = await response.json()
                setLevels(data)
            } catch (error: any) {
                console.error("Error fetching school levels:", error)
                setLevelsError(error.message || "Failed to load school levels")
            } finally {
                setIsLevelsLoading(false)
            }
        }

        fetchDepartments()
        fetchLevels()
    }, [])

    const openAddDialog = () => {
        setEditingSubject(null)
        setFormData({ name: "", code: "", description: "", departmentId: "none", levelId: "none" })
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const payload = {
                name: formData.name,
                code: formData.code || null,
                description: formData.description || null,
                departmentId: formData.departmentId === "none" ? null : formData.departmentId,
                levelId: formData.levelId === "none" ? null : formData.levelId,
                schoolId
            }

            const response = await fetch(editingSubject ? `/api/subjects/${editingSubject.id}` : "/api/subjects", {
                method: editingSubject ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to save subject")
            }

            const savedSubject = await response.json()

            if (editingSubject) {
                setSubjects(subjects.map(s => s.id === editingSubject.id ? savedSubject : s))
                toast.success("Subject updated successfully")
            } else {
                setSubjects([...subjects, savedSubject])
                toast.success("Subject created successfully")
            }

            setIsDialogOpen(false)
            setFormData({ name: "", code: "", description: "", departmentId: "none", levelId: "none" })
            setEditingSubject(null)
        } catch (error: any) {
            console.error("Error saving subject:", error)
            toast.error(error.message || "Failed to save subject")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this subject?")) {
            return
        }

        setIsDeleting(id)

        try {
            const response = await fetch(`/api/subjects/${id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to delete subject")
            }

            setSubjects(subjects.filter(s => s.id !== id))
            toast.success("Subject deleted")
        } catch (error: any) {
            console.error("Error deleting subject:", error)
            toast.error(error.message || "Failed to delete subject")
        } finally {
            setIsDeleting(null)
        }
    }

    const handleEdit = (subject: Subject) => {
        setEditingSubject(subject)
        setFormData({
            name: subject.name,
            code: subject.code || "",
            description: subject.description || "",
            departmentId: subject.departmentId || "none",
            levelId: subject.levelId || "none"
        })
        setIsDialogOpen(true)
    }

    const resetFilters = () => {
        setSearchQuery("")
        setFilterLevel("all")
        setFilterDepartment("all")
    }

    const canManageSubjects = userRole === "SUPER_ADMIN" || userRole === "SCHOOL_ADMIN"

    const handleAssignTeachers = async (subjectId: string, teacherIds: string[]) => {
        try {
            const response = await fetch(`/api/subjects/${subjectId}/teachers`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ teacherIds }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to assign teachers")
            }

            setSubjects(prevSubjects =>
                prevSubjects.map(subject => {
                    if (subject.id === subjectId) {
                        const newTeachers = teacherIds.map(id => {
                            const teacherData = teachers.find(t => t.id === id)
                            return {
                                teacher: {
                                    id,
                                    name: teacherData?.name || '',
                                    profileImage: teacherData?.profileImage || null,
                                    userId: teacherData?.userId || ''
                                }
                            }
                        })

                        return {
                            ...subject,
                            teachers: newTeachers
                        }
                    }
                    return subject
                })
            )

            toast.success("Teachers assigned successfully")
        } catch (error: any) {
            console.error("Error assigning teachers:", error)
            toast.error(error.message || "Failed to assign teachers")
            throw error
        }
    }

    const openTeacherModal = (subject: Subject) => {
        setSelectedSubject(subject)
        setIsTeacherModalOpen(true)
    }

    const openClassModal = (subject: Subject) => {
        setSelectedSubject(subject)
        setIsClassModalOpen(true)
    }

    const handleAssignClasses = async (subjectId: string, classIds: string[]) => {
        try {
            console.log(`Sending class assignment request to /api/subjects/${subjectId}/classes with:`, classIds);

            const response = await fetch(`/api/subjects/${subjectId}/classes`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ classIds }),
            });

            if (!response.ok) {
                // Try to extract error message from response
                let errorMessage = "Failed to assign classes";
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    // If we can't parse the JSON, use the status text
                    errorMessage = `${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("Class assignment response:", data);

            // Immediately update the local state with the new class count
            setSubjects(prevSubjects =>
                prevSubjects.map(subject => {
                    if (subject.id === subjectId) {
                        return {
                            ...subject,
                            _count: {
                                ...subject._count,
                                classes: classIds.length
                            }
                        };
                    }
                    return subject;
                })
            );

            toast.success("Classes assigned successfully");

            // Fetch fresh data to ensure everything is in sync
            fetchSubjects();

        } catch (error: any) {
            console.error("Error assigning classes:", error);
            toast.error(error.message || "Failed to assign classes");
            throw error;
        }
    }

    const columns: ColumnDef<Subject, any>[] = [
        {
            id: "name",
            accessorKey: "name",
            header: "Name",
        },
        {
            id: "code",
            accessorKey: "code",
            header: "Code",
            cell: ({ row }) => {
                const subject = row.original as Subject
                return subject.code || "-"
            }
        },
        {
            id: "department",
            accessorKey: "department.name",
            header: "Department",
            cell: ({ row }) => {
                const subject = row.original as Subject
                return subject.department ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {subject.department.name}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground text-xs">General</span>
                )
            }
        },
        {
            id: "level",
            accessorKey: "level.name",
            header: "Level",
            cell: ({ row }) => {
                const subject = row.original as Subject
                return subject.level ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {subject.level.name}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground text-xs">General</span>
                )
            }
        },
        {
            id: "teachers",
            accessorKey: "teachers",
            header: "Teachers",
            cell: ({ row }) => {
                const subject = row.original as Subject
                return (
                    <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
                        {Array.isArray(subject.teachers) ? subject.teachers.length : subject._count?.teachers || 0}
                    </span>
                )
            }
        },
        {
            id: "classes",
            accessorKey: "_count.classes",
            header: "Classes",
            cell: ({ row }) => {
                const subject = row.original as Subject
                return (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                        {subject._count.classes}
                    </span>
                )
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const subject = row.original as Subject
                return canManageSubjects ? (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openTeacherModal(subject)}
                            title="Assign Teachers"
                            disabled={isDeleting === subject.id}
                        >
                            <Users className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openClassModal(subject)}
                            title="Assign Classes"
                            disabled={isDeleting === subject.id}
                        >
                            <GraduationCap className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(subject)}
                            disabled={isDeleting === subject.id}
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(subject.id)}
                            disabled={isDeleting === subject.id}
                            className="text-destructive"
                        >
                            {isDeleting === subject.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                ) : null
            },
        },
    ]

    const table = {
        columns,
        data: subjects,
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1 space-y-4 w-full">
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search subjects..."
                                    className="pl-9 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-7 w-7 hover:bg-transparent"
                                        onClick={() => setSearchQuery("")}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
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

                                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        <SelectItem value="none">No Department</SelectItem>
                                        {departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {canManageSubjects && (
                                    <Button
                                        onClick={openAddDialog}
                                        className="gap-1"
                                        style={{
                                            backgroundColor: colors.primaryColor,
                                            color: 'white',
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Add Subject</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {subjectsError && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{subjectsError}</AlertDescription>
                    </Alert>
                )}

                {isSubjectsLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                    <Card className="border border-border/60 shadow-sm">
                        <CardContent className="p-0">
                            <div className="w-full overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Teachers</TableHead>
                                            <TableHead>Classes</TableHead>
                                            {canManageSubjects && <TableHead className="text-right">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSubjects.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-muted-foreground">
                                                    No subjects found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredSubjects.map((subject) => (
                                                <TableRow key={subject.id} className="hover:bg-primary/5">
                                                    <TableCell className="font-medium">{subject.name}</TableCell>
                                                    <TableCell>
                                                        {subject.code ? (
                                                            <span className="font-mono text-xs">{subject.code}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {subject.department ? (
                                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                                {subject.department.name}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">General</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {subject.level ? (
                                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                                {subject.level.name}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">General</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                                                            {Array.isArray(subject.teachers) ? subject.teachers.length : subject._count?.teachers || 0}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-600">
                                                            {subject._count.classes}
                                                        </span>
                                                    </TableCell>
                                                    {canManageSubjects && (
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => openTeacherModal(subject)}
                                                                    title="Assign Teachers"
                                                                    disabled={isDeleting === subject.id}
                                                                    className="hover:text-primary"
                                                                >
                                                                    <Users className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => openClassModal(subject)}
                                                                    title="Assign Classes"
                                                                    disabled={isDeleting === subject.id}
                                                                    className="hover:text-primary"
                                                                >
                                                                    <GraduationCap className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleEdit(subject)}
                                                                    disabled={isDeleting === subject.id}
                                                                    className="hover:text-primary"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDelete(subject.id)}
                                                                    disabled={isDeleting === subject.id}
                                                                    className="hover:text-destructive"
                                                                >
                                                                    {isDeleting === subject.id ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="w-4 h-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {canManageSubjects && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
                            <DialogDescription>
                                {editingSubject
                                    ? "Update the subject details below."
                                    : "Fill in the details to create a new subject."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Subject Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter subject name"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="code">Subject Code</Label>
                                        <Input
                                            id="code"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="E.g., MATH101"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="department">Department</Label>
                                        <Select
                                            value={formData.departmentId}
                                            onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                                        >
                                            <SelectTrigger id="department">
                                                <SelectValue placeholder="Select a department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Department</SelectItem>
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
                                            value={formData.levelId}
                                            onValueChange={(value) => setFormData({ ...formData, levelId: value })}
                                        >
                                            <SelectTrigger id="level">
                                                <SelectValue placeholder="Select a level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Level</SelectItem>
                                                {levels.map((level) => (
                                                    <SelectItem key={level.id} value={level.id}>
                                                        {level.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter subject description"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {editingSubject ? "Updating..." : "Creating..."}
                                        </>
                                    ) : (
                                        editingSubject ? "Update" : "Create"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            <TeacherAssignmentModal
                open={isTeacherModalOpen}
                onOpenChange={setIsTeacherModalOpen}
                subject={selectedSubject}
                teachers={teachers}
                onAssignTeachers={handleAssignTeachers}
            />

            <ClassAssignmentModal
                open={isClassModalOpen}
                onOpenChange={setIsClassModalOpen}
                subject={selectedSubject}
                classes={classes}
                onAssignClasses={handleAssignClasses}
            />

            <SubjectsDialog
                open={open || false}
                onOpenChange={onOpenChange || (() => { })}
                departments={departments}
                levels={levels}
            />
        </>
    )
} 