"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Pencil, Trash2, UserPlus, Eye } from "lucide-react"
import { AddParentModal } from "./add-parent-modal"

interface Parent {
    id: string
    name: string
    email: string
    profileImage?: string | null
    phone?: string | null
    alternatePhone?: string | null
    occupation?: string | null
    childrenCount: number
}

interface ParentsTableProps {
    parents: Parent[]
}

export function ParentsTable({ parents }: ParentsTableProps) {
    const router = useRouter()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [parentToDelete, setParentToDelete] = useState<Parent | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [parentToEdit, setParentToEdit] = useState<Parent | null>(null)

    async function handleDelete() {
        if (!parentToDelete) return

        try {
            const response = await fetch(`/api/parents/${parentToDelete.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error || "Failed to delete parent")
            }

            toast.success("Parent deleted successfully")
            router.refresh()
        } catch (error) {
            // Only log in development
            if (process.env.NODE_ENV !== "production" && error instanceof Error) {
                console.error("Failed to delete parent:", error.message)
            }

            toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
        } finally {
            setShowDeleteDialog(false)
            setParentToDelete(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Parents</h2>
                <Button onClick={() => setShowAddModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Parent
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Occupation</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Children</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parents.map((parent) => (
                            <TableRow key={parent.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={parent.profileImage || ""} alt={parent.name} />
                                            <AvatarFallback>
                                                {parent.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{parent.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{parent.email}</TableCell>
                                <TableCell>{parent.occupation || "-"}</TableCell>
                                <TableCell>{parent.phone || "-"}</TableCell>
                                <TableCell>{parent.childrenCount}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => router.push(`/dashboard/parents/${parent.id}`)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setParentToEdit(parent)
                                                    setShowAddModal(true)
                                                }}
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => {
                                                    setParentToDelete(parent)
                                                    setShowDeleteDialog(true)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the parent
                            account and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AddParentModal
                open={showAddModal}
                onOpenChange={(open: boolean) => {
                    setShowAddModal(open)
                    if (!open) setParentToEdit(null)
                }}
                parentToEdit={parentToEdit}
                onSuccess={() => {
                    router.refresh()
                }}
            />
        </div>
    )
} 