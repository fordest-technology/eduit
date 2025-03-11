"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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
    teachers: SubjectTeacher[]
}

interface SubjectsTableProps {
    userRole: string
    schoolId?: string
    teachers: Teacher[]
    initialSubjects: Subject[]
}

export function SubjectsTable({ userRole, schoolId, teachers, initialSubjects }: SubjectsTableProps) {
    const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
    const [newSubject, setNewSubject] = useState({
        name: "",
        code: "",
    })
    const [selectedSubject, setSelectedSubject] = useState<string>("")
    const [selectedTeacher, setSelectedTeacher] = useState<string>("")

    const handleCreateSubject = async () => {
        try {
            const response = await fetch("/api/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newSubject.name,
                    code: newSubject.code || null,
                    schoolId,
                }),
            })

            if (!response.ok) throw new Error("Failed to create subject")

            const data = await response.json()
            setSubjects([...subjects, { ...data, teachers: [] }])
            setNewSubject({ name: "", code: "" })
            toast.success("Subject created successfully")
        } catch (error) {
            toast.error("Error creating subject")
        }
    }

    const handleAssignTeacher = async () => {
        try {
            const response = await fetch("/api/subject-teachers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subjectId: selectedSubject,
                    teacherId: selectedTeacher,
                }),
            })

            if (!response.ok) throw new Error("Failed to assign teacher")

            // Update local state
            const updatedSubjects = subjects.map(subject => {
                if (subject.id === selectedSubject) {
                    const teacher = teachers.find(t => t.id === selectedTeacher)
                    if (teacher) {
                        return {
                            ...subject,
                            teachers: [...subject.teachers, { teacher }],
                        }
                    }
                }
                return subject
            })

            setSubjects(updatedSubjects)
            setSelectedSubject("")
            setSelectedTeacher("")
            toast.success("Teacher assigned successfully")
        } catch (error) {
            toast.error("Error assigning teacher")
        }
    }

    return (
        <div>
            <div className="mb-6 space-x-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>Create New Subject</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Subject</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="Subject Name"
                                value={newSubject.name}
                                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                            />
                            <Input
                                placeholder="Subject Code (Optional)"
                                value={newSubject.code}
                                onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                            />
                            <Button onClick={handleCreateSubject}>Create Subject</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button>Assign Teacher</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign Teacher to Subject</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
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
                            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
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
                            <Button onClick={handleAssignTeacher}>Assign Teacher</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Assigned Teachers</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subjects.map((subject) => (
                        <TableRow key={subject.id}>
                            <TableCell>{subject.name}</TableCell>
                            <TableCell>{subject.code || "-"}</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-2">
                                    {subject.teachers.length > 0 ? (
                                        subject.teachers.map((st) => (
                                            <div key={st.teacher.id} className="flex items-center gap-1.5">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={st.teacher.profileImage || undefined} />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                        {st.teacher.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Badge variant="secondary">{st.teacher.name}</Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground">No teachers assigned</span>
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