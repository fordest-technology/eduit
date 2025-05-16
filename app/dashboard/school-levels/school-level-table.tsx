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
import { toast } from "sonner"
import { Loader2, Trash, Edit, Plus, Eye, MoreHorizontal, BookOpen, Users } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { LevelModal } from "./components/level-modal"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { UserRole } from "@prisma/client"

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
    userRole: UserRole | string
    schoolId: string
    onDataChange?: () => void
}

export function SchoolLevelTable({ initialLevels = [], userRole, schoolId, onDataChange }: SchoolLevelTableProps) {
    const router = useRouter()
    const [levels, setLevels] = useState<SchoolLevel[]>(initialLevels)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedLevel, setSelectedLevel] = useState<SchoolLevel | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const filteredLevels = levels.filter((level) =>
        level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        level.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCreateLevel = async (data: Omit<SchoolLevel, "id">) => {
        try {
            const response = await fetch("/api/school-levels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to create level")
            }

            // Get the newly created level data
            const newLevel = await response.json()

            // Immediately fetch updated levels
            const updatedLevelsResponse = await fetch("/api/school-levels")
            if (!updatedLevelsResponse.ok) {
                throw new Error("Failed to fetch updated levels")
            }
            const updatedLevels = await updatedLevelsResponse.json()
            setLevels(updatedLevels)

            // Close the modal
            setShowCreateModal(false)

            toast.success("Level created successfully")

            // Still call onDataChange for parent component updates if needed
            if (onDataChange) onDataChange()
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error creating level")
            }
            throw error
        }
    }

    const handleUpdateLevel = async (data: Omit<SchoolLevel, "id">) => {
        if (!selectedLevel) return

        try {
            const response = await fetch(`/api/school-levels/${selectedLevel.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to update level")
            }

            toast.success("Level updated successfully")
            if (onDataChange) onDataChange()
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error updating level")
            }
            throw error
        }
    }

    const handleDeleteLevel = async () => {
        if (!selectedLevel) return

        try {
            const response = await fetch(`/api/school-levels/${selectedLevel.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to delete level")
            }

            toast.success("Level deleted successfully")
            setShowDeleteDialog(false)
            if (onDataChange) onDataChange()
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error deleting level")
            }
        }
    }

    const handleViewLevel = (id: string) => {
        router.push(`/dashboard/school-levels/${id}`)
    }

    // Check if user has permission to manage levels
    const canManageLevels = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.SCHOOL_ADMIN

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search levels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64"
                    />
                </div>
                {canManageLevels && (
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Level
                    </Button>
                )}
            </div>
            <Separator className="my-4" />

            {filteredLevels.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-background">
                    <p className="mt-2 text-sm text-muted-foreground">
                        {searchQuery
                            ? "No levels found matching your search"
                            : "No levels have been created yet"}
                    </p>
                    {canManageLevels && !searchQuery && (
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            variant="outline"
                            className="mt-4"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add First Level
                        </Button>
                    )}
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Level Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Classes</TableHead>
                                <TableHead>Subjects</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLevels.map((level) => (
                                <TableRow key={level.id}>
                                    <TableCell className="font-medium">
                                        {level.name}
                                    </TableCell>
                                    <TableCell>
                                        {level.description || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                                            <span>{level._count?.classes || 0}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center">
                                            <BookOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                                            <span>{level._count?.subjects || 0}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{level.order}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => handleViewLevel(level.id)}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                {canManageLevels && (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedLevel(level)
                                                                setShowEditModal(true)
                                                            }}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setSelectedLevel(level)
                                                                setShowDeleteDialog(true)
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
                </div>
            )}

            {/* Create/Edit Modal */}
            <LevelModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onSubmit={handleCreateLevel}
                mode="create"
            />

            <LevelModal
                open={showEditModal}
                onOpenChange={setShowEditModal}
                onSubmit={handleUpdateLevel}
                initialData={selectedLevel || undefined}
                mode="edit"
            />

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Level</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this level? This action cannot be undone.
                            Any classes and subjects associated with this level will be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteLevel}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 