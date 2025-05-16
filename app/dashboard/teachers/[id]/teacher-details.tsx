"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ManageSubjectsModal } from "./manage-subjects-modal"
import { ManageClassesModal } from "./manage-classes-modal"
import { DeleteTeacherModal } from "./delete-teacher-modal"
import { EditTeacherModal } from "./edit-teacher-modal"
import { Pencil, Trash } from "lucide-react"
import type { User, Class, Subject, Department, UserRole } from "@prisma/client"
import { useSearchParams } from "next/navigation"
import { formatDateToLocal } from "@/lib/utils"

interface TeacherData {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    phone: string | null;
    employeeId: string | null;
    qualifications: string | null;
    specialization: string | null;
    joiningDate: Date | null;
    departmentId: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    emergencyContact: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string;
        email: string;
        profileImage: string | null;
    };
    department?: Department;
    stats: {
        totalClasses: number;
        totalStudents: number;
        totalSubjects: number;
    };
    subjects: Array<{
        id: string;
        name: string;
        code: string;
        department: Department;
    }>;
    classes: Array<{
        id: string;
        name: string;
        section: string;
        level: {
            id: string;
            name: string;
        };
        studentCount: number;
    }>;
}

interface TeacherDetailsProps {
    teacher: TeacherData;
    availableClasses: {
        id: string;
        name: string;
        section?: string;
    }[];
    availableSubjects: {
        id: string;
        name: string;
    }[];
    currentSubjects: {
        id: string;
        name: string;
    }[];
    departments: {
        id: string;
        name: string;
    }[];
    onUpdate: () => Promise<void>;
}

export default function TeacherDetails({
    teacher,
    availableClasses,
    availableSubjects,
    currentSubjects,
    departments,
    onUpdate
}: TeacherDetailsProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isManageClassesModalOpen, setIsManageClassesModalOpen] = useState(false)
    const [isManageSubjectsModalOpen, setIsManageSubjectsModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("profile")
    const searchParams = useSearchParams()

    useEffect(() => {
        const tab = searchParams?.get("tab")
        if (tab) {
            setActiveTab(tab)
        }
    }, [searchParams])

    return (
        <div className="container py-10">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                        <AvatarImage src={teacher.profileImage || undefined} alt={teacher.name} />
                        <AvatarFallback>{teacher.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold">{teacher.name}</h1>
                        <p className="text-muted-foreground">{teacher.email}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="mb-4">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                    <TabsTrigger value="subjects">Subjects</TabsTrigger>
                </TabsList>
                <TabsContent value="profile">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle>Teacher Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex flex-col items-center gap-4 md:w-1/4">
                                        <Avatar className="h-32 w-32">
                                            <AvatarImage src={teacher.profileImage || ""} alt={teacher.name} />
                                            <AvatarFallback>{teacher.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-center">
                                            <h3 className="text-xl font-semibold">{teacher.name}</h3>
                                            <p className="text-sm text-muted-foreground">{teacher.department?.name || "department Not assigned"}</p>
                                        </div>
                                    </div>

                                    <div className="md:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-muted-foreground">Employee ID</h4>
                                            <p>{teacher.employeeId || "Not assigned"}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                                            <p>{teacher.email}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                                            <p>{teacher.phone || "Not provided"}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-muted-foreground">Gender</h4>
                                            <p>{teacher.gender}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-muted-foreground">Date of Birth</h4>
                                            <p>{teacher.dateOfBirth ? format(new Date(teacher.dateOfBirth), "MMMM dd, yyyy") : "-"}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-muted-foreground">Joining Date</h4>
                                            <p>{teacher.joiningDate ? format(new Date(teacher.joiningDate), "MMMM dd, yyyy") : "-"}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-muted-foreground">Qualifications</h4>
                                            <p>{teacher.qualifications || "Not specified"}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-muted-foreground">Specialization</h4>
                                            <p>{teacher.specialization || "Not specified"}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle>Address Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
                                        <p>{teacher.address}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground">City</h4>
                                        <p>{teacher.city}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground">State/Province</h4>
                                        <p>{teacher.state}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground">Country</h4>
                                        <p>{teacher.country}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="classes">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Assigned Classes</CardTitle>
                            <Button size="sm" onClick={() => setIsManageClassesModalOpen(true)}>
                                Manage Classes
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {teacher.classes && teacher.classes.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {teacher.classes.map((cls) => (
                                        <Card key={cls.id} className="border">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg">{cls.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {cls.section && <p className="text-sm text-muted-foreground">Section: {cls.section}</p>}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No classes assigned yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="subjects">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Teaching Subjects</CardTitle>
                            <Button size="sm" onClick={() => setIsManageSubjectsModalOpen(true)}>
                                Manage Subjects
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {teacher.subjects && teacher.subjects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {teacher.subjects.map((subjectTeacher) => (
                                        <Card key={subjectTeacher.id} className="border">
                                            <CardHeader className="py-3">
                                                <CardTitle className="text-lg">{subjectTeacher.name}</CardTitle>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No subjects assigned yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <EditTeacherModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                teacher={teacher}
                departments={departments}
            />
            <DeleteTeacherModal
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                teacherId={teacher.id}
                teacherName={teacher.name}
            />
            <ManageClassesModal
                open={isManageClassesModalOpen}
                onOpenChange={setIsManageClassesModalOpen}
                teacherId={teacher.id}
                availableClasses={availableClasses || []}
                teacherClasses={teacher.classes || []}
                onSuccess={onUpdate}
            />
            <ManageSubjectsModal
                open={isManageSubjectsModalOpen}
                onOpenChange={setIsManageSubjectsModalOpen}
                teacherId={teacher.id}
                availableSubjects={availableSubjects}
                currentSubjectIds={(currentSubjects || []).map(s => s.id)}
                onSuccess={onUpdate}
            />
        </div>
    )
} 