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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Loader2, Users, BookOpen, GraduationCap, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DepartmentsDialog } from "./departments-dialog"

type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "PARENT"

interface Department {
    id: string
    name: string
    description: string | null
    _count: {
        subjects: number
        students: number
        teachers: number
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
    const canManageDepartments = ["SUPER_ADMIN", "SCHOOL_ADMIN"].includes(userRole)

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
        if (!canManageDepartments) return
        setIsDeleting(id)

        try {
            const response = await fetch(`/api/departments/${id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to delete department")
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
        if (!canManageDepartments) return
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

    const handleSuccess = () => {
        setIsEditMode(false)
        setSelectedDepartment(null)
    }

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                                <h3 className="text-2xl font-bold text-blue-600">{totalStudents}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-green-100 rounded-full">
                                <GraduationCap className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Teachers</p>
                                <h3 className="text-2xl font-bold text-green-600">{totalTeachers}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-amber-100 rounded-full">
                                <BookOpen className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Subjects</p>
                                <h3 className="text-2xl font-bold text-amber-600">{totalSubjects}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
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

            <DepartmentsDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                isEditMode={isEditMode}
                departmentToEdit={selectedDepartment || undefined}
                onSuccess={handleSuccess}
            />
        </div>
    )
} 