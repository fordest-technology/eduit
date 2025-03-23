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
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Search, BookOpen, X, Users } from "lucide-react"
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
    department: Department | null
    levelId: string | null
    level: SchoolLevel | null
    teachers: SubjectTeacher[]
    _count?: {
        classes: number
    }
}

interface SubjectsTableProps {
    initialSubjects?: Subject[]
    teachers: {
        id: string
        name: string
        profileImage: string | null
    }[]
    userRole: string
    schoolId: string
}

// Add TeacherAssignmentModal component
interface TeacherAssignmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    subject: Subject | null
    teachers: {
        id: string
        name: string
        profileImage: string | null
    }[]
    onAssignTeachers: (subjectId: string, teacherIds: string[]) => Promise<void>
}

function TeacherAssignmentModal({ open, onOpenChange, subject, teachers, onAssignTeachers }: TeacherAssignmentModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
    const [currentTeacherIds, setCurrentTeacherIds] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (subject && open) {
            // Extract current teacher IDs from subject
            const teacherIds = subject.teachers.map(t => t.teacher.id)
            setSelectedTeachers(teacherIds)
            setCurrentTeacherIds(teacherIds)
        } else {
            setSelectedTeachers([])
            setCurrentTeacherIds([])
        }
    }, [subject, open])

    const filteredTeachers = teachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleToggleTeacher = (teacherId: string) => {
        setSelectedTeachers(prev =>
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        )
    }

    const handleSubmit = async () => {
        if (!subject) return

        setIsLoading(true)
        try {
            await onAssignTeachers(subject.id, selectedTeachers)
            onOpenChange(false)
            toast.success("Teachers assigned successfully")
        } catch (error) {
            console.error("Error assigning teachers:", error)
            toast.error("Failed to assign teachers")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Teachers</DialogTitle>
                    <DialogDescription>
                        {subject ? `Assign teachers to ${subject.name}` : 'Select teachers to assign'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            type="search"
                            placeholder="Search teachers..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="border rounded-md max-h-[300px] overflow-y-auto">
                        {filteredTeachers.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                No teachers found
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredTeachers.map(teacher => (
                                    <div
                                        key={teacher.id}
                                        className="flex items-center p-3 hover:bg-secondary/10 cursor-pointer"
                                        onClick={() => handleToggleTeacher(teacher.id)}
                                    >
                                        <div className="flex-1 flex items-center space-x-3">
                                            <Avatar className="h-8 w-8">
                                                {teacher.profileImage ? (
                                                    <AvatarImage src={teacher.profileImage} alt={teacher.name} />
                                                ) : (
                                                    <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                                                )}
                                            </Avatar>
                                            <span>{teacher.name}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={selectedTeachers.includes(teacher.id)}
                                            onChange={() => { }} // Handled by div click
                                            className="h-4 w-4"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                        {selectedTeachers.length} teachers selected
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading || JSON.stringify(currentTeacherIds.sort()) === JSON.stringify(selectedTeachers.sort())}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            "Assign Teachers"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function SubjectsTable({ initialSubjects = [], teachers, userRole, schoolId }: SubjectsTableProps) {
    const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>(initialSubjects)
    const [departments, setDepartments] = useState<Department[]>([])
    const [levels, setLevels] = useState<SchoolLevel[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true)
    const [isLevelsLoading, setIsLevelsLoading] = useState(true)
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
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    // Add state for teacher assignment modal
    const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)

    // Fetch subjects if not provided
    useEffect(() => {
        if (initialSubjects.length === 0) {
            fetchSubjects()
        }
    }, [initialSubjects])

    // Apply filters when subjects, search query, or filters change
    useEffect(() => {
        let result = [...subjects]

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                subject =>
                    subject.name.toLowerCase().includes(query) ||
                    (subject.code?.toLowerCase() || "").includes(query) ||
                    (subject.description?.toLowerCase() || "").includes(query)
            )
        }

        // Apply level filter
        if (filterLevel !== "all") {
            if (filterLevel === "none") {
                result = result.filter(subject => !subject.levelId)
            } else {
                result = result.filter(subject => subject.levelId === filterLevel)
            }
        }

        // Apply department filter
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
        // Fetch departments
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

        // Fetch school levels
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const url = editingSubject
                ? `/api/subjects/${editingSubject.id}`
                : "/api/subjects"
            const method = editingSubject ? "PUT" : "POST"

            // Convert "none" values to empty string
            const submissionData = {
                ...formData,
                departmentId: formData.departmentId === "none" ? "" : formData.departmentId,
                levelId: formData.levelId === "none" ? "" : formData.levelId,
                schoolId
            }

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submissionData),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to save subject")
            }

            const data = await response.json()

            if (editingSubject) {
                setSubjects(subjects.map(s => s.id === editingSubject.id ? data : s))
            } else {
                setSubjects([...subjects, data])
            }

            setIsDialogOpen(false)
            setFormData({ name: "", code: "", description: "", departmentId: "none", levelId: "none" })
            setEditingSubject(null)
            toast.success(editingSubject ? "Subject updated" : "Subject created")
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

    // Check if user can manage subjects
    const canManageSubjects = userRole === "super_admin" || userRole === "school_admin"

    // Add teacher assignment function
    const handleAssignTeachers = async (subjectId: string, teacherIds: string[]) => {
        try {
            // Call API to update teacher assignments
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

            // Update local state
            setSubjects(subjects.map(subject => {
                if (subject.id === subjectId) {
                    // Create new teacher objects with the assigned teachers
                    const newTeachers = teacherIds.map(id => {
                        const teacherData = teachers.find(t => t.id === id)
                        return {
                            teacher: {
                                id,
                                name: teacherData?.name || '',
                                profileImage: teacherData?.profileImage || null
                            }
                        }
                    })

                    return {
                        ...subject,
                        teachers: newTeachers
                    }
                }
                return subject
            }))

            toast.success("Teachers assigned successfully")
        } catch (error: any) {
            console.error("Error assigning teachers:", error)
            toast.error(error.message || "Failed to assign teachers")
            throw error
        }
    }

    // Add function to open teacher assignment modal
    const openTeacherModal = (subject: Subject) => {
        setSelectedSubject(subject)
        setIsTeacherModalOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
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

                    {(searchQuery || filterLevel !== "all" || filterDepartment !== "all") && (
                        <Button variant="outline" onClick={resetFilters} size="sm" className="mt-1 sm:mt-0">
                            Clear Filters
                        </Button>
                    )}
                </div>

                {canManageSubjects && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="whitespace-nowrap" onClick={() => {
                                setEditingSubject(null)
                                setFormData({ name: "", code: "", description: "", departmentId: "none", levelId: "none" })
                            }}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Subject
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
                                <DialogDescription>
                                    {editingSubject
                                        ? "Update the subject details below."
                                        : "Fill in the details to create a new subject."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4 py-2">
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
                                                <SelectItem value="none">None</SelectItem>
                                                {isDepartmentsLoading ? (
                                                    <SelectItem value="loading" disabled>
                                                        Loading...
                                                    </SelectItem>
                                                ) : departmentsError ? (
                                                    <SelectItem value="error" disabled>
                                                        Error loading departments
                                                    </SelectItem>
                                                ) : (
                                                    departments.map((department) => (
                                                        <SelectItem key={department.id} value={department.id}>
                                                            {department.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="level">School Level</Label>
                                        <Select
                                            value={formData.levelId}
                                            onValueChange={(value) => setFormData({ ...formData, levelId: value })}
                                        >
                                            <SelectTrigger id="level">
                                                <SelectValue placeholder="Select a school level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {isLevelsLoading ? (
                                                    <SelectItem value="loading" disabled>
                                                        Loading...
                                                    </SelectItem>
                                                ) : levelsError ? (
                                                    <SelectItem value="error" disabled>
                                                        Error loading school levels
                                                    </SelectItem>
                                                ) : (
                                                    levels.map((level) => (
                                                        <SelectItem key={level.id} value={level.id}>
                                                            {level.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Teachers</TableHead>
                                    <TableHead>Classes</TableHead>
                                    {canManageSubjects && <TableHead className="w-[100px]">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubjects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={canManageSubjects ? 7 : 6} className="text-center py-8 text-muted-foreground">
                                            {searchQuery || filterLevel !== "all" || filterDepartment !== "all" ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                                                    <p>No subjects match your search criteria</p>
                                                    <Button variant="outline" size="sm" onClick={resetFilters}>
                                                        Clear Filters
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                                                    <p>No subjects found. {canManageSubjects && "Create your first subject to get started."}</p>
                                                    {canManageSubjects && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingSubject(null)
                                                                setFormData({ name: "", code: "", description: "", departmentId: "none", levelId: "none" })
                                                                setIsDialogOpen(true)
                                                            }}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add Subject
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSubjects.map((subject) => (
                                        <TableRow key={subject.id} className="hover:bg-primary/5">
                                            <TableCell className="font-medium">{subject.name}</TableCell>
                                            <TableCell>{subject.code || "-"}</TableCell>
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
                                                <span
                                                    className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary cursor-pointer hover:bg-secondary/20"
                                                    onClick={() => canManageSubjects && openTeacherModal(subject)}
                                                    title={canManageSubjects ? "Click to manage teachers" : ""}
                                                >
                                                    {Array.isArray(subject.teachers) ? subject.teachers.length : 0}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                                                    {subject._count?.classes || 0}
                                                </span>
                                            </TableCell>
                                            {canManageSubjects && (
                                                <TableCell>
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
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Add the teacher assignment modal */}
            <TeacherAssignmentModal
                open={isTeacherModalOpen}
                onOpenChange={setIsTeacherModalOpen}
                subject={selectedSubject}
                teachers={teachers}
                onAssignTeachers={handleAssignTeachers}
            />
        </div>
    )
} 