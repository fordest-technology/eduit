"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, Loader2, Plus, Trash, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { AddStudentDialog } from "@/components/add-student-dialog"
import { Role } from "@prisma/client"
import { useColors } from "@/contexts/color-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil } from "lucide-react"
import { AddUserDialog } from "@/components/add-user-dialog"

type School = {
  id: string
  name: string
}

type Class = {
  id: string
  name: string
  section?: string | null
  school: {
    id: string
    name: string
  }
}

type Session = {
  id: string
  name: string
}

type Department = {
  id: string
  name: string
  school: {
    id: string
    name: string
  }
}

type User = {
  id: string
  name: string
  email: string
  role: Role
  schoolId?: string | null
  school?: {
    name: string
  } | null
  department?: {
    name: string
  } | null
  studentClasses?: Array<{
    class: {
      name: string
    }
  }>
  createdAt: string
  profileImage?: string | null
  studentClass?: {
    id: string
    name: string
    section: string
  } | null
}

type Student = {
  id: string
  name: string
}

interface UsersTableProps {
  userRole: Role
  userId: string
  schoolId?: string
  schools: School[]
  classes: Class[]
  departments: Department[]
  currentSession?: Session | null
  roleFilter: string
}

export function UsersTable({
  userRole,
  userId,
  schoolId,
  schools,
  classes: initialClasses = [],
  departments: initialDepartments = [],
  currentSession,
  roleFilter,
}: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLinkParentDialogOpen, setIsLinkParentDialogOpen] = useState(false)
  const [isAssignClassDialogOpen, setIsAssignClassDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT" as Role,
    schoolId: schoolId || undefined,
    classId: undefined as string | undefined,
    parentId: undefined as string | undefined,
    departmentId: undefined as string | undefined,
    gender: "",
    dateOfBirth: "",
    religion: "",
    address: "",
    phone: "",
    country: "",
    city: "",
    state: "",
    profileImage: null as File | null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [classes, setClasses] = useState<Class[]>(initialClasses)
  const [parents, setParents] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>(initialDepartments)
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [isLoadingParents, setIsLoadingParents] = useState(false)
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false)
  const { colors } = useColors()
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [linkingParent, setLinkingParent] = useState<User | null>(null)
  const [addingToClass, setAddingToClass] = useState<User | null>(null)

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      let url = "/api/users?"

      if (roleFilter !== "all") {
        url += `&role=${roleFilter}`
      }

      if (schoolId) {
        url += `&schoolId=${schoolId}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [roleFilter, schoolId])

  // Fetch students for parent linking
  useEffect(() => {
    if (roleFilter === "PARENT" && (userRole === Role.SUPER_ADMIN || userRole === Role.SCHOOL_ADMIN)) {
      async function fetchStudents() {
        try {
          const response = await fetch(`/api/users?role=${Role.STUDENT}${schoolId ? `&schoolId=${schoolId}` : ""}`)

          if (!response.ok) {
            throw new Error("Failed to fetch students")
          }

          const data = await response.json()
          if (Array.isArray(data)) {
            setStudents(data)
          } else {
            throw new Error("Invalid response format")
          }
        } catch (error) {
          console.error("Error fetching students:", error)
        }
      }

      fetchStudents()
    }
  }, [roleFilter, schoolId, userRole])

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "STUDENT" as Role,
      schoolId: schoolId || undefined,
      classId: undefined,
      parentId: undefined,
      departmentId: undefined,
      gender: "",
      dateOfBirth: "",
      religion: "",
      address: "",
      phone: "",
      country: "",
      city: "",
      state: "",
      profileImage: null,
    })
  }

  // Open add dialog
  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (user: User) => {
    if (!user) return
    setCurrentUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't set password for edit
      role: user.role,
      schoolId: user.schoolId || undefined,
      classId: undefined,
      parentId: undefined,
      departmentId: undefined,
      gender: "",
      dateOfBirth: "",
      religion: "",
      address: "",
      phone: "",
      country: "",
      city: "",
      state: "",
      profileImage: null,
    })
    setIsEditDialogOpen(true)
  }

  // Open link parent dialog
  const openLinkParentDialog = (user: User) => {
    if (!user || user.role !== Role.PARENT) {
      toast.error("Only parents can be linked to students")
      return
    }

    setCurrentUser(user)
    setSelectedStudents([])
    setIsLinkParentDialogOpen(true)
  }

  // Open assign class dialog
  const openAssignClassDialog = (user: User) => {
    if (!user || user.role !== Role.STUDENT) {
      toast.error("Only students can be assigned to classes")
      return
    }

    setCurrentUser(user)
    setSelectedClass("")
    setIsAssignClassDialogOpen(true)
  }

  // Add user
  const addUser = async () => {
    setSubmitting(true)
    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formDataToSend.append(key, value.toString())
        }
      })

      if (formData.profileImage) {
        formDataToSend.append("profileImage", formData.profileImage)
      }

      const response = await fetch("/api/users", {
        method: "POST",
        body: formDataToSend,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add user")
      }

      const newUser = await response.json()
      setUsers((prev) => [newUser, ...prev])
      setIsAddDialogOpen(false)
      resetForm()
      toast.success("User added successfully")
    } catch (error: any) {
      console.error("Error adding user:", error)
      toast.error(error.message || "Failed to add user")
    } finally {
      setSubmitting(false)
    }
  }

  // Update user
  const updateUser = async () => {
    if (!currentUser) return

    setSubmitting(true)
    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "password" && !value) return // Skip empty password
        if (value !== null && value !== undefined && value !== "") {
          formDataToSend.append(key, value.toString())
        }
      })

      if (formData.profileImage) {
        formDataToSend.append("profileImage", formData.profileImage)
      }

      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        body: formDataToSend,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      const updatedUser = await response.json()
      setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
      setIsEditDialogOpen(false)
      setCurrentUser(null)
      toast.success("User updated successfully")
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast.error(error.message || "Failed to update user")
    } finally {
      setSubmitting(false)
    }
  }

  // Delete user
  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete user")
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId))

      toast.success("User deleted successfully")
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast.error(error.message || "Failed to delete user")
    }
  }

  // Link parent to students
  const linkParentToStudents = async () => {
    if (!currentUser || selectedStudents.length === 0) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/parent-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentId: currentUser.id,
          studentIds: selectedStudents,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to link parent to students")
      }

      setIsLinkParentDialogOpen(false)
      setCurrentUser(null)
      setSelectedStudents([])

      toast.success("Parent linked to students successfully")
    } catch (error: any) {
      console.error("Error linking parent to students:", error)
      toast.error(error.message || "Failed to link parent to students")
    } finally {
      setSubmitting(false)
    }
  }

  // Assign student to class
  const assignStudentToClass = async () => {
    if (!currentUser || !selectedClass || !currentSession) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/student-classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: currentUser.id,
          classId: selectedClass,
          sessionId: currentSession.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to assign student to class")
      }

      setIsAssignClassDialogOpen(false)
      setCurrentUser(null)
      setSelectedClass("none")

      toast.success("Student assigned to class successfully")
    } catch (error: any) {
      console.error("Error assigning student to class:", error)
      toast.error(error.message || "Failed to assign student to class")
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle student selection for parent linking
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  // Generate a random password
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData((prev) => ({ ...prev, password }))
  }

  useEffect(() => {
    if (isAddDialogOpen) {
      fetchClasses()
      fetchParents()
      fetchDepartments()
    }
  }, [isAddDialogOpen])

  const fetchClasses = async () => {
    try {
      setIsLoadingClasses(true)
      const response = await fetch("/api/classes")
      if (!response.ok) {
        throw new Error("Failed to fetch classes")
      }
      const data = await response.json()
      setClasses(data || [])
    } catch (error) {
      console.error("Error fetching classes:", error)
      toast.error("Failed to load classes")
      setClasses([])
    } finally {
      setIsLoadingClasses(false)
    }
  }

  const fetchParents = async () => {
    try {
      setIsLoadingParents(true)
      const response = await fetch(`/api/users?role=${Role.PARENT}`)
      if (!response.ok) {
        throw new Error("Failed to fetch parents")
      }
      const data = await response.json()
      setParents(data || [])
    } catch (error) {
      console.error("Error fetching parents:", error)
      toast.error("Failed to load parents")
      setParents([])
    } finally {
      setIsLoadingParents(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      setIsDepartmentsLoading(true)
      const response = await fetch("/api/departments")
      if (!response.ok) {
        throw new Error("Failed to fetch departments")
      }
      const data = await response.json()
      setDepartments(data || [])
    } catch (error) {
      console.error("Error fetching departments:", error)
      toast.error("Failed to fetch departments")
      setDepartments([])
    } finally {
      setIsDepartmentsLoading(false)
    }
  }

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false)
    fetchUsers()
  }

  const handleEditUser = (user: User) => {
    setCurrentUser(user)
    setIsAddDialogOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user)
  }

  const handleLinkStudent = (user: User) => {
    setLinkingParent(user)
  }

  const handleAddToClass = (user: User) => {
    setAddingToClass(user)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          {(userRole === Role.SUPER_ADMIN || userRole === Role.SCHOOL_ADMIN) && (
            <>
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[300px]"
              />

              {userRole === Role.SUPER_ADMIN && (
                <Select value={formData.schoolId} onValueChange={(value) => handleSelectChange("schoolId", value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Schools" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingClasses ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : classes.length > 0 ? (
                      classes.map((school) => (
                        <SelectItem key={school.id} value={school.id || "none"}>
                          {school.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No schools available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </>
          )}
        </div>

        <Button onClick={openAddDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={userRole === Role.SUPER_ADMIN ? 6 : 5} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userRole === Role.SUPER_ADMIN ? 6 : 5} className="text-center py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImage || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        {user.role === Role.TEACHER && <span className="text-xs text-muted-foreground">Teacher</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.studentClass?.name || "-"}</TableCell>
                  <TableCell>{user.department?.name || "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>

                      {user.role === Role.PARENT && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleLinkStudent(user)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Users className="h-4 w-4" />
                          <span className="sr-only">Link to Students</span>
                        </Button>
                      )}

                      {user.role === Role.STUDENT && currentSession && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAddToClass(user)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Assign to Class</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with the specified role.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    name="password"
                    type="text"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    required
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generatePassword}>
                    Generate
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  name="role"
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange("role", value)}
                  disabled={roleFilter !== "all"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRole === Role.SUPER_ADMIN && <SelectItem value={Role.SCHOOL_ADMIN}>School Admin</SelectItem>}
                    <SelectItem value={Role.TEACHER}>Teacher</SelectItem>
                    <SelectItem value={Role.STUDENT}>Student</SelectItem>
                    <SelectItem value={Role.PARENT}>Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  name="gender"
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Input
                  id="religion"
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  placeholder="Religion"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileImage">Profile Image</Label>
              <Input
                id="profileImage"
                name="profileImage"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setFormData((prev) => ({ ...prev, profileImage: file }))
                }}
              />
            </div>

            {userRole === Role.SUPER_ADMIN && (
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Select
                  name="schoolId"
                  value={formData.schoolId}
                  onValueChange={(value) => handleSelectChange("schoolId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingClasses ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : classes.length > 0 ? (
                      classes.map((school) => (
                        <SelectItem key={school.id} value={school.id || "none"}>
                          {school.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No schools available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addUser} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Parent to Students Dialog */}
      <Dialog open={isLinkParentDialogOpen} onOpenChange={setIsLinkParentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Link Parent to Students</DialogTitle>
            <DialogDescription>Select the students that this parent should be linked to.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm font-medium">Parent: {currentUser?.name}</p>
              <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students available</p>
              ) : (
                students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleStudentSelection(student.id)}
                    />
                    <Label htmlFor={`student-${student.id}`}>{student.name}</Label>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkParentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={linkParentToStudents} disabled={submitting || selectedStudents.length === 0}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link to Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Student to Class Dialog */}
      <Dialog open={isAssignClassDialogOpen} onOpenChange={setIsAssignClassDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Student to Class</DialogTitle>
            <DialogDescription>
              Select the class to assign this student to for the current academic session.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm font-medium">Student: {currentUser?.name}</p>
              <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
              {currentSession && <p className="text-sm text-muted-foreground mt-1">Session: {currentSession.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingClasses ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : classes.length > 0 ? (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id || "none"}>
                        {cls.name} {cls.section ? `(${cls.section})` : ""}
                        {userRole === Role.SUPER_ADMIN && ` - ${cls.school.name}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No classes available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignClassDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={assignStudentToClass}
              disabled={submitting || !selectedClass || selectedClass === "none" || !currentSession}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign to Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deletingUser && (
        <DeleteUserDialog
          open={!!deletingUser}
          onOpenChange={(open) => !open && setDeletingUser(null)}
          user={deletingUser}
          onSuccess={handleAddSuccess}
        />
      )}

      {linkingParent && (
        <LinkStudentDialog
          open={!!linkingParent}
          onOpenChange={(open) => !open && setLinkingParent(null)}
          parentId={linkingParent.id}
          onSuccess={handleAddSuccess}
        />
      )}

      {addingToClass && (
        <AddStudentToClassDialog
          open={!!addingToClass}
          onOpenChange={(open) => !open && setAddingToClass(null)}
          studentId={addingToClass.id}
          onSuccess={handleAddSuccess}
        />
      )}

      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        initialRole={roleFilter}
        user={currentUser}
        onSuccess={handleAddSuccess}
      />
    </div>
  )
}

