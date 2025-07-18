"use client"

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Class, AcademicSession, AttendanceStatus, ExamType } from "@prisma/client";
import {
    PenIcon,
    Trash2Icon,
    UsersIcon,
    GraduationCapIcon,
    CheckCircleIcon,
    XCircleIcon,
    CalendarIcon,
    PhoneIcon,
    MailIcon,
    HomeIcon,
    BookIcon,
    ActivityIcon,
    AlertCircle,
    MapPin,
    Calendar,
    User as UserIcon,
    Mail,
    Phone,
    Flag,
    Bookmark,
    School,
    Building,
    Hash,
    GraduationCap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import StudentModal from "../../students/student-modal";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

// Types to match the actual schema
interface StudentClassRecord {
    id: string;
    class: Class;
    session: AcademicSession;
    sessionId: string;
    classId: string;
    studentId: string;
    rollNumber?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface StudentParentRecord {
    id: string;
    parent: ExtendedUser;
    parentId: string;
    studentId: string;
    relation?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface AttendanceRecord {
    id: string;
    date: Date;
    status: AttendanceStatus;
    studentId: string;
    sessionId: string;
    remarks?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface ResultRecord {
    id: string;
    studentId: string;
    subjectId: string;
    sessionId: string;
    examType: ExamType;
    marks: number;
    totalMarks: number;
    grade?: string | null;
    remarks?: string | null;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
    subject: {
        id: string;
        name: string;
    };
}

interface Department {
    id: string;
    name: string;
    description?: string | null;
    schoolId: string;
    createdAt: Date;
    updatedAt: Date;
}

interface ExtendedUser extends User {
    phone?: string | null;
    address?: string | null;
    dateOfBirth?: Date | null;
    gender?: string | null;
    religion?: string | null;
    state?: string | null;
    city?: string | null;
    country?: string | null;
}

interface ParentUser {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    profileImage: string | null;
}

type ComplexStudent = ExtendedUser & {
    department: Department | null;
    studentClass: StudentClassRecord[];
    parents: StudentParentRecord[];
    attendance: AttendanceRecord[];
    results: ResultRecord[];
};

interface StudentDetailsProps {
    student: ComplexStudent;
    currentClass: Class | undefined;
    currentSession: AcademicSession | null;
}

export function StudentDetails({ student, currentClass, currentSession }: StudentDetailsProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [isParentsDialogOpen, setIsParentsDialogOpen] = useState(false);
    const [availableParents, setAvailableParents] = useState<ParentUser[]>([]);
    const [selectedParentId, setSelectedParentId] = useState("");
    const [parentRelation, setParentRelation] = useState("");
    const [isParentLoading, setIsParentLoading] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);

    const router = useRouter();

    // Add a useEffect to fetch departments
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fetch(`/api/departments?schoolId=${student.schoolId}`);
                if (response.ok) {
                    const data = await response.json();
                    setDepartments(data.departments);
                }
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };

        fetchDepartments();
    }, [student.schoolId]);

    const calculateAttendancePercentage = () => {
        const attendance = student.attendance || [];
        if (!attendance || attendance.length === 0) return "N/A";

        const presentCount = attendance.filter(
            (a) => a.status === AttendanceStatus.PRESENT
        ).length;

        return `${Math.round((presentCount / attendance.length) * 100)}%`;
    };

    const formatDate = (date: Date | string | null) => {
        if (!date) return "Not Available";
        try {
            return format(new Date(date), "PPP");
        } catch (error) {
            return "Invalid Date";
        }
    };

    const handleDeleteStudent = async () => {
        try {
            setIsDeleteLoading(true);
            const response = await fetch(`/api/students/${student.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete student");
            }

            toast.success("Student has been deleted");
            router.push("/dashboard/students");
            router.refresh();
        } catch (error) {
            console.error("Error deleting student:", error);
            toast.error("Failed to delete student");
        } finally {
            setIsDeleteLoading(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const openParentsDialog = async () => {
        try {
            setIsParentLoading(true);
            const response = await fetch(`/api/students/${student.id}/parents`);

            if (!response.ok) {
                throw new Error("Failed to load parents");
            }

            const data = await response.json();
            setAvailableParents(data.availableParents);
            setIsParentsDialogOpen(true);
        } catch (error) {
            console.error("Error loading parents:", error);
            toast.error("Failed to load parents");
        } finally {
            setIsParentLoading(false);
        }
    };

    const handleAddParent = async () => {
        if (!selectedParentId) {
            toast.error("Please select a parent");
            return;
        }

        try {
            setIsParentLoading(true);
            const response = await fetch(`/api/students/${student.id}/parents`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    parentId: selectedParentId,
                    relation: parentRelation || null,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to add parent");
            }

            toast.success("Parent has been linked to this student");
            setIsParentsDialogOpen(false);
            setSelectedParentId("");
            setParentRelation("");
            router.refresh();
        } catch (error) {
            console.error("Error adding parent:", error);
            toast.error("Failed to link parent");
        } finally {
            setIsParentLoading(false);
        }
    };

    const handleRemoveParent = async (linkId: string) => {
        try {
            const response = await fetch(`/api/students/${student.id}/parents?linkId=${linkId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to remove parent");
            }

            toast.success("Parent has been unlinked from this student");
            router.refresh();
        } catch (error) {
            console.error("Error removing parent:", error);
            toast.error("Failed to unlink parent");
        }
    };

    const ParentCard = ({ sp }: { sp: StudentParentRecord }) => {
        return (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage
                            src={sp?.parent?.profileImage ?? undefined}
                            alt={sp?.parent?.name ?? 'Parent'}
                        />
                        <AvatarFallback>
                            {sp?.parent?.name?.[0]?.toUpperCase() ?? 'P'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{sp?.parent?.name ?? 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                            {sp?.relation ? `(${sp.relation})` : ''}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {sp?.parent?.email && (
                                <div className="flex items-center gap-1">
                                    <MailIcon className="h-3 w-3" />
                                    <span>{sp.parent.email}</span>
                                </div>
                            )}
                            {sp?.parent?.phone && (
                                <div className="flex items-center gap-1">
                                    <PhoneIcon className="h-3 w-3" />
                                    <span>{sp.parent.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveParent(sp.id)}
                >
                    <Trash2Icon className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    return (
        <div className="p-6">
            {/* Personal Information Section */}
            <div className="mb-8">
                <div className="flex items-center mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 mr-3">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-md font-semibold text-slate-900">Personal Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500">Full Name</p>
                        <p className="font-medium text-slate-900">{student.name}</p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500 flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" aria-hidden="true" />
                            Date of Birth
                        </p>
                        <p className="font-medium text-slate-900">{formatDate(student.dateOfBirth ?? null)}</p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500">Gender</p>
                        <div className="flex items-center">
                            <p className="font-medium text-slate-900">{student.gender || "Not specified"}</p>
                            {student.gender && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                    {student.gender}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {student.religion && (
                        <div className="space-y-1.5">
                            <p className="text-sm text-slate-500 flex items-center">
                                <Bookmark className="h-3.5 w-3.5 mr-1.5 text-slate-400" aria-hidden="true" />
                                Religion
                            </p>
                            <p className="font-medium text-slate-900">{student.religion}</p>
                        </div>
                    )}
                </div>
            </div>

            <Separator className="my-6" />

            {/* Contact Information Section */}
            <div className="mb-8">
                <div className="flex items-center mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 mr-3">
                        <Mail className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h3 className="text-md font-semibold text-slate-900">Contact Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500">Email Address</p>
                        <p className="font-medium text-slate-900">{student.email}</p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500 flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-slate-400" aria-hidden="true" />
                            Phone Number
                        </p>
                        <p className="font-medium text-slate-900">{student.phone || "Not available"}</p>
                    </div>
                </div>
            </div>

            <Separator className="my-6" />

            {/* Address Information Section */}
            <div className="mb-8">
                <div className="flex items-center mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 mr-3">
                        <MapPin className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h3 className="text-md font-semibold text-slate-900">Address Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                        <p className="text-sm text-slate-500">Address</p>
                        <p className="font-medium text-slate-900">{student.address || "Not available"}</p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500">City</p>
                        <p className="font-medium text-slate-900">{student.city || "Not available"}</p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500">State</p>
                        <p className="font-medium text-slate-900">{student.state || "Not available"}</p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500 flex items-center">
                            <Flag className="h-3.5 w-3.5 mr-1.5 text-slate-400" aria-hidden="true" />
                            Country
                        </p>
                        <p className="font-medium text-slate-900">{student.country || "Not available"}</p>
                    </div>
                </div>
            </div>

            <Separator className="my-6" />

            {/* Academic Information Section */}
            <div>
                <div className="flex items-center mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 mr-3">
                        {/* <GraduationCap className="h-4 w-4 text-purple-600" /> */}
                    </div>
                    <h3 className="text-md font-semibold text-slate-900">Academic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500 flex items-center">
                            <Building className="h-3.5 w-3.5 mr-1.5 text-slate-400" aria-hidden="true" />
                            Department
                        </p>
                        <div className="flex items-center">
                            <p className="font-medium text-slate-900">
                                {student.department?.name || "Not assigned"}
                            </p>
                            {student.department && (
                                <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-200 border-transparent">
                                    Department
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500 flex items-center">
                            <School className="h-3.5 w-3.5 mr-1.5 text-slate-400" aria-hidden="true" />
                            Current Class
                        </p>
                        <div className="flex items-center">
                            <p className="font-medium text-slate-900">
                                {currentClass
                                    ? `${currentClass.name}${currentClass.section ? ` - ${currentClass.section}` : ''}`
                                    : "Not assigned"}
                            </p>
                            {currentClass && (
                                <Badge className="ml-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-transparent">
                                    Active
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500 flex items-center">
                            <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-slate-400" aria-hidden="true" />
                            Education Level
                        </p>
                        <div className="flex items-center">
                            <p className="font-medium text-slate-900">{currentClass?.levelId || "N/A"}</p>
                            <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent">
                                Level
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500 flex items-center">
                            <Hash className="h-3.5 w-3.5 mr-1.5 text-slate-400" aria-hidden="true" />
                            Roll Number
                        </p>
                        <p className="font-medium text-slate-900">{"N/A"}</p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-sm text-slate-500 flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" aria-hidden="true" />
                            Academic Session
                        </p>
                        <div className="flex items-center">
                            <p className="font-medium text-slate-900">
                                {currentSession?.name || "Not available"}
                            </p>
                            {currentSession?.isCurrent && (
                                <Badge className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-200 border-transparent">
                                    Current
                                </Badge>
                            )}
                        </div>
                    </div>

                    {student.schoolId && (
                        <div className="space-y-1.5">
                            <p className="text-sm text-slate-500">School ID</p>
                            <p className="font-medium text-slate-900 text-sm">
                                <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-800">
                                    {student.schoolId.slice(0, 12)}...
                                </code>
                            </p>
                        </div>
                    )}
                </div>

                {student.studentClass && student.studentClass.length > 1 && (
                    <div className="mt-6">
                        <div className="flex items-center mb-3">
                            <h4 className="text-sm font-medium text-slate-900">Class History</h4>
                        </div>
                        <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Class</th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Level</th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Session</th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Roll Number</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {student.studentClass
                                        .filter(sc =>
                                            !(currentClass && sc.classId === currentClass.id && sc.sessionId === (currentSession?.id))
                                        )
                                        .map((sc, index) => (
                                            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900">
                                                    {sc.class?.name || "N/A"}
                                                    {sc.class?.section ? ` - ${sc.class.section}` : ''}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900">
                                                    {sc.class?.levelId || "N/A"}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900">
                                                    {sc.session?.name || "N/A"}
                                                    {sc.session?.isCurrent && (
                                                        <Badge variant="outline" className="ml-2 text-xs">Current</Badge>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900">
                                                    {sc.rollNumber || "N/A"}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 