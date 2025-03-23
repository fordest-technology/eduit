"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type Department = {
    id: string
    name: string
    school?: {
        id: string
        name: string
    }
}

type Class = {
    id: string
    name: string
    section?: string | null
    school?: {
        id: string
        name: string
    }
}

type Parent = {
    id: string
    name: string
    email: string
}

interface AddStudentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    classes: Class[]
    parents: Parent[]
    departments: Department[]
    schoolId?: string
}

export function AddStudentDialog({
    open,
    onOpenChange,
    onSuccess,
    classes = [],
    parents = [],
    departments = [],
    schoolId,
}: AddStudentDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "STUDENT",
        schoolId: schoolId || "",
        classId: "",
        parentId: "",
        departmentId: "",
        gender: "",
        dateOfBirth: "",
        religion: "",
        address: "",
        phone: "",
        country: "",
        city: "",
        state: "",
    })

    const [isLoading, setIsLoading] = useState(false)
    const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const error = await response.text()
                toast.error(error)
                return
            }

            toast.success("Student added successfully")
            onSuccess?.()
            onOpenChange(false)
            setFormData({
                name: "",
                email: "",
                password: "",
                role: "STUDENT",
                schoolId: schoolId || "",
                classId: "",
                parentId: "",
                departmentId: "",
                gender: "",
                dateOfBirth: "",
                religion: "",
                address: "",
                phone: "",
                country: "",
                city: "",
                state: "",
            })
        } catch (error) {
            console.error("Error adding student:", error)
            toast.error("Failed to add student")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectChange = (
        e: React.ChangeEvent<HTMLSelectElement>,
        field: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: e.target.value,
        }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                        Fill in the student details below.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="class">Class</Label>
                                <Select
                                    value={formData.classId}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, classId: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="placeholder">Select a class</SelectItem>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="department">Department</Label>
                                <Select
                                    value={formData.departmentId}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, departmentId: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="placeholder">Select a department</SelectItem>
                                        {isDepartmentsLoading ? (
                                            <SelectItem value="loading" disabled>
                                                Loading departments...
                                            </SelectItem>
                                        ) : departments?.length > 0 ? (
                                            departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-departments" disabled>
                                                No departments available
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="parent">Parent (Optional)</Label>
                                <Select
                                    value={formData.parentId}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, parentId: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="placeholder">Select a parent</SelectItem>
                                        {parents.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Student"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
} 