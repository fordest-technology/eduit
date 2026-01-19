"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"

interface Teacher {
    id: string
    name: string
    profileImage?: string | null
    userId: string
}

interface Subject {
    id: string
    name: string
    code: string | null
    teachers?: {
        teacher: {
            id: string
            name: string
            profileImage: string | null
            userId: string
        }
    }[]
}

interface TeacherAssignmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    subject: Subject | null
    teachers: Teacher[]
    onAssignTeachers: (subjectId: string, teacherIds: string[]) => Promise<void>
}

export function TeacherAssignmentModal({
    open,
    onOpenChange,
    subject,
    teachers,
    onAssignTeachers
}: TeacherAssignmentModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
    const [currentTeacherIds, setCurrentTeacherIds] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (subject && open) {
            // Extract current teacher IDs from subject
            const teacherIds = subject.teachers?.map(t => t.teacher.id) || []
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
        } catch (error) {
            console.error("Error assigning teachers:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md w-full overflow-y-auto" side="right">
                <SheetHeader className="mb-6">
                    <SheetTitle>Assign Teachers</SheetTitle>
                    <SheetDescription>
                        {subject ? `Assign teachers to ${subject.name}` : 'Select teachers to assign'}
                    </SheetDescription>
                </SheetHeader>

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

                <SheetFooter className="mt-8">
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
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
} 