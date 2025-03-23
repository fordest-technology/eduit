"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Trash, Edit, Plus, Eye, MoreHorizontal, BookOpen, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserRole } from "@prisma/client"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface DeleteConfirmationProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isDeleting: boolean
    title: string
    description: string
}

function DeleteConfirmation({
    open,
    onOpenChange,
    onConfirm,
    isDeleting,
    title,
    description
}: DeleteConfirmationProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p>{description}</p>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                            </>
                        ) : (
                            "Delete"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

interface SchoolLevel {
    id: string
    name: string
    description: string | null
    order: number
    _count?: {
        classes: number
        subjects: number
    }
}

interface SchoolLevelTableProps {
    initialLevels: SchoolLevel[]
    userRole: string
    schoolId: string
    onDataChange?: () => void
}

export function SchoolLevelTable({ initialLevels = [], userRole, schoolId, onDataChange }: SchoolLevelTableProps) {
    const router = useRouter();
    const [levels, setLevels] = useState<SchoolLevel[]>(initialLevels)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | null>(null)

    const [newLevel, setNewLevel] = useState({
        name: "",
        description: "",
        order: 0
    })

    const [editLevel, setEditLevel] = useState({
        id: "",
        name: "",
        description: "",
        order: 0
    })

    const fetchLevels = async () => {
        try {
            const response = await fetch("/api/school-levels")
            if (!response.ok) throw new Error("Failed to fetch school levels")
            const data = await response.json()
            setLevels(data)
            if (onDataChange) onDataChange()
        } catch (error) {
            toast.error("Error fetching school levels")
        }
    }

    const handleCreateLevel = async () => {
        try {
            setIsCreating(true)
            const response = await fetch("/api/school-levels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newLevel.name,
                    description: newLevel.description,
                    order: Number(newLevel.order)
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to create school level")
            }

            toast.success("School level created successfully")
            setShowCreateDialog(false)
            setNewLevel({ name: "", description: "", order: 0 })
            await fetchLevels()
            if (onDataChange) onDataChange()
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error creating school level")
            }
        } finally {
            setIsCreating(false)
        }
    }

    const handleUpdateLevel = async () => {
        try {
            setIsUpdating(true)
            const response = await fetch(`/api/school-levels/${editLevel.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editLevel.name,
                    description: editLevel.description,
                    order: Number(editLevel.order)
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to update school level")
            }

            toast.success("School level updated successfully")
            setShowEditDialog(false)
            await fetchLevels()
            if (onDataChange) onDataChange()
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error updating school level")
            }
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDeleteLevel = async () => {
        if (!selectedLevel) return

        try {
            setIsDeleting(true)
            const response = await fetch(`/api/school-levels/${selectedLevel.id}`, {
                method: "DELETE"
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to delete school level")
            }

            toast.success("School level deleted successfully")
            setShowDeleteDialog(false)
            await fetchLevels()
            if (onDataChange) onDataChange()
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error deleting school level")
            }
        } finally {
            setIsDeleting(false)
        }
    }

    const handleViewLevel = (id: string) => {
        router.push(`/dashboard/school-levels/${id}`);
    };

    // Check if user has permission to manage levels
    const canManageLevels = userRole === "super_admin" || userRole === "school_admin"

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                {canManageLevels && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Level
                    </Button>
                )}
            </div>
            <Separator className="my-4" />

            {levels.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg">
                    <p className="mb-4 text-muted-foreground">No school levels found</p>
                    {canManageLevels && (
                        <Button onClick={() => setShowCreateDialog(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add First Level
                        </Button>
                    )}
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead>Classes</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {levels.map((level) => (
                            <TableRow
                                key={level.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleViewLevel(level.id)}
                            >
                                <TableCell className="font-medium">{level.name}</TableCell>
                                <TableCell>
                                    {level.description ?
                                        level.description.length > 50 ?
                                            `${level.description.substring(0, 50)}...` :
                                            level.description
                                        : '-'
                                    }
                                </TableCell>
                                <TableCell>{level.order}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3 text-muted-foreground" />
                                        <span>{level._count?.classes || 0}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                                        <span>{level._count?.subjects || 0}</span>
                                    </div>
                                </TableCell>
                                <TableCell
                                    className="text-right"
                                    onClick={(e) => e.stopPropagation()} // Prevent row click when clicking actions
                                >
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleViewLevel(level.id)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Details
                                            </DropdownMenuItem>
                                            {canManageLevels && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => {
                                                        setEditLevel({
                                                            id: level.id,
                                                            name: level.name,
                                                            description: level.description || "",
                                                            order: level.order || 0
                                                        });
                                                        setShowEditDialog(true);
                                                    }}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => {
                                                            setSelectedLevel(level);
                                                            setShowDeleteDialog(true);
                                                        }}
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New School Level</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="name">Name</label>
                            <Input
                                id="name"
                                placeholder="Level Name"
                                value={newLevel.name}
                                onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="description">Description</label>
                            <Textarea
                                id="description"
                                placeholder="Description"
                                value={newLevel.description}
                                onChange={(e) => setNewLevel({ ...newLevel, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="order">Display Order</label>
                            <Input
                                id="order"
                                type="number"
                                placeholder="Order"
                                value={newLevel.order}
                                onChange={(e) => setNewLevel({ ...newLevel, order: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <Button onClick={handleCreateLevel} disabled={isCreating || !newLevel.name}>
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                </>
                            ) : (
                                "Create Level"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit School Level</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="edit-name">Name</label>
                            <Input
                                id="edit-name"
                                placeholder="Level Name"
                                value={editLevel.name}
                                onChange={(e) => setEditLevel({ ...editLevel, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="edit-description">Description</label>
                            <Textarea
                                id="edit-description"
                                placeholder="Description"
                                value={editLevel.description}
                                onChange={(e) => setEditLevel({ ...editLevel, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="edit-order">Display Order</label>
                            <Input
                                id="edit-order"
                                type="number"
                                placeholder="Order"
                                value={editLevel.order}
                                onChange={(e) => setEditLevel({ ...editLevel, order: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <Button onClick={handleUpdateLevel} disabled={isUpdating || !editLevel.name}>
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                                </>
                            ) : (
                                "Update Level"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <DeleteConfirmation
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDeleteLevel}
                isDeleting={isDeleting}
                title="Delete School Level"
                description={`Are you sure you want to delete the school level "${selectedLevel?.name}"? This action cannot be undone.`}
            />
        </div>
    )
} 