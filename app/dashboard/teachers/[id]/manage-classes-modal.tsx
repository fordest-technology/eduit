"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"

interface Class {
    id: string;
    name: string;
    section?: string;
}

interface ManageClassesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teacherId: string;
    availableClasses: Class[];
    teacherClasses: Class[];
    onSuccess?: () => Promise<void>;
}

export function ManageClassesModal({
    open,
    onOpenChange,
    teacherId,
    availableClasses = [],
    teacherClasses = [],
    onSuccess
}: ManageClassesModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedClasses, setSelectedClasses] = useState<string[]>([])
    const router = useRouter()

    // Initialize selected classes when modal opens or teacherClasses change
    useEffect(() => {
        if (open) {
            console.log('Teacher Classes:', teacherClasses)
            const initialSelected = teacherClasses.map(c => c.id)
            console.log('Initial Selected:', initialSelected)
            setSelectedClasses(initialSelected)
        }
    }, [open, teacherClasses])

    async function fetchUpdatedClasses() {
        try {
            const response = await fetch(`/api/teachers/${teacherId}/classes`, {
                credentials: 'include',
            })
            if (!response.ok) {
                throw new Error('Failed to fetch updated classes')
            }
            const data = await response.json()
            console.log('Fetched Updated Classes:', data.classes)
            return data.classes
        } catch (error) {
            console.error('Error fetching updated classes:', error)
            return null
        }
    }

    async function onSubmit() {
        try {
            setIsLoading(true)
            console.log('Submitting classes:', selectedClasses)

            const response = await fetch(`/api/teachers/${teacherId}/classes`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    classIds: selectedClasses
                }),
            })

            let data;
            try {
                data = await response.json();
                console.log('Response data:', data)
            } catch (e) {
                console.error('Failed to parse response:', e);
                toast.error('Server response was invalid. Please try again.');
                return;
            }

            if (!response.ok) {
                switch (response.status) {
                    case 401:
                        toast.error("Your session has expired. Please log in again.");
                        router.push('/auth/login');
                        return;
                    case 403:
                        toast.error("You don't have permission to manage teacher classes. Please contact an administrator.");
                        onOpenChange(false);
                        return;
                    case 404:
                        toast.error("Teacher not found or not in your school.");
                        onOpenChange(false);
                        return;
                    case 400:
                        toast.error(data.error || "Invalid request. Please check your selection.");
                        return;
                    default:
                        toast.error(data.error || "Failed to update classes. Please try again.");
                        return;
                }
            }

            // Fetch updated classes immediately after successful update
            const updatedClasses = await fetchUpdatedClasses();
            if (updatedClasses) {
                setSelectedClasses(updatedClasses.map((c: Class) => c.id));
            }

            toast.success("Classes updated successfully");
            router.refresh();
            if (onSuccess) {
                await onSuccess();
            }
            onOpenChange(false);
        } catch (error) {
            console.error('Error:', error);
            toast.error("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    function toggleClass(classId: string) {
        setSelectedClasses(current => {
            const newSelected = current.includes(classId)
                ? current.filter(id => id !== classId)
                : [...current, classId];
            console.log('Toggled class:', classId, 'New selection:', newSelected);
            return newSelected;
        })
    }

    // Debug logging for available and selected classes
    useEffect(() => {
        console.log('Available Classes:', availableClasses)
        console.log('Currently Selected Classes:', selectedClasses)
    }, [availableClasses, selectedClasses])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Manage Classes</DialogTitle>
                    <DialogDescription>
                        Select the classes to assign to this teacher
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                            {availableClasses.length > 0 ? (
                                availableClasses.map((cls) => (
                                    <div key={cls.id} className="flex items-center space-x-3 p-2 rounded hover:bg-accent/50 transition-colors">
                                        <Checkbox
                                            id={cls.id}
                                            checked={selectedClasses.includes(cls.id)}
                                            onCheckedChange={() => toggleClass(cls.id)}
                                            disabled={isLoading}
                                            className="h-5 w-5 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                        />
                                        <Label
                                            htmlFor={cls.id}
                                            className="flex-1 cursor-pointer select-none"
                                        >
                                            <span className="font-medium">{cls.name}</span>
                                            {cls.section && (
                                                <span className="text-muted-foreground ml-2">
                                                    ({cls.section})
                                                </span>
                                            )}
                                        </Label>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-center py-4">
                                    No classes available
                                </p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button
                        type="submit"
                        onClick={onSubmit}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isLoading ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 