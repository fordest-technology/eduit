"use client"

import { useState, useEffect } from "react"
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

interface Class {
    id: string
    name: string
    section: string
    teacher: {
        id: string
        name: string
        profileImage?: string | null
    } | null
    _count: {
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
        teacherId: "",
    })
    const [selectedClass, setSelectedClass] = useState<string>("")
    const [selectedSubject, setSelectedSubject] = useState<string>("")

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

    useEffect(() => {
        fetchClasses()
        setLoading(false)
    }, [])

    const handleCreateClass = async () => {
        try {
            const response = await fetch("/api/classes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newClass),
            })

            if (!response.ok) throw new Error("Failed to create class")

            toast.success("Class created successfully")
            fetchClasses()
            setNewClass({ name: "", section: "", teacherId: "" })
        } catch (error) {
            toast.error("Error creating class")
        }
    }

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

    if (loading) {
        return <div>Loading...</div>
    }

    const isAdmin = userRole === "super_admin" || userRole === "school_admin"

    return (
        <div>
            {isAdmin && (
                <div className="mb-6 space-x-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>Create New Class</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Class</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Class Name"
                                    value={newClass.name}
                                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                />
                                <Input
                                    placeholder="Section"
                                    value={newClass.section}
                                    onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                                />
                                <Select
                                    value={newClass.teacherId}
                                    onValueChange={(value) => setNewClass({ ...newClass, teacherId: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teachers.map((teacher) => (
                                            <SelectItem key={teacher.id} value={teacher.id}>
                                                {teacher.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleCreateClass}>Create Class</Button>
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
                        <TableHead>Students</TableHead>
                        <TableHead>Subjects</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {classes.map((cls) => (
                        <TableRow key={cls.id}>
                            <TableCell>{cls.name}</TableCell>
                            <TableCell>{cls.section}</TableCell>
                            <TableCell>
                                {cls.teacher ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={cls.teacher.profileImage || undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {cls.teacher.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{cls.teacher.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">Not Assigned</span>
                                )}
                            </TableCell>
                            <TableCell>{cls._count.students}</TableCell>
                            <TableCell>{cls._count.subjects}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
} 