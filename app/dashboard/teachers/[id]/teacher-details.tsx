"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { ManageSubjectsModal } from "./manage-subjects-modal"
import { ManageClassesModal } from "./manage-classes-modal"
import { DeleteTeacherModal } from "./delete-teacher-modal"
import { EditTeacherModal } from "./edit-teacher-modal"
import { Pencil, Trash, GraduationCap, BookOpen, Users, Mail, Phone, MapPin, Briefcase, Calendar, Shield, Award, Building2 } from "lucide-react"
import type { Department } from "@prisma/client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Summary Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-b from-white to-slate-50/50">
                        <div className="h-24 bg-gradient-to-r from-indigo-500/80 to-purple-500/20" />
                        <CardContent className="pt-0 -mt-12 px-6 pb-6">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-2 ring-primary/5">
                                    <AvatarImage src={teacher.profileImage || undefined} alt={teacher.name} />
                                    <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                                        {teacher.name.split(" ").map((n) => n[0]).join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="mt-4 space-y-1">
                                    <h3 className="text-2xl font-bold tracking-tight">{teacher.name}</h3>
                                    <Badge variant="default" className="mt-1">
                                        {teacher.department?.name || "General Faculty"}
                                    </Badge>
                                    {teacher.employeeId && (
                                        <p className="text-xs text-slate-400 font-mono mt-2">ID: {teacher.employeeId}</p>
                                    )}
                                </div>

                                <div className="w-full mt-6 space-y-3">
                                    <div className="flex items-center p-3 rounded-xl bg-white/50 border border-slate-100 hover:border-primary/20 transition-colors">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                                            <Mail className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <p className="text-[10px] uppercase font-semibold text-slate-400">Email Address</p>
                                            <p className="text-sm font-medium truncate">{teacher.email}</p>
                                        </div>
                                    </div>

                                    {teacher.phone && (
                                        <div className="flex items-center p-3 rounded-xl bg-white/50 border border-slate-100 hover:border-primary/20 transition-colors">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3">
                                                <Phone className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div className="text-left overflow-hidden">
                                                <p className="text-[10px] uppercase font-semibold text-slate-400">Phone Number</p>
                                                <p className="text-sm font-medium">{teacher.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {teacher.specialization && (
                                        <div className="flex items-center p-3 rounded-xl bg-white/50 border border-slate-100 hover:border-primary/20 transition-colors">
                                            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center mr-3">
                                                <Award className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div className="text-left overflow-hidden">
                                                <p className="text-[10px] uppercase font-semibold text-slate-400">Specialization</p>
                                                <p className="text-sm font-medium truncate">{teacher.specialization}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 w-full mt-8">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="w-full rounded-xl hover:bg-slate-50 group"
                                    >
                                        <Pencil className="mr-2 h-4 w-4 text-slate-400 group-hover:text-primary" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="w-full rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 group"
                                    >
                                        <Trash className="mr-2 h-4 w-4 text-slate-400 group-hover:text-red-500" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card className="border-none shadow-lg bg-slate-900 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <GraduationCap className="h-24 w-24" />
                        </div>
                        <CardContent className="p-6">
                            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Academic Load</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-2xl font-bold">{teacher.stats?.totalClasses || 0}</p>
                                    <p className="text-slate-400 text-xs mt-1">Classes</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{teacher.stats?.totalSubjects || 0}</p>
                                    <p className="text-slate-400 text-xs mt-1">Subjects</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{teacher.stats?.totalStudents || 0}</p>
                                    <p className="text-slate-400 text-xs mt-1">Students</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-slate-100/50 p-1 mb-6 rounded-2xl h-12 w-full sm:w-auto">
                            <TabsTrigger value="profile" className="rounded-xl px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Shield className="h-4 w-4 mr-2" />
                                Profile
                            </TabsTrigger>
                            <TabsTrigger value="classes" className="rounded-xl px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <GraduationCap className="h-4 w-4 mr-2" />
                                Classes
                            </TabsTrigger>
                            <TabsTrigger value="subjects" className="rounded-xl px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Subjects
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
                            <div className="space-y-6">
                                <Card className="border-none shadow-xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Professional Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                                    <Briefcase className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qualifications</p>
                                                    <p className="text-sm font-medium mt-0.5">{teacher.qualifications || "Not specified"}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                                    <Calendar className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Joining Date</p>
                                                    <p className="text-sm font-medium mt-0.5">
                                                        {teacher.joiningDate ? format(new Date(teacher.joiningDate), "MMMM dd, yyyy") : "Not available"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</p>
                                                    <p className="text-sm font-medium mt-0.5">{teacher.department?.name || "General Faculty"}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                                    <Users className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</p>
                                                    <p className="text-sm font-medium mt-0.5">{teacher.gender || "Not specified"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="bg-slate-100" />

                                        <div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Address Information</h4>
                                            <div className="flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                                    <MapPin className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{teacher.address || "No address provided"}</p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {teacher.city && <Badge variant="secondary" className="bg-slate-50 border-none">{teacher.city}</Badge>}
                                                        {teacher.state && <Badge variant="secondary" className="bg-slate-50 border-none">{teacher.state}</Badge>}
                                                        {teacher.country && <Badge variant="secondary" className="bg-slate-50 border-none">{teacher.country}</Badge>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="classes" className="mt-0 focus-visible:outline-none">
                            <Card className="border-none shadow-xl min-h-[400px]">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">Assigned Classes</CardTitle>
                                    <Button
                                        size="sm"
                                        className="rounded-xl bg-slate-900 hover:bg-slate-800"
                                        onClick={() => setIsManageClassesModalOpen(true)}
                                    >
                                        <GraduationCap className="h-4 w-4 mr-2" />
                                        Manage Classes
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <AnimatePresence mode="popLayout">
                                        {teacher.classes && teacher.classes.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {teacher.classes.map((cls, idx) => (
                                                    <Link key={cls.id} href={`/dashboard/my-classes/${cls.id}`}>
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: idx * 0.1 }}
                                                            className="group p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all duration-300 cursor-pointer"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <h4 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{cls.name}</h4>
                                                                    {cls.section && <p className="text-xs text-slate-500 mt-1">Section: {cls.section}</p>}
                                                                    <p className="text-xs text-slate-400 mt-1">Level: {cls.level.name}</p>
                                                                </div>
                                                                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                                    <div className="text-center">
                                                                        <p className="text-lg font-bold text-blue-600">{cls.studentCount}</p>
                                                                        <p className="text-[8px] text-blue-400 uppercase">Students</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col items-center justify-center py-20 text-center"
                                            >
                                                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                                    <GraduationCap className="h-10 w-10 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900">No classes assigned</h3>
                                                <p className="text-slate-500 max-w-xs mx-auto mt-2">
                                                    This teacher hasn't been assigned to any classes yet.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="subjects" className="mt-0 focus-visible:outline-none">
                            <Card className="border-none shadow-xl min-h-[400px]">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">Teaching Subjects</CardTitle>
                                    <Button
                                        size="sm"
                                        className="rounded-xl bg-slate-900 hover:bg-slate-800"
                                        onClick={() => setIsManageSubjectsModalOpen(true)}
                                    >
                                        <BookOpen className="h-4 w-4 mr-2" />
                                        Manage Subjects
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <AnimatePresence mode="popLayout">
                                        {teacher.subjects && teacher.subjects.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {teacher.subjects.map((subject, idx) => (
                                                    <motion.div
                                                        key={subject.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 hover:shadow-md transition-all duration-300"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center">
                                                                <BookOpen className="h-5 w-5 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-slate-900">{subject.name}</h4>
                                                                <p className="text-xs text-slate-500 font-mono">{subject.code}</p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col items-center justify-center py-20 text-center"
                                            >
                                                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                                    <BookOpen className="h-10 w-10 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900">No subjects assigned</h3>
                                                <p className="text-slate-500 max-w-xs mx-auto mt-2">
                                                    This teacher hasn't been assigned to teach any subjects yet.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

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
        </motion.div>
    )
}