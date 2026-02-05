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
    Search,
    FileIcon,
    Loader2,
    UserPlus,
    GraduationCap as GraduationCapIcon,
    Users as UsersIcon
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
import { format, subDays, startOfToday, eachDayOfInterval, startOfWeek, subWeeks, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip as ShadcnTooltip,
    TooltipContent as ShadcnTooltipContent,
    TooltipProvider as ShadcnTooltipProvider,
    TooltipTrigger as ShadcnTooltipTrigger,
} from "@/components/ui/tooltip";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

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
    total: number;
    grade?: string | null;
    remark?: string | null;
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
    onRefresh?: () => void;
}

export function StudentDetails({ student, currentClass, currentSession, onRefresh }: StudentDetailsProps) {
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
        const { present } = calculateAttendanceStats();
        const total = student.attendance?.length || 0;
        if (total === 0) return "N/A";
        return `${Math.round((present / total) * 100)}%`;
    };

    const calculateAttendanceStats = () => {
        const attendance = student.attendance || [];
        const present = attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
        const absent = attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
        const late = attendance.filter(a => a.status === AttendanceStatus.LATE).length;
        return { present, absent, late };
    };

    const attendanceStats = calculateAttendanceStats();

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
            if (onRefresh) onRefresh();
            else router.refresh();
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
            if (onRefresh) onRefresh();
            else router.refresh();
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
                                    <span>{sp.parent?.email}</span>
                                </div>
                            )}
                            {sp?.parent?.phone && (
                                <div className="flex items-center gap-1">
                                    <PhoneIcon className="h-3 w-3" />
                                    <span>{sp.parent?.phone}</span>
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

    const AttendanceHeatMap = ({ attendance }: { attendance: AttendanceRecord[] }) => {
        const today = startOfToday();
        const weeks = 24; // Increased to 24 weeks for a better spread
        
        // Ensure we start from a Monday weeks ago
        const gridStartDate = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 1 });
        
        // Create status map for easy lookup
        const statusMap = new Map();
        attendance.forEach(a => {
            const dateKey = format(new Date(a.date), 'yyyy-MM-dd');
            statusMap.set(dateKey, a.status);
        });

        const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        
        // Month markers
        const monthMarkers: { month: string, startIndex: number }[] = [];
        for (let i = 0; i < weeks; i++) {
            const date = addDays(gridStartDate, i * 7);
            const monthLabel = format(date, 'MMM');
            if (monthMarkers.length === 0 || monthMarkers[monthMarkers.length - 1].month !== monthLabel) {
                monthMarkers.push({ month: monthLabel, startIndex: i });
            }
        }

        return (
            <Card className="border-slate-100 shadow-xl shadow-black/5 rounded-[2.5rem] overflow-hidden bg-white p-8">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Attendance Engagement Hub</h4>
                        <p className="text-xs text-slate-400 font-medium mt-1">24-week behavioral consistency mapping</p>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 bg-slate-50 px-6 py-2.5 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-[3px] bg-slate-100" /> None</div>
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-[3px] bg-emerald-500" /> Present</div>
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-[3px] bg-amber-400" /> Late</div>
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-[3px] bg-rose-400" /> Absent</div>
                    </div>
                </div>
                
                <div className="flex flex-col">
                    {/* Month Labels */}
                    <div className="flex gap-1.5 ml-12 mb-2 relative h-4">
                        {monthMarkers.map((m, i) => (
                            <span 
                                key={i} 
                                className="text-[9px] font-black text-slate-300 uppercase tracking-tighter absolute"
                                style={{ left: `${m.startIndex * 18.2}px` }} // 12px width + 6px gap
                            >
                                {m.month}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-4 items-start">
                        {/* Day Labels */}
                        <div className="flex flex-col gap-1.5 pt-0.5">
                            {dayLabels.map(day => (
                                <span key={day} className="text-[10px] font-bold text-slate-300 h-3 flex items-center w-8">
                                    {day}
                                </span>
                            ))}
                        </div>

                        {/* The Grid */}
                        <div className="flex-1 overflow-x-auto pb-4 scrollbar-hide">
                            <div className="flex gap-1.5">
                                {Array.from({ length: weeks }).map((_, wIndex) => (
                                    <div key={wIndex} className="flex flex-col gap-1.5">
                                        {[0, 1, 2, 3, 4].map((dIndex) => {
                                            const dateInGrid = addDays(gridStartDate, wIndex * 7 + dIndex);
                                            const dateKey = format(dateInGrid, 'yyyy-MM-dd');
                                            const status = statusMap.get(dateKey);
                                            
                                            let colorClass = 'bg-slate-50 border border-slate-100/50';
                                            if (status === AttendanceStatus.PRESENT) colorClass = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.25)]';
                                            if (status === AttendanceStatus.LATE) colorClass = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.25)]';
                                            if (status === AttendanceStatus.ABSENT) colorClass = 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.25)]';
                                            
                                            return (
                                                <ShadcnTooltipProvider key={dIndex}>
                                                    <ShadcnTooltip>
                                                        <ShadcnTooltipTrigger asChild>
                                                            <div className={`h-3 w-3 shrink-0 rounded-[3px] ${colorClass} transition-all hover:scale-125 cursor-help`} />
                                                        </ShadcnTooltipTrigger>
                                                        <ShadcnTooltipContent className="rounded-xl font-bold bg-slate-900 border-none shadow-xl text-white py-2 px-3">
                                                            <p className="text-[10px] leading-none">{format(dateInGrid, 'EEEE, MMM do')} • <span className="uppercase tracking-widest">{status?.toLowerCase() || 'no data'}</span></p>
                                                        </ShadcnTooltipContent>
                                                    </ShadcnTooltip>
                                                </ShadcnTooltipProvider>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 border-b border-slate-100 bg-slate-50/50">
                    <TabsList className="bg-transparent h-14 gap-6 p-0 border-none">
                        <TabsTrigger
                            value="overview"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-2 font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all text-sm uppercase tracking-wider"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="academic"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-2 font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all text-sm uppercase tracking-wider"
                        >
                            Performance
                        </TabsTrigger>
                        <TabsTrigger
                            value="attendance"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-2 font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all text-sm uppercase tracking-wider"
                        >
                            Attendance
                        </TabsTrigger>
                        <TabsTrigger
                            value="parents"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-2 font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all text-sm uppercase tracking-wider"
                        >
                            Guardians
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-8">
                    <TabsContent value="overview" className="mt-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {/* Left Column: Personal & Contact */}
                            <div className="lg:col-span-2 space-y-10">
                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50">
                                            <UserIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg font-sora">Identity Details</h3>
                                            <p className="text-xs text-slate-500 font-medium">Core student identification information</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-100/50 transition-colors" />

                                        <div className="space-y-1.5 relative z-10">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Legal Name</p>
                                            <p className="font-bold text-slate-900 text-xl font-sora leading-tight">{student.name}</p>
                                        </div>
                                        <div className="space-y-1.5 relative z-10">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Birth Registry</p>
                                            <p className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                                <Calendar className="h-4 w-4 text-slate-300" />
                                                {formatDate(student.dateOfBirth ?? null)}
                                            </p>
                                        </div>
                                        <div className="space-y-1.5 relative z-10">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Gender Identity</p>
                                            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 px-4 py-1 rounded-full font-bold text-xs uppercase tracking-wider shadow-none">
                                                {student.gender || "Not specified"}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1.5 relative z-10">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Religous Faith</p>
                                            <p className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                                <Bookmark className="h-4 w-4 text-slate-300" />
                                                {student.religion || "Not recorded"}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100/50">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg font-sora">Contact Discovery</h3>
                                            <p className="text-xs text-slate-500 font-medium">Residential and communication availability</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group overflow-hidden relative">
                                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50/50 rounded-full -ml-16 -mb-16 blur-3xl group-hover:bg-emerald-100/50 transition-colors" />

                                        <div className="space-y-1.5 relative z-10">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Electronic Mail</p>
                                            <p className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                                <Mail className="h-4 w-4 text-slate-300" />
                                                {student.email}
                                            </p>
                                        </div>
                                        <div className="space-y-1.5 relative z-10">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Direct Line</p>
                                            <p className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                                <Phone className="h-4 w-4 text-slate-300" />
                                                {student.phone || "No current line"}
                                            </p>
                                        </div>
                                        <div className="md:col-span-2 space-y-1.5 relative z-10">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Primary Residence</p>
                                            <p className="font-bold text-slate-800 leading-relaxed text-lg flex items-start gap-2">
                                                <MapPin className="h-5 w-5 text-slate-300 mt-0.5" />
                                                {student.address ? `${student.address}, ${student.city || ''} ${student.state || ''}` : "Residential data pending"}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Visual Metrics */}
                            <div className="space-y-8">
                                <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 text-white rounded-[2.5rem] overflow-hidden group">
                                    <CardContent className="p-8 flex flex-col items-center text-center relative">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <ActivityIcon className="h-32 w-32" />
                                        </div>

                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70 mb-8">Punctuality Score</p>

                                        <div className="relative flex items-center justify-center mb-8">
                                            <svg className="h-40 w-40 transform -rotate-90">
                                                <circle
                                                    cx="80"
                                                    cy="80"
                                                    r="70"
                                                    stroke="currentColor"
                                                    strokeWidth="10"
                                                    fill="transparent"
                                                    className="text-white/10"
                                                />
                                                <circle
                                                    cx="80"
                                                    cy="80"
                                                    r="70"
                                                    stroke="currentColor"
                                                    strokeWidth="10"
                                                    fill="transparent"
                                                    strokeDasharray={439.8}
                                                    strokeDashoffset={439.8 * (1 - (parseInt(calculateAttendancePercentage()) || 0) / 100)}
                                                    strokeLinecap="round"
                                                    className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-1500 ease-in-out"
                                                />
                                            </svg>
                                            <div className="absolute flex flex-col items-center">
                                                <span className="text-4xl font-extrabold font-sora">{calculateAttendancePercentage()}</span>
                                                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Active</span>
                                            </div>
                                        </div>

                                        <p className="text-sm font-medium text-blue-100 leading-relaxed px-4">
                                            Student maintains optimal attendance levels for the current session.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-slate-50 rounded-[2rem] overflow-hidden">
                                    <div className="bg-slate-100/50 px-8 py-4 border-b border-slate-200/50">
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Academic Context</h4>
                                    </div>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-slate-500 font-bold group-hover:text-slate-800 transition-colors">Specialization</span>
                                            <Badge className="bg-white text-slate-800 border-slate-200 px-3 py-1 font-bold shadow-none group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all">
                                                {student.department?.name || "None"}
                                            </Badge>
                                        </div>
                                        <Separator className="bg-slate-200/30" />
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-slate-500 font-bold group-hover:text-slate-800 transition-colors">Education Tier</span>
                                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{currentClass?.levelId || "N/A"}</span>
                                        </div>
                                        <Separator className="bg-slate-200/30" />
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm text-slate-500 font-bold group-hover:text-slate-800 transition-colors">Registry ID</span>
                                            <span className="font-mono font-bold text-blue-600 bg-white border border-blue-100 px-3 py-1 rounded-xl shadow-sm hover:scale-110 transition-transform">
                                                {student.studentClass?.find(sc => sc.classId === currentClass?.id)?.rollNumber || "G-000"}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="academic" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="space-y-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <section>
                                    <h3 className="text-2xl font-bold text-slate-800 font-sora tracking-tight leading-none">Scholarship Progress</h3>
                                    <p className="text-slate-500 font-medium text-sm mt-2">Comprehensive subject evaluation and grade tracking</p>
                                </section>
                                <div className="flex gap-4">
                                    <Card className="px-6 py-3 border-emerald-100 bg-emerald-50/50 rounded-2xl flex items-center gap-3 shadow-sm group hover:scale-105 transition-transform cursor-pointer">
                                        <div className="p-2 rounded-xl bg-emerald-500 text-white group-hover:rotate-12 transition-transform">
                                            <GraduationCapIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">Global GPA</p>
                                            <p className="text-xl font-black text-emerald-700 font-sora leading-none">3.88</p>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                <Card className="border-slate-100 shadow-xl shadow-black/5 rounded-[2.5rem] overflow-hidden bg-white">
                                    <div className="bg-slate-50/80 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Performance Trajectory</h4>
                                        <Badge className="bg-blue-50 text-blue-600 font-bold border-none shadow-none">Last 6 Exams</Badge>
                                    </div>
                                    <CardContent className="p-8 h-[350px]">
                                        {student.results && student.results.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={student.results.slice(-6).map(r => ({ name: r.subject.name.substring(0, 5), score: r.total }))}>
                                                    <defs>
                                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                                    />
                                                    <ChartTooltip
                                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="score"
                                                        stroke="#4f46e5"
                                                        strokeWidth={4}
                                                        fillOpacity={1}
                                                        fill="url(#colorScore)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                <ActivityIcon className="h-12 w-12 mb-4 opacity-20" />
                                                <p className="font-bold text-sm">Insufficient data for trajectory mapping</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-100 shadow-xl shadow-black/5 rounded-[2.5rem] overflow-hidden bg-white group">
                                    <div className="bg-slate-50/80 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Active Subject Ledger</h4>
                                        <Badge className="bg-white text-slate-400 font-bold border-slate-200 shadow-none">Top 5 Records</Badge>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-100">
                                            {student.results && student.results.length > 0 ? (
                                                student.results.slice(0, 5).map((result, i) => (
                                                    <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50/80 transition-all group-hover:px-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-black text-xs shadow-inner uppercase">
                                                                {result.subject.name.substring(0, 2)}
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-bold text-slate-800 font-sora block">{result.subject.name}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{result.remark || 'Standard Entry'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Score: {result.total}</p>
                                                                <p className={`text-xl font-black font-sora transition-colors ${result.total >= 70 ? 'text-emerald-500' : 'text-slate-800'}`}>
                                                                    {result.grade || "N/A"}
                                                                </p>
                                                            </div>
                                                            <div className={`h-12 w-1.5 rounded-full shadow-sm ${result.total >= 70 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-20 text-center space-y-4">
                                                    <div className="bg-slate-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-slate-300">
                                                        <AlertCircle className="h-8 w-8" />
                                                    </div>
                                                    <p className="text-slate-400 font-bold font-sora text-sm">No recorded results found</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-2 border-slate-100 border-dashed shadow-none rounded-[2.5rem] flex flex-col justify-center items-center p-12 bg-slate-50/30 group hover:bg-slate-50 hover:border-blue-200 transition-all duration-500 xl:col-span-2">
                                    <div className="p-6 rounded-[2rem] bg-white shadow-xl shadow-blue-500/10 text-blue-500 mb-8 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                                        <FileIcon className="h-12 w-12" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-xl font-sora mb-3">Academic Repository</h4>
                                    <p className="text-slate-500 text-sm text-center max-w-xs mb-8 font-medium leading-relaxed">
                                        Generate and download comprehensive terminals reports, transcript history and behavioral analysis logs.
                                    </p>
                                    <Button className="rounded-2xl font-bold bg-white text-slate-900 border border-slate-200 px-8 h-14 hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-xl shadow-black/5 transition-all w-full">
                                        Download Full Academic Resume
                                    </Button>
                                </Card>
                            </div>

                            {student.studentClass && student.studentClass.length > 1 && (
                                <section className="mt-12 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-orange-50 text-orange-500">
                                            <Bookmark className="h-4 w-4" />
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-lg font-sora">Legacy Tracking</h4>
                                    </div>
                                    <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-black/5 bg-white">
                                        <table className="min-w-full divide-y divide-slate-100">
                                            <thead className="bg-slate-50/50">
                                                <tr>
                                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Cycle</th>
                                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Classification</th>
                                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Index #</th>
                                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resolution</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {student.studentClass
                                                    .filter(sc => !(currentClass && sc.classId === currentClass.id && sc.sessionId === (currentSession?.id)))
                                                    .map((sc, index) => (
                                                        <tr key={index} className="hover:bg-slate-50/80 transition-all group">
                                                            <td className="px-8 py-6 text-sm font-bold text-slate-600">{sc.session?.name}</td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-slate-800 font-sora">{sc.class?.name}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{sc.class?.levelId}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-xs font-mono font-bold text-slate-500">{sc.rollNumber || "ID-000"}</td>
                                                            <td className="px-8 py-6 text-right">
                                                                <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[10px] tracking-widest py-1 px-3 rounded-lg">ARCHIVED</Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="attendance" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="p-8 border-none shadow-xl shadow-emerald-500/10 bg-emerald-50/50 rounded-[2rem] border-l-8 border-l-emerald-500 overflow-hidden relative">
                                    <CheckCircleIcon className="absolute -right-4 -bottom-4 h-24 w-24 text-emerald-100 -rotate-12" />
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Registry: Present</p>
                                    <div className="flex items-end gap-2 text-emerald-700">
                                        <p className="text-4xl font-extrabold font-sora leading-none">{attendanceStats.present}</p>
                                        <p className="text-sm font-bold opacity-60 uppercase mb-1">Accumulated</p>
                                    </div>
                                </Card>
                                <Card className="p-8 border-none shadow-xl shadow-rose-500/10 bg-rose-50/50 rounded-[2rem] border-l-8 border-l-rose-500 overflow-hidden relative">
                                    <XCircleIcon className="absolute -right-4 -bottom-4 h-24 w-24 text-rose-100 -rotate-12" />
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-4">Registry: Absent</p>
                                    <div className="flex items-end gap-2 text-rose-700">
                                        <p className="text-4xl font-extrabold font-sora leading-none">{attendanceStats.absent}</p>
                                        <p className="text-sm font-bold opacity-60 uppercase mb-1">Missed</p>
                                    </div>
                                </Card>
                                <Card className="p-8 border-none shadow-xl shadow-amber-500/10 bg-amber-50/50 rounded-[2rem] border-l-8 border-l-amber-500 overflow-hidden relative">
                                    <AlertCircle className="absolute -right-4 -bottom-4 h-24 w-24 text-amber-100 -rotate-12" />
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-4">Registry: Late</p>
                                    <div className="flex items-end gap-2 text-amber-700">
                                        <p className="text-4xl font-extrabold font-sora leading-none">{attendanceStats.late}</p>
                                        <p className="text-sm font-bold opacity-60 uppercase mb-1">Exceptions</p>
                                    </div>
                                </Card>
                            </div>

                            <AttendanceHeatMap attendance={student.attendance || []} />

                            <Card className="border-slate-100 shadow-xl shadow-black/5 rounded-[2.5rem] overflow-hidden bg-white">
                                <div className="bg-white border-b border-slate-100 flex flex-row items-center justify-between px-8 py-6">
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Dynamic Engagement Logs</CardTitle>
                                        <p className="text-xs text-slate-400 font-medium mt-1">Real-time daily arrival and departure tracking</p>
                                    </div>
                                </div>
                                <CardContent className="p-0 font-poppins">
                                    <div className="divide-y divide-slate-100 italic">
                                        {student.attendance && student.attendance.length > 0 ? (
                                            student.attendance.slice(0, 10).map((a, i) => (
                                                <div key={i} className="flex items-center justify-between p-6 px-8 hover:bg-slate-50/80 transition-all">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`h-3 w-3 rounded-full ${a.status === AttendanceStatus.PRESENT ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                            a.status === AttendanceStatus.ABSENT ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                                                'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                                            }`} />
                                                        <div>
                                                            <span className="text-sm font-bold text-slate-800 font-sora block">{formatDate(a.date)}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.remarks || 'Verified Entry'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-10">
                                                        <Badge className={`${a.status === AttendanceStatus.PRESENT ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
                                                            a.status === AttendanceStatus.ABSENT ? 'bg-rose-50 text-rose-600 border-rose-100/50' :
                                                                'bg-amber-50 text-amber-600 border-amber-100/50'
                                                            } border font-bold text-[10px] tracking-widest py-1.5 px-4 rounded-xl shadow-none uppercase`}>
                                                            {a.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-20 text-center space-y-4">
                                                <div className="bg-slate-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-slate-300">
                                                    <CalendarIcon className="h-8 w-8" />
                                                </div>
                                                <p className="text-slate-400 font-bold font-sora text-sm">No attendance records found</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="parents" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="space-y-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 font-sora tracking-tight">Kinship & Guardianship</h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1">Primary authorized contacts linked to this scholar profile</p>
                                </div>
                                <Button
                                    onClick={openParentsDialog}
                                    style={{ backgroundColor: "#4f46e5" }}
                                    className="hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/25 font-bold h-14 px-8 group transition-all"
                                >
                                    <UserPlus className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                                    Assign Legal Guardian
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                {student.parents && student.parents.length > 0 ? (
                                    student.parents.map((sp) => (
                                        <div key={sp.id} className="group relative overflow-hidden rounded-[3rem] border border-slate-100 bg-white p-10 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 duration-500">
                                            <div className="absolute top-0 right-0 p-8 transform translate-x-12 translate-y-[-100%] group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-12 w-12 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                    onClick={() => handleRemoveParent(sp.id)}
                                                >
                                                    <Trash2Icon className="h-5 w-5" />
                                                </Button>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-8">
                                                <div className="relative">
                                                    <Avatar className="h-32 w-32 rounded-[2.5rem] border-8 border-slate-50 shadow-inner group-hover:rotate-3 transition-transform duration-700">
                                                        <AvatarImage src={sp.parent?.profileImage || ""} className="object-cover" />
                                                        <AvatarFallback className="bg-indigo-50 text-indigo-500 font-black text-4xl font-sora">
                                                            {sp.parent?.name?.charAt(0) || "P"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl border-4 border-white shadow-lg">
                                                        <CheckCircleIcon className="h-5 w-5" />
                                                    </div>
                                                </div>

                                                <div className="flex-1 space-y-5">
                                                    <div>
                                                        <h4 className="text-2xl font-extrabold text-slate-800 font-sora leading-tight tracking-tight">{sp.parent?.name || "Unknown Guardian"}</h4>
                                                        <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] uppercase tracking-[0.2em] mt-3 px-4 py-1.5 rounded-full shadow-none italic">
                                                            LEGAL {sp.relation?.toUpperCase() || "GUARDIAN"}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-3 pt-2">
                                                        <div className="flex items-center gap-3 text-sm text-slate-600 font-bold group/item cursor-pointer">
                                                            <div className="p-2 rounded-xl bg-slate-50 group-hover/item:bg-blue-50 group-hover/item:text-blue-500 transition-colors">
                                                                <Mail className="h-4 w-4" />
                                                            </div>
                                                            {sp.parent?.email || "Email not provided"}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-slate-600 font-bold group/item cursor-pointer">
                                                            <div className="p-2 rounded-xl bg-slate-50 group-hover/item:bg-emerald-50 group-hover/item:text-emerald-500 transition-colors">
                                                                <Phone className="h-4 w-4" />
                                                            </div>
                                                            {sp.parent?.phone || "Voice not listed"}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-slate-600 font-bold group/item cursor-pointer">
                                                            <div className="p-2 rounded-xl bg-slate-50 group-hover/item:bg-amber-50 group-hover/item:text-amber-500 transition-colors">
                                                                <MapPin className="h-4 w-4" />
                                                            </div>
                                                            <span className="truncate">{sp.parent?.address?.slice(0, 35) || "Residential data pending"}...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-10 flex gap-4 pt-4 border-t border-slate-50">
                                                <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold border-slate-200 text-xs shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all font-sora">
                                                    View Profile
                                                </Button>
                                                <Button style={{ backgroundColor: "#4f46e5" }} className="flex-1 rounded-2xl h-12 font-bold text-white shadow-lg shadow-indigo-500/10 hover:opacity-90 transition-all font-sora">
                                                    Contact Guardian
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="xl:col-span-2 py-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200/50 group hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-700">
                                        <div className="flex flex-col items-center">
                                            <div className="p-8 bg-white rounded-[2.5rem] shadow-xl shadow-black/5 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
                                                <UsersIcon className="h-16 w-16 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                            </div>
                                            <h4 className="font-extrabold text-slate-800 text-2xl font-sora tracking-tight">Kinship Nexus Empty</h4>
                                            <p className="text-slate-500 font-bold mt-2 mb-10 max-w-sm mx-auto leading-relaxed">Enroll authorized legal guardians to enable critical notifications and real-time development tracking.</p>
                                            <Button
                                                onClick={openParentsDialog}
                                                style={{ backgroundColor: "#4f46e5" }}
                                                className="rounded-2xl h-14 px-10 font-black text-white shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all"
                                            >
                                                Initiate Linkage
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Existing deletion and linkage dialogs */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black font-sora text-slate-900 tracking-tight">Archival Confirmation</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-bold text-base leading-relaxed mt-4">
                            You are initiating the final deletion protocol for <span className="text-rose-600">{student.name}</span>. This procedure will permanently excise all behavioral logs, academic results, and attendance historical data from the active registry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-4 mt-8">
                        <AlertDialogCancel className="rounded-2xl h-14 px-8 border-slate-200 font-bold text-slate-500 hover:bg-slate-50">Abort Registry Deletion</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteStudent}
                            className="rounded-2xl h-14 px-8 bg-rose-500 hover:bg-rose-600 text-white font-black shadow-xl shadow-rose-500/20"
                            disabled={isDeleteLoading}
                        >
                            {isDeleteLoading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : null}
                            Confirm Permanent Expulsion
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isParentsDialogOpen} onOpenChange={setIsParentsDialogOpen}>
                <DialogContent className="sm:max-w-xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden font-poppins">
                    <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    
                    <div className="p-8 sm:p-10">

                    <DialogHeader>
                        <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 shadow-inner">
                            <UsersIcon className="h-8 w-8" />
                        </div>
                        <DialogTitle className="text-3xl font-black font-sora text-slate-900 tracking-tight">Delegate Guardian</DialogTitle>
                        <DialogDescription className="font-bold text-slate-500 text-lg leading-snug mt-2">
                            Connect a verified parent portal identity to this scholar for unified record management.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-10 my-10 relative">
                        <div className="space-y-3">
                            <Label htmlFor="parent" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Registry Search</Label>
                            <Select onValueChange={setSelectedParentId} value={selectedParentId}>
                                <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-indigo-500/20 px-6 font-bold text-slate-800 shadow-inner">
                                    <SelectValue placeholder="Search global parent directory..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-[2rem] border-slate-100 shadow-2xl p-2 max-h-[300px]">
                                    {availableParents.length > 0 ? (
                                        availableParents.map((p) => (
                                            <SelectItem key={p.id} value={p.id} className="rounded-xl py-4 group">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-10 w-10 shadow-sm border-2 border-white group-hover:scale-110 transition-transform">
                                                        <AvatarImage src={p.profileImage || ""} />
                                                        <AvatarFallback className="bg-slate-100 text-slate-500">{p.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-800 text-sm font-sora">{p.name}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.email}</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center space-y-3">
                                            <Search className="h-10 w-10 text-slate-200 mx-auto" />
                                            <p className="text-slate-400 font-bold text-sm">No compatible identities found</p>
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="relation" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Kinship Link</Label>
                            <Input
                                id="relation"
                                placeholder="e.g., Biological Mother / Primary Guardian"
                                className="h-16 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-indigo-500/20 px-6 font-bold text-slate-800 shadow-inner italic"
                                value={parentRelation}
                                onChange={(e) => setParentRelation(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            style={{ backgroundColor: "#4f46e5" }}
                            className="w-full rounded-2xl h-14 font-black text-white shadow-xl shadow-indigo-500/10 hover:opacity-90 transition-all font-sora text-sm uppercase tracking-wider group"
                            onClick={handleAddParent}
                            disabled={isParentLoading || !selectedParentId}
                        >
                            {isParentLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin mr-3" />
                            ) : (
                                <UserPlus className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                            )}
                            Finalize Linkage
                        </Button>
                    </DialogFooter>
                </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 