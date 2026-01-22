"use client"

import { useState } from "react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Plus, Pencil, Trash2, Loader2, Users, BookOpen, GraduationCap, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UserRole } from "@prisma/client"

interface Department {
    id: string
    name: string
    description: string | null
    _count: {
        subjects: number
        students?: number
        teachers?: number
    }
}

interface DepartmentsTableProps {
    departments: Department[]
    userRole: UserRole
}

export function DepartmentsTable({ departments: initialDepartments, userRole }: DepartmentsTableProps) {
    const [departments, setDepartments] = useState(initialDepartments)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    })

    // Check if user has permission to manage departments
    const canManageDepartments = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.SCHOOL_ADMIN

    // Stats summary for the page
    const totalSubjects = departments.reduce((total, dept) => total + (dept._count.subjects || 0), 0);
    const totalTeachers = departments.reduce((total, dept) => total + (dept._count.teachers || 0), 0);
    const totalStudents = departments.reduce((total, dept) => total + (dept._count.students || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const url = isEditMode && selectedDepartment
                ? `/api/departments/${selectedDepartment.id}`
                : `/api/departments`

            const method = isEditMode ? "PATCH" : "POST"

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || `Failed to ${isEditMode ? 'update' : 'create'} department`)
            }

            const newDepartment = await response.json()

            if (isEditMode) {
                setDepartments(departments.map(dept =>
                    dept.id === selectedDepartment?.id ? { ...newDepartment, _count: dept._count } : dept
                ))
                toast.success("Department updated successfully")
            } else {
                setDepartments([...departments, { ...newDepartment, _count: { subjects: 0, students: 0, teachers: 0 } }])
                toast.success("Department created successfully")
            }

            resetForm()
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} department:`, error)
            toast.error(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} department`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        setIsDeleting(id)

        try {
            const response = await fetch(`/api/departments/${id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || "Failed to delete department")
            }

            setDepartments(departments.filter(dept => dept.id !== id))
            toast.success("Department deleted successfully")
        } catch (error) {
            console.error("Error deleting department:", error)
            toast.error(error instanceof Error ? error.message : "Failed to delete department")
        } finally {
            setIsDeleting(null)
        }
    }

    const handleEdit = (department: Department) => {
        setSelectedDepartment(department)
        setFormData({
            name: department.name,
            description: department.description || "",
        })
        setIsEditMode(true)
        setIsDialogOpen(true)
    }

    const resetForm = () => {
        setFormData({ name: "", description: "" })
        setSelectedDepartment(null)
        setIsEditMode(false)
        setIsDialogOpen(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center mb-4">
                {canManageDepartments && (
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Department
                    </Button>
                )}
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {departments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No departments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            departments.map((department) => (
                                <TableRow key={department.id}>
                                    <TableCell className="font-medium">{department.name}</TableCell>
                                    <TableCell>{department.description || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-medium text-blue-600">
                                                    {department._count.students || 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <GraduationCap className="h-4 w-4 text-green-600" />
                                                <span className="text-sm font-medium text-green-600">
                                                    {department._count.teachers || 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <BookOpen className="h-4 w-4 text-amber-600" />
                                                <span className="text-sm font-medium text-amber-600">
                                                    {department._count.subjects}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="flex items-center"
                                            >
                                                <Link href={`/dashboard/departments/${department.id}`}>
                                                    View Details <ArrowRight className="ml-1 h-4 w-4" />
                                                </Link>
                                            </Button>
                                            {canManageDepartments && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(department)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(department.id)}
                                                        disabled={isDeleting === department.id}
                                                        className="text-destructive"
                                                    >
                                                        {isDeleting === department.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <SheetContent side="right">
                    <SheetHeader className="pb-6">
                        <SheetTitle>{isEditMode ? 'Edit Department' : 'Create Department'}</SheetTitle>
                        <SheetDescription>
                            {isEditMode
                                ? "Update the department's information below."
                                : "Add a new department by filling out the information below."}
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter department name"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter department description"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <SheetFooter className="mt-8">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Update Department' : 'Create Department'
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    )
} 