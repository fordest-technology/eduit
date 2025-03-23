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
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface Class {
    id: string
    name: string
    section?: string
}

interface ManageClassesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    teacherId: string
    teacherClasses: Class[]
    availableClasses: Class[]
}

export function ManageClassesModal({
    open,
    onOpenChange,
    teacherId,
    teacherClasses,
    availableClasses,
}: ManageClassesModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedClasses, setSelectedClasses] = useState<string[]>(
        teacherClasses.map(c => c.id)
    )

    async function onSubmit() {
        try {
            setIsLoading(true)

            const response = await fetch(`/api/teachers/${teacherId}/classes`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    classIds: selectedClasses,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || "Failed to update classes")
            }

            toast.success("Classes updated successfully")
            onOpenChange(false)
            // Force a refresh to show the updated classes
            window.location.reload()
        } catch (error) {
            console.error("Failed to update classes:", error)
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
                    <DialogTitle>Manage Classes</DialogTitle>
                    <DialogDescription>
                        Select the classes this teacher will handle.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                    {availableClasses.map((cls) => (
                        <div key={cls.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={cls.id}
                                checked={selectedClasses.includes(cls.id)}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedClasses([...selectedClasses, cls.id])
                                    } else {
                                        setSelectedClasses(selectedClasses.filter(id => id !== cls.id))
                                    }
                                }}
                            />
                            <Label htmlFor={cls.id} className="flex-1">
                                {cls.name}
                                {cls.section && <span className="text-muted-foreground ml-2">({cls.section})</span>}
                            </Label>
                        </div>
                    ))}

                    {availableClasses.length === 0 && (
                        <p className="text-muted-foreground">No classes available to assign.</p>
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