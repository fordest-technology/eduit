"use client"

import { useState, useEffect } from "react"
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
import { Loader2, Trash, Edit, Plus, Eye, MoreHorizontal, Mail, Phone, User, Search, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

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

interface Parent {
    id: string
    name: string
    email: string
    profileImage?: string
    phone?: string
    childrenCount: number
    children?: string
}

interface ParentsTableProps {
    initialParents: Parent[]
    userRole: string
    schoolId: string
    onDataChange?: () => void
}

function TableRowSkeleton() {
    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full mr-2" />
                    <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell className="text-right">
                <Skeleton className="h-8 w-8 ml-auto" />
            </TableCell>
        </TableRow>
    )
}

export default function ParentsTable({ initialParents = [], userRole, schoolId, onDataChange }: ParentsTableProps) {
    const router = useRouter();
    const [parents, setParents] = useState<Parent[]>(initialParents)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    const [newParent, setNewParent] = useState({
        name: "",
        email: "",
        phone: "",
        password: ""
    })

    const [editParent, setEditParent] = useState({
        id: "",
        name: "",
        email: "",
        phone: ""
    })

    const filteredParents = parents.filter(parent =>
        parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Fetch parents when component mounts
    useEffect(() => {
        fetchParents()
    }, [])

    const fetchParents = async () => {
        try {
            const response = await fetch("/api/parents")
            if (!response.ok) throw new Error("Failed to fetch parents")
            const data = await response.json()

            // Map the data to match our Parent interface
            const formattedParents = data.map((parent: any) => ({
                id: parent.id,
                name: parent.name,
                email: parent.email,
                profileImage: parent.profileImage,
                phone: parent.parent?.phone || null,
                childrenCount: parent.parent?.children?.length || 0,
                children: parent.parent?.children?.map((child: any) => child.student?.user?.name).join(", ") || ""
            }))

            console.log("Formatted parents:", formattedParents) // Add logging to debug
            setParents(formattedParents)
            if (onDataChange) onDataChange()
        } catch (error) {
            console.error("Error fetching parents:", error)
            toast.error("Error fetching parents")
        }
    }

    const handleCreateParent = async () => {
        if (!newParent.name || !newParent.email || !newParent.password) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            setIsCreating(true)

            const formData = new FormData()
            formData.append("name", newParent.name)
            formData.append("email", newParent.email)
            formData.append("password", newParent.password)
            // Always send phone number, even if empty string
            formData.append("phone", newParent.phone || "")

            console.log("Creating parent with data:", {
                name: newParent.name,
                email: newParent.email,
                phone: newParent.phone
            }) // Add logging to debug

            const response = await fetch("/api/parents", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to create parent")
            }

            const result = await response.json()
            console.log("Create parent response:", result) // Add logging to debug

            toast.success("Parent created successfully")
            setShowCreateDialog(false)
            setNewParent({ name: "", email: "", phone: "", password: "" })
            await fetchParents()
        } catch (error) {
            console.error("Error creating parent:", error)
            toast.error(error instanceof Error ? error.message : "Failed to create parent")
        } finally {
            setIsCreating(false)
        }
    }

    const handleUpdateParent = async () => {
        try {
            setIsUpdating(true)

            const formData = new FormData()
            formData.append("name", editParent.name)
            formData.append("email", editParent.email)
            // Always send phone number, even if empty string
            formData.append("phone", editParent.phone || "")

            console.log("Updating parent with data:", {
                name: editParent.name,
                email: editParent.email,
                phone: editParent.phone
            }) // Add logging to debug

            const response = await fetch(`/api/parents/${editParent.id}`, {
                method: "PATCH",
                body: formData
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || "Failed to update parent")
            }

            const result = await response.json()
            console.log("Update parent response:", result) // Add logging to debug

            toast.success("Parent updated successfully")
            setShowEditDialog(false)
            await fetchParents()
        } catch (error) {
            console.error("Error updating parent:", error)
            toast.error(error instanceof Error ? error.message : "Failed to update parent")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDeleteParent = async () => {
        if (!selectedParent) return

        try {
            setIsDeleting(true)
            const response = await fetch(`/api/parents/${selectedParent.id}`, {
                method: "DELETE"
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to delete parent")
            }

            toast.success("Parent deleted successfully")
            setShowDeleteDialog(false)
            await fetchParents()
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("Error deleting parent")
            }
        } finally {
            setIsDeleting(false)
        }
    }

    const handleViewParent = (id: string) => {
        router.push(`/dashboard/parents/${id}`);
    };

    // Check if user has permission to manage parents
    const canManageParents = userRole === "super_admin" || userRole === "school_admin"

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                    <Input
                        placeholder="Search parents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                </div>
                {canManageParents && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Parent
                    </Button>
                )}
            </div>
            <Separator className="my-4" />

            {isCreating ? (
                <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg">
                    <Loader2 className="animate-spin h-12 w-12 mb-4" />
                    <h3 className="font-semibold text-lg">Creating parent...</h3>
                </div>
            ) : filteredParents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/5">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="h-12 w-12 text-muted-foreground/50" />
                        <h3 className="font-semibold text-lg">No parents found</h3>
                        {searchTerm ? (
                            <p className="text-sm text-muted-foreground">
                                No parents matching your search for "{searchTerm}"
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Get started by adding your first parent
                            </p>
                        )}
                    </div>
                    {canManageParents && !searchTerm && (
                        <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                            <Plus className="mr-2 h-4 w-4" /> Add First Parent
                        </Button>
                    )}
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Parent</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Children</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredParents.map((parent) => (
                                <TableRow key={parent.id} className="hover:bg-muted/50">
                                    <TableCell>
                                        <div className="flex items-center">
                                            <Avatar className="h-8 w-8 mr-2">
                                                <AvatarImage src={parent.profileImage} />
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {parent.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{parent.name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center">
                                                    <Mail className="h-3 w-3 mr-1" />
                                                    {parent.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm flex items-center">
                                                <Phone className="h-3 w-3 mr-1" />
                                                {parent.phone || "Not provided"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={parent.childrenCount > 0 ? "bg-primary/5" : "bg-muted"}>
                                            {parent.childrenCount || 0} {parent.childrenCount === 1 ? "Child" : "Children"}
                                        </Badge>
                                        {parent.children && (
                                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                                                {parent.children}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleViewParent(parent.id)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                {canManageParents && (
                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setEditParent({
                                                                    id: parent.id,
                                                                    name: parent.name,
                                                                    email: parent.email,
                                                                    phone: parent.phone || ""
                                                                });
                                                                setShowEditDialog(true);
                                                            }}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Parent
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => {
                                                                setSelectedParent(parent);
                                                                setShowDeleteDialog(true);
                                                            }}
                                                        >
                                                            <Trash className="mr-2 h-4 w-4" />
                                                            Delete Parent
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

            {/* Create Parent Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Parent</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Full Name
                            </label>
                            <Input
                                id="name"
                                value={newParent.name}
                                onChange={(e) => setNewParent({ ...newParent, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={newParent.email}
                                onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                                placeholder="johndoe@example.com"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="phone" className="text-sm font-medium">
                                Phone Number
                            </label>
                            <Input
                                id="phone"
                                value={newParent.phone}
                                onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
                                placeholder="+1 123 456 7890"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="password" className="text-sm font-medium">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={newParent.password}
                                onChange={(e) => setNewParent({ ...newParent, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateParent}
                            disabled={isCreating || !newParent.name || !newParent.email || !newParent.password}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                </>
                            ) : (
                                "Create Parent"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Parent Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Parent</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="edit-name" className="text-sm font-medium">
                                Full Name
                            </label>
                            <Input
                                id="edit-name"
                                value={editParent.name}
                                onChange={(e) => setEditParent({ ...editParent, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="edit-email" className="text-sm font-medium">
                                Email
                            </label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editParent.email}
                                onChange={(e) => setEditParent({ ...editParent, email: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="edit-phone" className="text-sm font-medium">
                                Phone Number
                            </label>
                            <Input
                                id="edit-phone"
                                value={editParent.phone}
                                onChange={(e) => setEditParent({ ...editParent, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateParent}
                            disabled={isUpdating || !editParent.name || !editParent.email}
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                                </>
                            ) : (
                                "Update Parent"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmation
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDeleteParent}
                isDeleting={isDeleting}
                title="Delete Parent"
                description={`Are you sure you want to delete ${selectedParent?.name}? This action cannot be undone and will remove all associated data.`}
            />
        </div>
    )
} 