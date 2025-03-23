"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Pencil, Trash, GraduationCap, BookOpen, MoreHorizontal, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

export interface Teacher {
    id: string
    userId: string
    name: string
    email: string
    phone: string
    department: string
    departmentId: string | null
    classes: string
    subjects: string
    profileImage?: string | null
    rawClasses?: any[]
    rawSubjects?: any[]
}

interface TeacherActionsProps {
    teacher: Teacher;
    onEdit?: (teacher: Teacher) => void;
}

const TeacherActions = ({ teacher, onEdit }: TeacherActionsProps) => {
    const router = useRouter()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            const response = await fetch(`/api/teachers/${teacher.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error || "Failed to delete teacher")
            }

            toast.success("Teacher deleted successfully")
            router.refresh()
        } catch (error) {
            console.error("Failed to delete teacher:", error)
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("An unexpected error occurred")
            }
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    const handleEditClick = () => {
        if (onEdit) {
            onEdit(teacher);
        } else {
            // Fallback to the detail page if no edit handler
            router.push(`/dashboard/teachers/${teacher.id}`);
        }
    };

    return (
        <>
            <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="icon" onClick={handleEditClick} title="Edit teacher">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                </Button>

                <Button variant="ghost" size="icon" asChild title="Manage classes">
                    <Link href={`/dashboard/teachers/${teacher.id}?tab=classes`}>
                        <GraduationCap className="h-4 w-4" />
                        <span className="sr-only">Classes</span>
                    </Link>
                </Button>

                <Button variant="ghost" size="icon" asChild title="Manage subjects">
                    <Link href={`/dashboard/teachers/${teacher.id}?tab=subjects`}>
                        <BookOpen className="h-4 w-4" />
                        <span className="sr-only">Subjects</span>
                    </Link>
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-500 hover:text-red-600"
                    title="Delete teacher"
                >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                </Button>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete {teacher.name}'s account and remove all associated data.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export const columns: ColumnDef<Teacher>[] = [
    {
        accessorKey: "name",
        header: "Teacher",
        cell: ({ row }) => {
            const teacher = row.original
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={teacher.profileImage || undefined} />
                        <AvatarFallback>{teacher.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium">{teacher.name}</span>
                        <span className="text-xs text-muted-foreground">{teacher.email}</span>
                    </div>
                </div>
            )
        }
    },
    {
        accessorKey: "phone",
        header: "Phone",
    },
    {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => {
            const department = row.getValue("department") as string
            return department !== "Not assigned" ? (
                <Badge variant="outline" className="bg-primary/10 text-primary">
                    {department}
                </Badge>
            ) : (
                <span className="text-muted-foreground text-sm">Not assigned</span>
            )
        }
    },
    {
        accessorKey: "classes",
        header: "Classes",
    },
    {
        accessorKey: "subjects",
        header: "Subjects",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const teacher = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/teachers/${teacher.id}`}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/teachers/${teacher.id}?tab=classes`}>
                                <GraduationCap className="mr-2 h-4 w-4" />
                                Manage Classes
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/teachers/${teacher.id}?tab=subjects`}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                Manage Subjects
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/teachers/${teacher.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Teacher
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    }
] 