"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, X } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Subject {
    id: string
    name: string
}

interface ManageSubjectsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    teacherId: string
    availableSubjects: Subject[]
    currentSubjectIds: string[]
}

export function ManageSubjectsModal({
    open,
    onOpenChange,
    teacherId,
    availableSubjects,
    currentSubjectIds,
}: ManageSubjectsModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(currentSubjectIds)
    const [newSubjectId, setNewSubjectId] = useState<string>("")

    // Filter out already selected subjects from available options
    const availableOptions = availableSubjects.filter(
        subject => !selectedSubjects.includes(subject.id)
    )

    const handleAddSubject = () => {
        if (newSubjectId && !selectedSubjects.includes(newSubjectId)) {
            setSelectedSubjects([...selectedSubjects, newSubjectId])
            setNewSubjectId("")
        }
    }

    const handleRemoveSubject = (subjectId: string) => {
        setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId))
    }

    async function onSubmit() {
        try {
            setIsLoading(true)

            const response = await fetch(`/api/teachers/${teacherId}/subjects`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subjectIds: selectedSubjects,
                }),
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error || "Failed to update subjects")
            }

            toast.success("Subjects updated successfully")
            onOpenChange(false)
            // Force a refresh to show the updated subjects
            window.location.reload()
        } catch (error) {
            console.error("Failed to update subjects:", error)
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("An unexpected error occurred")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Subjects</DialogTitle>
                    <DialogDescription>
                        Add or remove subjects this teacher will teach.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Selected Subjects */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Selected Subjects</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedSubjects.map((subjectId) => {
                                const subject = availableSubjects.find(s => s.id === subjectId)
                                return subject ? (
                                    <Badge key={subjectId} variant="secondary" className="flex items-center gap-1">
                                        {subject.name}
                                        <button
                                            onClick={() => handleRemoveSubject(subjectId)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ) : null
                            })}
                        </div>
                    </div>

                    {/* Add New Subject */}
                    <div className="flex gap-2">
                        <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a subject to add" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableOptions.map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleAddSubject}
                            disabled={!newSubjectId}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {availableOptions.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            No more subjects available to add.
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onSubmit} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
} 