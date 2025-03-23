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
}

export function DepartmentsTable({ departments: initialDepartments }: DepartmentsTableProps) {
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
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-6 flex items-center">
                        <div className="rounded-full p-3 bg-primary/10 mr-4">
                            <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Departments</p>
                            <h3 className="text-2xl font-bold">{departments.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center">
                        <div className="rounded-full p-3 bg-primary/10 mr-4">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Students</p>
                            <h3 className="text-2xl font-bold">{totalStudents}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center">
                        <div className="rounded-full p-3 bg-primary/10 mr-4">
                            <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Teachers</p>
                            <h3 className="text-2xl font-bold">{totalTeachers}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Departments List</h2>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Department Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {departments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No departments found. Create your first department to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            departments.map((department) => (
                                <TableRow key={department.id}>
                                    <TableCell className="font-medium">{department.name}</TableCell>
                                    <TableCell>{department.description || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-600">
                                                {department._count.students || 0} Students
                                            </Badge>
                                            <Badge variant="outline" className="bg-green-50 text-green-600">
                                                {department._count.teachers || 0} Teachers
                                            </Badge>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-600">
                                                {department._count.subjects} Subjects
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="flex items-center"
                                                title="View Department Details"
                                            >
                                                <Link href={`/dashboard/departments/${department.id}`}>
                                                    View Details <ArrowRight className="ml-1 h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(department)}
                                                title="Edit Department"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(department.id)}
                                                disabled={isDeleting === department.id}
                                                title="Delete Department"
                                            >
                                                {isDeleting === department.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => !isLoading && setIsDialogOpen(open)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? "Edit Department" : "Add New Department"}</DialogTitle>
                        <DialogDescription>
                            {isEditMode
                                ? "Update department details below and save changes."
                                : "Create a new academic department for your school."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Department Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Science, Mathematics, Arts"
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Briefly describe this department..."
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={resetForm} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditMode ? "Save Changes" : "Create Department"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
} 