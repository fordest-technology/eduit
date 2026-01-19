"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { Pencil, Trash, UserPlus, Search, Loader2, Users, Mail, Phone, School, Shield, Calendar, User, MapPin, Briefcase, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentData {
    id: string;
    name: string;
    class: string;
    enrollmentDate?: string;
    profileImage?: string | null;
}

interface Parent {
    id: string;
    name: string;
    email: string;
    profileImage?: string | null;
    phone?: string | null;
    alternatePhone?: string | null;
    occupation?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    schoolId?: string | null;
    status?: "active" | "inactive";
    joinDate?: string;
}

interface ParentChild {
    id: string;
    name: string;
    class: string;
    relation: string;
    linkId: string;
    isPrimary?: boolean;
    profileImage?: string | null;
    enrollmentDate?: string;
}

interface ParentDetailsProps {
    parent: Parent;
    children: ParentChild[];
    availableStudents: StudentData[];
    canManage: boolean;
}

interface EditParentFormData {
    name: string;
    email: string;
    phone: string;
    alternatePhone: string;
    occupation: string;
    address: string;
    city: string;
    state: string;
    country: string;
    status: "active" | "inactive";
}

export default function ParentDetails({
    parent,
    children,
    availableStudents,
    canManage
}: ParentDetailsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedRelation, setSelectedRelation] = useState("");
    const [isPrimary, setIsPrimary] = useState(false);
    const [studentToUnlink, setStudentToUnlink] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [editFormData, setEditFormData] = useState<EditParentFormData>({
        name: parent.name,
        email: parent.email,
        phone: parent.phone || "",
        alternatePhone: parent.alternatePhone || "",
        occupation: parent.occupation || "",
        address: parent.address || "",
        city: parent.city || "",
        state: parent.state || "",
        country: parent.country || "",
        status: parent.status || "active"
    });

    // Filter available students based on search query
    const filteredStudents = useMemo(() => {
        return availableStudents.filter(student =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.class.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [availableStudents, searchQuery]);

    // Handle linking a student to the parent
    const handleLinkStudent = async () => {
        if (!selectedStudent || !selectedRelation) {
            toast.error("Please select a student and specify the relation");
            return;
        }

        if (selectedRelation.trim().length < 3) {
            toast.error("Please enter a valid relation (minimum 3 characters)");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/parents/${parent.id}/students`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    studentId: selectedStudent,
                    relation: selectedRelation.trim(),
                    isPrimary,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to link student");
            }

            toast.success("Student linked successfully");
            setShowLinkDialog(false);
            setSelectedStudent("");
            setSelectedRelation("");
            setIsPrimary(false);
            setSearchQuery("");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to link student. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle unlinking a student from the parent
    const handleUnlinkStudent = async () => {
        if (!studentToUnlink) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/parents/${parent.id}/students/${studentToUnlink}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to unlink student");
            }

            toast.success("Student unlinked successfully");
            setShowUnlinkDialog(false);
            setStudentToUnlink(null);
            router.refresh();
        } catch (error) {
            toast.error("Failed to unlink student. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle deleting the parent account
    const handleDeleteParent = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/parents/${parent.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete parent");
            }

            toast.success("Parent account deleted successfully");
            router.push("/dashboard/parents");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete parent. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle editing parent details
    const handleEditParent = async () => {
        if (!editFormData.name.trim() || !editFormData.email.trim()) {
            toast.error("Name and email are required");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editFormData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/parents/${parent.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: editFormData.name.trim(),
                    email: editFormData.email.trim(),
                    phone: editFormData.phone.trim() || null,
                    alternatePhone: editFormData.alternatePhone.trim() || null,
                    occupation: editFormData.occupation.trim() || null,
                    address: editFormData.address.trim() || null,
                    city: editFormData.city.trim() || null,
                    state: editFormData.state.trim() || null,
                    country: editFormData.country.trim() || null,
                    status: editFormData.status,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to update parent");
            }

            toast.success("Parent details updated successfully");
            setShowEditDialog(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update parent. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

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
                        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary-foreground/20" />
                        <CardContent className="pt-0 -mt-12 px-6 pb-6">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 border-4 border-white shadow-lg ring-2 ring-primary/5">
                                    <AvatarImage src={parent.profileImage || undefined} alt={parent.name} />
                                    <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                                        {parent.name.split(" ").map((n) => n[0]).join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="mt-4 space-y-1">
                                    <h3 className="text-2xl font-bold tracking-tight">{parent.name}</h3>
                                    <Badge variant={parent.status === "active" ? "default" : "secondary"} className="mt-1">
                                        {parent.status || "Active"}
                                    </Badge>
                                </div>

                                <div className="w-full mt-6 space-y-3">
                                    <div className="flex items-center p-3 rounded-xl bg-white/50 border border-slate-100 hover:border-primary/20 transition-colors">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                                            <Mail className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <p className="text-[10px] uppercase font-semibold text-slate-400">Email Address</p>
                                            <p className="text-sm font-medium truncate">{parent.email}</p>
                                        </div>
                                    </div>

                                    {parent.phone && (
                                        <div className="flex items-center p-3 rounded-xl bg-white/50 border border-slate-100 hover:border-primary/20 transition-colors">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center mr-3">
                                                <Phone className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div className="text-left overflow-hidden">
                                                <p className="text-[10px] uppercase font-semibold text-slate-400">Phone Number</p>
                                                <p className="text-sm font-medium">{parent.phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    {parent.occupation && (
                                        <div className="flex items-center p-3 rounded-xl bg-white/50 border border-slate-100 hover:border-primary/20 transition-colors">
                                            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center mr-3">
                                                <Briefcase className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div className="text-left overflow-hidden">
                                                <p className="text-[10px] uppercase font-semibold text-slate-400">Occupation</p>
                                                <p className="text-sm font-medium truncate">{parent.occupation}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {canManage && (
                                    <div className="grid grid-cols-2 gap-3 w-full mt-8">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowEditDialog(true)}
                                            className="w-full rounded-xl hover:bg-slate-50 group"
                                        >
                                            <Pencil className="mr-2 h-4 w-4 text-slate-400 group-hover:text-primary" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowDeleteDialog(true)}
                                            className="w-full rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 group"
                                        >
                                            <Trash className="mr-2 h-4 w-4 text-slate-400 group-hover:text-red-500" />
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card className="border-none shadow-lg bg-slate-900 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users className="h-24 w-24" />
                        </div>
                        <CardContent className="p-6">
                            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Quick Insights</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-2xl font-bold">{children.length}</p>
                                    <p className="text-slate-400 text-xs mt-1">Linked Children</p>
                                </div>
                                {parent.joinDate && (
                                    <div>
                                        <p className="text-sm font-medium">{new Date(parent.joinDate).getFullYear()}</p>
                                        <p className="text-slate-400 text-xs mt-1">Join Year</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="children" className="w-full">
                        <TabsList className="bg-slate-100/50 p-1 mb-6 rounded-2xl h-12 w-full sm:w-auto">
                            <TabsTrigger value="children" className="rounded-xl px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Users className="h-4 w-4 mr-2" />
                                Linked Students
                            </TabsTrigger>
                            <TabsTrigger value="details" className="rounded-xl px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <Shield className="h-4 w-4 mr-2" />
                                Information
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="children" className="mt-0 focus-visible:outline-none">
                            <Card className="border-none shadow-xl min-h-[400px]">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">Students Linked to Account</CardTitle>
                                    {canManage && (
                                        <Button
                                            size="sm"
                                            className="rounded-xl bg-slate-900 hover:bg-slate-800"
                                            onClick={() => setShowLinkDialog(true)}
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Link New Student
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <AnimatePresence mode="popLayout">
                                        {children.length === 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex flex-col items-center justify-center py-20 text-center"
                                            >
                                                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                                    <Users className="h-10 w-10 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900">No students connected</h3>
                                                <p className="text-slate-500 max-w-xs mx-auto mt-2">
                                                    Connect students to this parent account to manage their school records and fees.
                                                </p>
                                            </motion.div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {children.map((child, idx) => (
                                                    <motion.div
                                                        key={child.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="group p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-md transition-all duration-300 relative"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="h-12 w-12 rounded-xl ring-2 ring-slate-100">
                                                                <AvatarImage src={child.profileImage || undefined} alt={child.name} />
                                                                <AvatarFallback className="bg-slate-50 rounded-xl">
                                                                    {child.name.split(" ").map(n => n[0]).join("")}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-semibold text-slate-900 truncate">{child.name}</p>
                                                                    {child.isPrimary && (
                                                                        <Badge variant="secondary" className="bg-slate-100 text-[10px] h-4 px-1.5 border-none">
                                                                            Primary
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-slate-500 font-medium">{child.class}</p>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                <Shield className="h-3 w-3 mr-1" />
                                                                {child.relation}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Link href={`/dashboard/children/${child.id}`}>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-50">
                                                                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                                                                    </Button>
                                                                </Link>
                                                                {canManage && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500"
                                                                        onClick={() => {
                                                                            setStudentToUnlink(child.linkId);
                                                                            setShowUnlinkDialog(true);
                                                                        }}
                                                                    >
                                                                        <Trash className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="details" className="mt-0 focus-visible:outline-none">
                            <Card className="border-none shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-lg">Personal & Contact Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                                    <MapPin className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Address</p>
                                                    <p className="text-sm font-medium mt-0.5">{parent.address || "No address provided"}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pl-13">
                                                {parent.city && <Badge variant="secondary" className="bg-slate-50 border-none">{parent.city}</Badge>}
                                                {parent.state && <Badge variant="secondary" className="bg-slate-50 border-none">{parent.state}</Badge>}
                                                {parent.country && <Badge variant="secondary" className="bg-slate-50 border-none">{parent.country}</Badge>}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                                    <Mail className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Communication</p>
                                                    <div className="space-y-1 mt-1">
                                                        <p className="text-sm font-medium">{parent.email}</p>
                                                        {parent.alternatePhone && <p className="text-sm text-slate-500">{parent.alternatePhone} (Alt)</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-100" />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Status</p>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-2 w-2 rounded-full", parent.status === "active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
                                                <span className="text-sm font-semibold capitalize">{parent.status || "Active"}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Member Since</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-primary/60" />
                                                <span className="text-sm font-semibold">
                                                    {parent.joinDate ? new Date(parent.joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Linked School</p>
                                            <div className="flex items-center gap-2">
                                                <School className="h-4 w-4 text-primary/60" />
                                                <span className="text-sm font-semibold truncate">Ref: {parent.schoolId?.slice(-8) || "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Link Student Sheet */}
            <Sheet open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                <SheetContent className="sm:max-w-md w-full overflow-y-auto" side="right">
                    <SheetHeader>
                        <SheetTitle>Link Student</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search students by name or class..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[200px] rounded-md border p-2">
                            <div className="space-y-2">
                                {filteredStudents.length === 0 ? (
                                    <div className="text-center py-4 text-sm text-muted-foreground">
                                        No students found
                                    </div>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <div
                                            key={student.id}
                                            className={cn(
                                                "flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                                                selectedStudent === student.id && "bg-muted"
                                            )}
                                            onClick={() => setSelectedStudent(student.id)}
                                        >
                                            <input
                                                type="radio"
                                                id={student.id}
                                                name="student"
                                                value={student.id}
                                                checked={selectedStudent === student.id}
                                                onChange={(e) => setSelectedStudent(e.target.value)}
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={student.id} className="flex-1 cursor-pointer">
                                                <div className="font-medium">{student.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {student.class}
                                                    {student.enrollmentDate && (
                                                        <>
                                                            <span className="mx-2">•</span>
                                                            Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}
                                                        </>
                                                    )}
                                                </div>
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                        <div className="space-y-2">
                            <Label htmlFor="relation">Relation</Label>
                            <Input
                                id="relation"
                                placeholder="e.g., Father, Mother, Guardian"
                                value={selectedRelation}
                                onChange={(e) => setSelectedRelation(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="primary"
                                checked={isPrimary}
                                onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
                            />
                            <Label htmlFor="primary" className="text-sm">
                                Set as primary guardian
                            </Label>
                        </div>
                    </div>
                    <SheetFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowLinkDialog(false);
                                setSelectedStudent("");
                                setSelectedRelation("");
                                setIsPrimary(false);
                                setSearchQuery("");
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLinkStudent}
                            disabled={isLoading || !selectedStudent || !selectedRelation.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Linking...
                                </>
                            ) : (
                                "Link Student"
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Unlink Student Dialog */}
            <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unlink Student</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unlink this student from the parent? This action cannot be undone.
                            {children.find(c => c.linkId === studentToUnlink)?.isPrimary && (
                                <p className="mt-2 text-destructive">
                                    Warning: This student is set as the primary guardian's child.
                                </p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleUnlinkStudent}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Unlinking...
                                </>
                            ) : (
                                "Unlink Student"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Parent Sheet */}
            <Sheet open={showEditDialog} onOpenChange={setShowEditDialog}>
                <SheetContent className="sm:max-w-[600px] w-full overflow-y-auto" side="right">
                    <SheetHeader>
                        <SheetTitle>Edit Parent Details</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter parent's name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter parent's email"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Primary Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Enter primary phone number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="alternatePhone">Alternate Phone</Label>
                                <Input
                                    id="alternatePhone"
                                    type="tel"
                                    value={editFormData.alternatePhone}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, alternatePhone: e.target.value }))}
                                    placeholder="Enter alternate phone number"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="occupation">Occupation</Label>
                            <Input
                                id="occupation"
                                value={editFormData.occupation}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, occupation: e.target.value }))}
                                placeholder="Enter parent's occupation"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={editFormData.address}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Enter parent's address"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={editFormData.city}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, city: e.target.value }))}
                                    placeholder="Enter city"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={editFormData.state}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, state: e.target.value }))}
                                    placeholder="Enter state"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={editFormData.country}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                                    placeholder="Enter country"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={editFormData.status}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as "active" | "inactive" }))}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <SheetFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEditDialog(false);
                                setEditFormData({
                                    name: parent.name,
                                    email: parent.email,
                                    phone: parent.phone || "",
                                    alternatePhone: parent.alternatePhone || "",
                                    occupation: parent.occupation || "",
                                    address: parent.address || "",
                                    city: parent.city || "",
                                    state: parent.state || "",
                                    country: parent.country || "",
                                    status: parent.status || "active"
                                });
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditParent}
                            disabled={isLoading || !editFormData.name.trim() || !editFormData.email.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete Parent Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Parent Account</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this parent account? This action cannot be undone.
                            {children.length > 0 && (
                                <p className="mt-2 text-destructive">
                                    Warning: This will remove links to {children.length} student{children.length !== 1 ? 's' : ''}.
                                </p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteParent}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Parent"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
} 