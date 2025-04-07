"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import ParentModal from "../parent-modal";
import Link from "next/link";
import { Pencil, Trash, UserPlus, Search, Loader2, Users } from "lucide-react";

type ChildrenType = {
    id: string;
    name: string;
    class: string;
    relation: string;
    linkId: string;
};

interface StudentType {
    id: string;
    name: string;
    class: string;
    profileImage?: string;
}

interface ParentDetailsProps {
    parent: any;
    children: ChildrenType[];
    availableStudents: StudentType[];
    canManage: boolean;
}

export default function ParentDetails({
    parent,
    children,
    availableStudents: initialAvailableStudents,
    canManage,
}: ParentDetailsProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [relation, setRelation] = useState<string>("");
    const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
    const [studentToUnlink, setStudentToUnlink] = useState<ChildrenType | null>(null);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [availableStudents, setAvailableStudents] = useState<StudentType[]>(initialAvailableStudents || []);

    // Filter students based on search term
    const filteredStudents = useMemo(() => {
        if (!availableStudents || availableStudents.length === 0) return [];
        return availableStudents.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.class && student.class.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [availableStudents, searchTerm]);

    // Handle delete parent
    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/parents/${parent.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete parent");
            }

            toast({
                title: "Parent deleted",
                description: "Parent was deleted successfully",
            });

            router.push("/dashboard/parents");
            router.refresh();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete parent",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
        }
    };

    // Handle student selection
    const handleStudentToggle = (studentId: string) => {
        setSelectedStudents(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };

    // Handle opening the link dialog
    const handleOpenLinkDialog = async () => {
        setIsLoadingStudents(true);
        try {
            // Refresh available students
            const response = await fetch(`/api/parents/${parent.id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch available students");
            }
            const data = await response.json();

            // Set the available students from the response
            if (data.availableStudents && Array.isArray(data.availableStudents)) {
                setAvailableStudents(data.availableStudents);
            } else {
                console.error("Invalid available students data:", data);
                throw new Error("Invalid response format from server");
            }

            setShowLinkDialog(true);
        } catch (error) {
            console.error("Error fetching available students:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to load available students",
                variant: "destructive",
            });
            setAvailableStudents([]); // Reset available students on error
        } finally {
            setIsLoadingStudents(false);
        }
    };

    // Handle link students to parent
    const handleLinkStudents = async () => {
        if (selectedStudents.length === 0) {
            toast({
                title: "Error",
                description: "Please select at least one student",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/parent-students`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    parentId: parent.id,
                    studentIds: selectedStudents,
                    relation: relation || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to link students");
            }

            toast({
                title: "Success",
                description: `${selectedStudents.length} student(s) linked successfully`,
            });

            setShowLinkDialog(false);
            setSelectedStudents([]);
            setRelation("");
            setSearchTerm("");
            router.refresh();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to link students",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle unlink student
    const handleUnlinkStudent = async (student: ChildrenType) => {
        setStudentToUnlink(student);
        setShowUnlinkDialog(true);
    };

    const confirmUnlinkStudent = async () => {
        if (!studentToUnlink) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/parent-students/${studentToUnlink.linkId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to unlink student');
            }

            toast({
                title: "Success",
                description: "Student unlinked successfully",
            });

            router.refresh();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to unlink student",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setShowUnlinkDialog(false);
            setStudentToUnlink(null);
        }
    };

    // Reset modal state when opened/closed
    const handleDialogChange = (open: boolean) => {
        setShowLinkDialog(open);
        if (!open) {
            setSelectedStudents([]);
            setRelation("");
            setSearchTerm("");
        }
    };

    return (
        <div className="space-y-6">
            {/* Parent Information Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Parent Information</CardTitle>
                    {canManage && (
                        <div className="flex space-x-2">
                            <ParentModal
                                parent={parent}
                                trigger={
                                    <Button variant="outline" size="icon">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                }
                                onSuccess={() => router.refresh()}
                            />
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => setIsDeleteDialogOpen(true)}
                                disabled={loading}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex flex-col items-center">
                            <Avatar className="w-24 h-24 mb-2">
                                <AvatarImage src={parent.profileImage || ""} alt={parent.name} />
                                <AvatarFallback className="text-lg">
                                    {parent.name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                                    <p className="text-base">{parent.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <p className="text-base">{parent.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                                    <p className="text-base">{parent.phone || "Not provided"}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Children</p>
                                    <p className="text-base">{children.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Children List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Linked Students</CardTitle>
                    {canManage && (
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowLinkDialog(true)}
                                disabled={loading}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Link Student
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {children.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Users className="h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No students linked to this parent</p>
                            {/* {canManage && ( */}
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setShowLinkDialog(true)}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Link a Student
                            </Button>
                            {/* )} */}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {children.map((child) => (
                                <div
                                    key={child.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {child.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{child.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {child.class} • {child.relation}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={`/dashboard/students/${child.id}`}>
                                                <Users className="h-4 w-4 mr-2" />
                                                View Student
                                            </Link>
                                        </Button>
                                        {/* {canManage && ( */}
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleUnlinkStudent(child)}
                                            disabled={loading}
                                        >
                                            <Trash className="h-4 w-4 mr-2" />
                                            Unassign Student
                                        </Button>
                                        {/* )} */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete this parent and all associated
                            records. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {loading ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unlink Confirmation Dialog */}
            <AlertDialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unassign Student</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to unassign {studentToUnlink?.name} from this parent?
                            This will remove the parent-student relationship and cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmUnlinkStudent}
                            disabled={loading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Unassigning...
                                </>
                            ) : (
                                "Unassign Student"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Link Student Dialog */}
            <Dialog open={showLinkDialog} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Link Students</DialogTitle>
                        <DialogDescription>
                            Select students to link with this parent
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Search Students</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Search by name or class..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={loading || isLoadingStudents}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="relation">Relation (Optional)</Label>
                                <Input
                                    id="relation"
                                    placeholder="e.g. Father, Mother, Guardian"
                                    value={relation}
                                    onChange={(e) => setRelation(e.target.value)}
                                    disabled={loading || isLoadingStudents}
                                />
                            </div>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {isLoadingStudents ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : filteredStudents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-4 text-center">
                                        <Users className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            {searchTerm ? "No students found matching your search" : "No available students found"}
                                        </p>
                                    </div>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <div
                                            key={student.id}
                                            className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-accent"
                                        >
                                            <Checkbox
                                                id={`student-${student.id}`}
                                                checked={selectedStudents.includes(student.id)}
                                                onCheckedChange={() => handleStudentToggle(student.id)}
                                                disabled={loading || isLoadingStudents}
                                            />
                                            <Label htmlFor={`student-${student.id}`} className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <Avatar>
                                                        <AvatarImage src={student.profileImage} />
                                                        <AvatarFallback>
                                                            {student.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{student.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {student.class || 'No class assigned'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowLinkDialog(false)}
                            disabled={loading || isLoadingStudents}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLinkStudents}
                            disabled={loading || isLoadingStudents || selectedStudents.length === 0}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Linking...
                                </>
                            ) : (
                                "Link Students"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 