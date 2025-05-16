"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"

interface Class {
    id: string
    name: string
    section?: string | null
}

interface Subject {
    id: string
    name: string
    code: string | null
    classes?: {
        class: Class
    }[]
}

interface ClassAssignmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    subject: Subject | null
    classes: Class[]
    onAssignClasses: (subjectId: string, classIds: string[]) => Promise<void>
}

export function ClassAssignmentModal({
    open,
    onOpenChange,
    subject,
    classes,
    onAssignClasses
}: ClassAssignmentModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedClasses, setSelectedClasses] = useState<string[]>([])
    const [currentClassIds, setCurrentClassIds] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (subject && open) {
            // Extract current class IDs from subject
            const classIds = subject.classes?.map(c => c.class.id) || []
            setSelectedClasses(classIds)
            setCurrentClassIds(classIds)
        } else {
            setSelectedClasses([])
            setCurrentClassIds([])
        }
    }, [subject, open])

    const filteredClasses = classes.filter(cls =>
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cls.section || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleToggleClass = (classId: string) => {
        setSelectedClasses(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        )
    }

    const handleSubmit = async () => {
        if (!subject) return

        setIsLoading(true)
        try {
            console.log(`Sending assignment request for subject ${subject.id} with classes:`, selectedClasses)
            await onAssignClasses(subject.id, selectedClasses)
            onOpenChange(false)
            toast.success("Classes assigned successfully")
        } catch (error) {
            console.error("Error assigning classes:", error)
            toast.error("Failed to assign classes")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Classes</DialogTitle>
                    <DialogDescription>
                        {subject ? `Assign ${subject.name} to classes` : 'Select classes to assign'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            type="search"
                            placeholder="Search classes..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="border rounded-md max-h-[300px] overflow-y-auto">
                        {filteredClasses.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                No classes found
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredClasses.map(cls => (
                                    <div
                                        key={cls.id}
                                        className="flex items-center p-3 hover:bg-secondary/10 cursor-pointer"
                                        onClick={() => handleToggleClass(cls.id)}
                                    >
                                        <div className="flex-1">
                                            <span className="font-medium">{cls.name}</span>
                                            {cls.section && (
                                                <span className="text-sm text-muted-foreground ml-2">
                                                    {cls.section}
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={selectedClasses.includes(cls.id)}
                                            onChange={() => { }} // Handled by div click
                                            className="h-4 w-4"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                        {selectedClasses.length} classes selected
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
                        disabled={isLoading || JSON.stringify(currentClassIds.sort()) === JSON.stringify(selectedClasses.sort())}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            "Assign Classes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 