"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Subject {
    id: string
    name: string
    department?: {
        name: string
    } | null
}

export interface TeacherSubjectsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    teacher: { id: string, name: string } | null
    onSuccess: () => void
}

export function TeacherSubjectsModal({
    open,
    onOpenChange,
    teacher,
    onSuccess
}: TeacherSubjectsModalProps) {
    const [loading, setLoading] = useState(false)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
    const [currentSubjectIds, setCurrentSubjectIds] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([])

    // Fetch all available subjects when the modal opens
    useEffect(() => {
        if (open && teacher) {
            fetchSubjects()
            fetchTeacherSubjects()
        }
    }, [open, teacher])

    // Filter subjects based on search query
    useEffect(() => {
        if (searchQuery.trim()) {
            setFilteredSubjects(
                subjects.filter(subject =>
                    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
        } else {
            setFilteredSubjects(subjects)
        }
    }, [searchQuery, subjects])

    const fetchSubjects = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/subjects')

            if (!response.ok) {
                throw new Error('Failed to fetch subjects')
            }

            const data = await response.json()
            setSubjects(data)
            setFilteredSubjects(data)
        } catch (error) {
            console.error('Error fetching subjects:', error)
            toast.error('Failed to load subjects')
        } finally {
            setLoading(false)
        }
    }

    const fetchTeacherSubjects = async () => {
        if (!teacher) return

        try {
            setLoading(true)
            const response = await fetch(`/api/teachers/${teacher.id}/subjects`)

            if (!response.ok) {
                throw new Error('Failed to fetch teacher subjects')
            }

            const data = await response.json()
            const subjectIds = data.map((item: any) => item.subjectId)

            console.log('Current teacher subjects:', subjectIds)
            setCurrentSubjectIds(subjectIds)
            setSelectedSubjectIds(subjectIds)
        } catch (error) {
            console.error('Error fetching teacher subjects:', error)
            toast.error('Failed to load teacher subjects')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!teacher) return

        try {
            setLoading(true)

            const response = await fetch(`/api/teachers/${teacher.id}/subjects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subjectIds: selectedSubjectIds
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to update teacher subjects')
            }

            toast.success('Teacher subjects updated successfully')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating teacher subjects:', error)
            toast.error('Failed to update teacher subjects')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectAll = () => {
        if (selectedSubjectIds.length === filteredSubjects.length) {
            setSelectedSubjectIds([])
        } else {
            setSelectedSubjectIds(filteredSubjects.map(subject => subject.id))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Subjects for {teacher?.name}</DialogTitle>
                    <DialogDescription>
                        Assign or remove subjects for this teacher.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search subjects..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {selectedSubjectIds.length} of {filteredSubjects.length} selected
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                        >
                            {selectedSubjectIds.length === filteredSubjects.length
                                ? "Unselect All"
                                : "Select All"}
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredSubjects.length > 0 ? (
                                filteredSubjects.map(subject => (
                                    <div
                                        key={subject.id}
                                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted"
                                    >
                                        <Checkbox
                                            id={`subject-${subject.id}`}
                                            checked={selectedSubjectIds.includes(subject.id)}
                                            onCheckedChange={() => {
                                                setSelectedSubjectIds(prev =>
                                                    prev.includes(subject.id)
                                                        ? prev.filter(id => id !== subject.id)
                                                        : [...prev, subject.id]
                                                )
                                            }}
                                        />
                                        <div className="flex flex-col">
                                            <label
                                                htmlFor={`subject-${subject.id}`}
                                                className="text-sm font-medium cursor-pointer"
                                            >
                                                {subject.name}
                                            </label>
                                            {subject.department && (
                                                <p className="text-xs text-muted-foreground">
                                                    {subject.department.name}
                                                </p>
                                            )}
                                        </div>
                                        {currentSubjectIds.includes(subject.id) && (
                                            <Badge variant="secondary" className="ml-auto">
                                                Assigned
                                            </Badge>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-4">
                                    {searchQuery ? "No subjects matched your search" : "No subjects available"}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 