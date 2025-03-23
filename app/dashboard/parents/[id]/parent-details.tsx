"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import ParentModal from "../parent-modal";
import Link from "next/link";
import { Pencil, Trash, UserPlus, Search } from "lucide-react";

type ChildrenType = {
    id: string;
    name: string;
    class: string;
    relation: string;
    linkId: string;
};

type StudentType = {
    id: string;
    name: string;
    class: string;
};

interface ParentDetailsProps {
    parent: any;
    children: ChildrenType[];
    availableStudents: StudentType[];
    canManage: boolean;
}

export default function ParentDetails({
    parent,
    children,
    availableStudents,
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

    // Filter students based on search term
    const filteredStudents = useMemo(() => {
        return availableStudents.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.class.toLowerCase().includes(searchTerm.toLowerCase())
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
            // Use parent-students endpoint to link multiple students at once
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
    const handleUnlinkStudent = async (linkId: string) => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/parent-students/${linkId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to unlink student");
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

            {/* Children/Students Tab */}
            <Tabs defaultValue="children">
                <TabsList>
                    <TabsTrigger value="children">Children</TabsTrigger>
                </TabsList>
                <TabsContent value="children">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Children</CardTitle>
                            {canManage && availableStudents.length > 0 && (
                                <Dialog open={showLinkDialog} onOpenChange={handleDialogChange}>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Link Students
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[600px]">
                                        <DialogHeader>
                                            <DialogTitle>Link Students to Parent</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search students by name or class"
                                                    className="pl-8"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Relation (Applied to all selected students)</Label>
                                                <Input
                                                    placeholder="e.g. Father, Mother, Guardian"
                                                    value={relation}
                                                    onChange={(e) => setRelation(e.target.value)}
                                                />
                                            </div>

                                            <div className="border rounded-md overflow-hidden">
                                                <div className="p-2 bg-muted font-medium">
                                                    Available Students ({filteredStudents.length})
                                                </div>
                                                <div className="divide-y max-h-[300px] overflow-auto">
                                                    {filteredStudents.length > 0 ? (
                                                        filteredStudents.map((student) => (
                                                            <div key={student.id} className="flex items-center p-2 hover:bg-muted/50">
                                                                <Checkbox
                                                                    id={`student-${student.id}`}
                                                                    checked={selectedStudents.includes(student.id)}
                                                                    onCheckedChange={() => handleStudentToggle(student.id)}
                                                                    className="mr-2"
                                                                />
                                                                <Label
                                                                    htmlFor={`student-${student.id}`}
                                                                    className="flex-1 cursor-pointer flex items-center justify-between"
                                                                >
                                                                    <span>{student.name}</span>
                                                                    <span className="text-sm text-muted-foreground">{student.class}</span>
                                                                </Label>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-center text-muted-foreground">
                                                            {searchTerm ? "No students match your search" : "No available students"}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {selectedStudents.length > 0 && (
                                                <div className="text-sm font-medium">
                                                    {selectedStudents.length} student(s) selected
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDialogChange(false)}
                                                disabled={loading}
                                            >
                                                Cancel
                                            </Button>
                                            <Button onClick={handleLinkStudents} disabled={loading || selectedStudents.length === 0}>
                                                {loading ? "Linking..." : "Link Selected Students"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardHeader>
                        <CardContent>
                            {children.length > 0 ? (
                                <div className="divide-y">
                                    {children.map((child) => (
                                        <div
                                            key={child.id}
                                            className="py-4 flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="font-medium">{child.name}</p>
                                                <div className="text-sm text-muted-foreground">
                                                    <p>Class: {child.class}</p>
                                                    <p>Relation: {child.relation}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link href={`/dashboard/students/${child.id}`}>
                                                        View
                                                    </Link>
                                                </Button>
                                                {canManage && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleUnlinkStudent(child.linkId)}
                                                        disabled={loading}
                                                    >
                                                        Unlink
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No children linked to this parent.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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
        </div>
    );
} 