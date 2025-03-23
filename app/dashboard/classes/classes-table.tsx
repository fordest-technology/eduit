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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import { MoreHorizontal, Pencil, BookOpen, Trash2, Eye, Loader2 } from "lucide-react"

interface Class {
    id: string
    name: string
    section: string | null
    teacher: {
        id: string
        user: {
            name: string
            profileImage?: string | null
        }
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
        }
    }>
    students: Array<{
        id: string
        student: {
            id: string
            user: {
                name: string
            }
        }
    }>
    _count?: {
        students: number
        subjects: number
    }
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
    schoolId?: string
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
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [levels, setLevels] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)

    const fetchClasses = async () => {
        try {
            const response = await fetch("/api/classes")
            if (!response.ok) throw new Error("Failed to fetch classes")
            const data = await response.json()
            setClasses(data)
        } catch (error) {
            toast.error("Error fetching classes")
        }
    }

    const fetchLevels = async () => {
        try {
            const response = await fetch("/api/school-levels")
            if (!response.ok) throw new Error("Failed to fetch school levels")
            const data = await response.json()
            setLevels(data)
        } catch (error) {
            toast.error("Error fetching school levels")
        }
    }

    useEffect(() => {
        fetchClasses()
        fetchLevels()
        setLoading(false)
    }, [])

    const handleCreateClass = async () => {
        try {
            if (!newClass.name.trim()) {
                toast.error("Class name is required");
                return;
            }

            setIsCreating(true);
            setError(null);

            // Transform data before sending
            const formData = {
                name: newClass.name.trim(),
                section: newClass.section.trim() || null,
                teacherId: newClass.teacherId === "null" ? null : newClass.teacherId,
                levelId: newClass.levelId === "null" ? null : newClass.levelId
            };

            console.log("Sending data to API:", formData); // Debug log

            const response = await fetch("/api/classes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            console.log("API Response:", data); // Debug log

            if (!response.ok) {
                if (data.errors) {
                    const errorMessage = data.errors.map((err: { field: string; message: string }) => err.message).join(", ");
                    throw new Error(errorMessage);
                }
                throw new Error(data.error || "Failed to create class");
            }

            await fetchClasses(); // Refresh the classes list
            toast.success("Class created successfully");
            setShowCreateDialog(false);
            // Reset form with null-like values for selects
            setNewClass({
                name: "",
                section: "",
                teacherId: "null",
                levelId: "null"
            });
        } catch (error) {
            console.error("Error creating class:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create class");
        } finally {
            setIsCreating(false);
        }
    };

    const handleAssignSubject = async () => {
        try {
            const response = await fetch("/api/class-subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    classId: selectedClass,
                    subjectId: selectedSubject,
                }),
            })

            if (!response.ok) throw new Error("Failed to assign subject")

            toast.success("Subject assigned successfully")
            fetchClasses()
            setSelectedClass("")
            setSelectedSubject("")
        } catch (error) {
            toast.error("Error assigning subject")
        }
    }

    const handleDeleteClass = async (id: string) => {
        try {
            const response = await fetch(`/api/classes/${id}`, {
                method: "DELETE",
            })

            if (!response.ok) throw new Error("Failed to delete class")

            toast.success("Class deleted successfully")
            fetchClasses()
        } catch (error) {
            toast.error("Error deleting class")
        }
    }

    if (loading) {
        return <div>Loading...</div>
    }

    const isAdmin = userRole === "super_admin" || userRole === "school_admin"

    return (
        <div>
            {isAdmin && (
                <div className="mb-6 space-x-2">
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button>Create New Class</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Class</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Class Name</label>
                                    <Input
                                        placeholder="Enter class name"
                                        value={newClass.name}
                                        onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Section (Optional)</label>
                                    <Input
                                        placeholder="Enter section"
                                        value={newClass.section}
                                        onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 visiblity-0 opacity-0 h-0">
                                    <label className="text-sm font-medium">Teacher (Optional)</label>
                                    <Select
                                        value={newClass.teacherId}
                                        onValueChange={(value) => {
                                            console.log("Selected teacher value:", value); // Debug log
                                            setNewClass({ ...newClass, teacherId: "" });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="null">None</SelectItem>
                                            {teachers.map((teacher) => (
                                                <SelectItem key={teacher.id} value={teacher.id}>
                                                    {teacher.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">School Level (Optional)</label>
                                    <Select
                                        value={newClass.levelId}
                                        onValueChange={(value) => setNewClass({ ...newClass, levelId: value === "null" ? "" : value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select School Level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="null">None</SelectItem>
                                            {levels.map((level) => (
                                                <SelectItem key={level.id} value={level.id}>
                                                    {level.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={handleCreateClass}
                                    disabled={isCreating || !newClass.name.trim()}
                                    className="w-full"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Class"
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>Assign Subject</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Assign Subject to Class</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.name} {cls.section}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map((subject) => (
                                            <SelectItem key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAssignSubject}>Assign Subject</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {classes.map((cls) => (
                        <TableRow key={cls.id}>
                            <TableCell>{cls.name}</TableCell>
                            <TableCell>{cls.section || "N/A"}</TableCell>
                            <TableCell>
                                {cls.teacher ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={cls.teacher.user.profileImage || undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {cls.teacher.user.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{cls.teacher.user.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">Not Assigned</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {cls.level ? (
                                    <span className="font-medium">{cls.level.name}</span>
                                ) : (
                                    <span className="text-muted-foreground">Not Assigned</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <span className="font-medium">{cls.students?.length || 0}</span>
                                    <span className="text-muted-foreground">students</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <span className="font-medium">{cls.subjects?.length || 0}</span>
                                    <span className="text-muted-foreground">subjects</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-end space-x-2">
                                    {userRole === "super_admin" || userRole === "school_admin" ? (
                                        <>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-1"
                                            >
                                                <Link href={`/dashboard/classes/${cls.id}`}>
                                                    View Details
                                                </Link>
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Open menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => setClassToEdit(cls)}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setCurrentClass(cls);
                                                        setShowAssignSubjectDialog(true);
                                                    }}>
                                                        <BookOpen className="mr-2 h-4 w-4" /> Assign Subject
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteClass(cls.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </>
                                    ) : (
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                        >
                                            <Link href={`/dashboard/classes/${cls.id}`}>
                                                View Class
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
} 