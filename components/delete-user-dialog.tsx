"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface DeleteUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: {
        id: string
        name: string
        email: string
    }
    onSuccess?: () => void
}

export function DeleteUserDialog({
    open,
    onOpenChange,
    user,
    onSuccess,
}: DeleteUserDialogProps) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/users/${user.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to delete user")
            }

            toast.success("User deleted successfully")
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error("Error deleting user:", error)
            toast.error("Failed to delete user")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete {user.name}? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        Email: {user.email}
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 