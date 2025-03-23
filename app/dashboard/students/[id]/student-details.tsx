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

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString();
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
        <div className="container mx-auto py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Student Profile Card */}
                <Card className="md:col-span-1">
                    <CardHeader className="flex flex-col items-center space-y-2">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={student.profileImage || undefined} />
                            <AvatarFallback>{student.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-xl">{student.name}</CardTitle>
                        <CardDescription>
                            {currentClass?.name}
                            {currentClass?.section ? ` (${currentClass.section})` : ""}
                        </CardDescription>
                        <div className="flex flex-wrap gap-2 mt-4">
                            <StudentModal
                                student={student}
                                departments={departments}
                                trigger={
                                    <Button variant="outline" size="sm">
                                        <PenIcon className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                }
                                onSuccess={() => router.refresh()}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openParentsDialog}
                                disabled={isParentLoading}
                            >
                                <UsersIcon className="h-4 w-4 mr-2" />
                                Parents
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/students/${student.id}/attendance`}>
                                    <GraduationCapIcon className="h-4 w-4 mr-2" />
                                    Attendance
                                </Link>
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2Icon className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{student.email}</span>
                            </div>
                            {student.phone && (
                                <div className="flex items-center">
                                    <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>{student.phone}</span>
                                </div>
                            )}
                            {student.address && (
                                <div className="flex items-center">
                                    <HomeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>{student.address}</span>
                                </div>
                            )}
                            {student.dateOfBirth && (
                                <div className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>DOB: {formatDate(student.dateOfBirth)}</span>
                                </div>
                            )}
                            {student.department && (
                                <div className="flex items-center">
                                    <BookIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>Department: {student.department.name}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="md:col-span-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-3 mb-6">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="attendance">Attendance</TabsTrigger>
                            <TabsTrigger value="performance">Performance</TabsTrigger>
                            <TabsTrigger value="parents">Parents</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Student Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-lg font-medium">Personal Details</h3>
                                            <div className="space-y-2 mt-2">
                                                <div><span className="font-medium">Gender:</span> {student.gender || "Not specified"}</div>
                                                <div><span className="font-medium">Date of Birth:</span> {student.dateOfBirth ? formatDate(student.dateOfBirth) : "Not specified"}</div>
                                                <div><span className="font-medium">Religion:</span> {student.religion || "Not specified"}</div>
                                                <div><span className="font-medium">State:</span> {student.state || "Not specified"}</div>
                                                <div><span className="font-medium">City:</span> {student.city || "Not specified"}</div>
                                                <div><span className="font-medium">Country:</span> {student.country || "Not specified"}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium">Academic Details</h3>
                                            <div className="space-y-2 mt-2">
                                                <div><span className="font-medium">Current Class:</span> {currentClass ? `${currentClass.name} ${currentClass.section || ""}` : "Not assigned"}</div>
                                                <div><span className="font-medium">Department:</span> {student.department?.name || "Not assigned"}</div>
                                                <div><span className="font-medium">Session:</span> {currentSession?.name || "Not in session"}</div>
                                                <div><span className="font-medium">Attendance:</span> {calculateAttendancePercentage()}</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Parents */}
                            <TabsContent value="parents" className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Parents Information</h3>
                                    <Button onClick={openParentsDialog}>
                                        <UsersIcon className="mr-2 h-4 w-4" />
                                        Add Parent
                                    </Button>
                                </div>
                                <div className="grid gap-4">
                                    {student.parents && student.parents.length > 0 ? (
                                        student.parents.map((sp) => (
                                            <ParentCard key={sp.id} sp={sp} />
                                        ))
                                    ) : (
                                        <Card>
                                            <CardContent className="flex items-center justify-center p-6">
                                                <div className="text-center">
                                                    <UsersIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        No parents have been added yet
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </TabsContent>
                        </TabsContent>

                        {/* Attendance Tab */}
                        <TabsContent value="attendance" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Attendance History</CardTitle>
                                    <CardDescription>
                                        Recent attendance records for {student.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {student.attendance && student.attendance.length > 0 ? (
                                        <div className="space-y-2">
                                            {student.attendance.map((record) => (
                                                <div key={record.id} className="flex items-center justify-between border p-3 rounded-md">
                                                    <div className="flex items-center gap-3">
                                                        {record.status === AttendanceStatus.PRESENT ? (
                                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <XCircleIcon className="h-5 w-5 text-red-500" />
                                                        )}
                                                        <div>
                                                            <p className="font-medium">{formatDate(record.date)}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {record.remarks || "General"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-sm font-medium ${record.status === AttendanceStatus.PRESENT ? "text-green-500" : "text-red-500"
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No attendance records found</p>
                                    )}
                                    <div className="mt-6">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/students/${student.id}/attendance`}>
                                                <GraduationCapIcon className="h-4 w-4 mr-2" />
                                                View All Attendance
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Performance Tab */}
                        <TabsContent value="performance" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Academic Performance</CardTitle>
                                    <CardDescription>
                                        Examination results for {student.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {student.results && student.results.length > 0 ? (
                                        <div className="space-y-4">
                                            {student.results.map((result) => (
                                                <div key={result.id} className="border p-4 rounded-md">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="font-medium">{result.examType}</h4>
                                                            <p className="text-sm text-muted-foreground">{result.subject.name}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm">
                                                                {result.marks}/{result.totalMarks}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${result.grade && parseInt(result.grade) >= 70 ? "bg-green-100 text-green-800" :
                                                                result.grade && parseInt(result.grade) >= 50 ? "bg-yellow-100 text-yellow-800" :
                                                                    "bg-red-100 text-red-800"
                                                                }`}>
                                                                {result.grade || "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${result.grade && parseInt(result.grade) >= 70 ? "bg-green-500" :
                                                                result.grade && parseInt(result.grade) >= 50 ? "bg-yellow-500" :
                                                                    "bg-red-500"
                                                                }`}
                                                            style={{ width: `${(result.marks / result.totalMarks) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No examination results found</p>
                                    )}
                                    <div className="mt-6">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/students/${student.id}/results`}>
                                                <ActivityIcon className="h-4 w-4 mr-2" />
                                                View All Results
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this student
                            and all associated data including attendance, results, and class assignments.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleteLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteStudent();
                            }}
                            disabled={isDeleteLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleteLoading ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Parents Management Dialog */}
            <Dialog open={isParentsDialogOpen} onOpenChange={setIsParentsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Manage Parents</DialogTitle>
                        <DialogDescription>
                            Link a parent or guardian to this student
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="parent">Select Parent</Label>
                                <Select
                                    value={selectedParentId}
                                    onValueChange={setSelectedParentId}
                                    disabled={isParentLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableParents.length > 0 ? (
                                            availableParents.map((parent) => (
                                                <SelectItem key={parent.id} value={parent.id}>
                                                    {parent.name} ({parent.email})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No available parents
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="relation">Relation</Label>
                                <Input
                                    id="relation"
                                    placeholder="e.g. Father, Mother, Guardian"
                                    value={parentRelation}
                                    onChange={(e) => setParentRelation(e.target.value)}
                                    disabled={isParentLoading}
                                />
                            </div>
                        </div>

                        {availableParents.length === 0 && (
                            <div className="mt-4 flex items-center p-3 text-sm rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                                <p>No available parents to link. Add parents to the system first.</p>
                            </div>
                        )}

                        <Separator className="my-6" />

                        <div className="mb-4">
                            <h3 className="text-sm font-medium mb-2">Current Parents</h3>
                            {student.parents && student.parents.length > 0 ? (
                                <div className="space-y-2">
                                    {student.parents.map((sp) => (
                                        <div key={sp.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                                            <span>
                                                {sp?.parent?.name ?? 'Unknown Parent'}
                                                {sp?.relation ? ` (${sp.relation})` : ''}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveParent(sp.id)}
                                            >
                                                <Trash2Icon className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No parents linked yet</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsParentsDialogOpen(false)}
                            disabled={isParentLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddParent}
                            disabled={!selectedParentId || isParentLoading}
                        >
                            Add Parent
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 