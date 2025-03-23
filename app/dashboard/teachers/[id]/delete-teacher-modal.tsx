"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface DeleteTeacherModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    teacherId: string
    teacherName: string
}

export function DeleteTeacherModal({
    open,
    onOpenChange,
    teacherId,
    teacherName,
}: DeleteTeacherModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function onDelete() {
        try {
            setIsLoading(true)

            const response = await fetch(`/api/teachers/${teacherId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error || "Failed to delete teacher")
            }

            toast.success("Teacher deleted successfully")
            router.push("/dashboard/teachers")
            router.refresh()
        } catch (error) {
            console.error("Failed to delete teacher:", error)
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("An unexpected error occurred")
            }
            onOpenChange(false)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete {teacherName}'s account and remove all their
                        associated data including class assignments and subject assignments.
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onDelete()
                        }}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Teacher"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
} 