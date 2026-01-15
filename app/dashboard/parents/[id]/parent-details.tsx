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
import { Pencil, Trash, UserPlus, Search, Loader2, Users, Mail, Phone, School, Shield, Calendar, User } from "lucide-react";
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
        <div className="space-y-6">
            {/* Parent Information Card */}
            <Card className="shadow-sm hover:shadow transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-xl font-bold">Parent Information</CardTitle>
                        <CardDescription>View and manage parent details</CardDescription>
                    </div>
                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowEditDialog(true)}
                                className="hover:bg-muted/50"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowDeleteDialog(true)}
                                className="hover:bg-destructive/90"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col lg:flex-row items-start gap-6">
                        {/* Profile Section */}
                        <div className="flex flex-col items-center lg:items-start gap-4">
                            <Avatar className="h-24 w-24 border-2 border-primary/20 ring-2 ring-primary/10 ring-offset-2">
                                <AvatarImage src={parent.profileImage || undefined} alt={parent.name} />
                                <AvatarFallback className="text-lg bg-primary/10">
                                    {parent.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center lg:text-left">
                                <h3 className="text-2xl font-semibold">{parent.name}</h3>
                                <div className="flex flex-col sm:flex-row gap-3 mt-2">
                                    <div className="flex items-center justify-center lg:justify-start text-muted-foreground hover:text-foreground transition-colors">
                                        <Mail className="h-4 w-4 mr-2" />
                                        <a href={`mailto:${parent.email}`} className="hover:underline">
                                            {parent.email}
                                        </a>
                                    </div>
                                    {parent.phone && (
                                        <div className="flex items-center justify-center lg:justify-start text-muted-foreground hover:text-foreground transition-colors">
                                            <Phone className="h-4 w-4 mr-2" />
                                            <a href={`tel:${parent.phone}`} className="hover:underline">
                                                {parent.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="flex-1 space-y-4">
                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h4>
                                    <div className="space-y-2">
                                        {parent.phone && (
                                            <div className="flex items-center text-sm">
                                                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span className="font-medium">Primary:</span>
                                                <span className="ml-2">{parent.phone}</span>
                                            </div>
                                        )}
                                        {parent.alternatePhone && (
                                            <div className="flex items-center text-sm">
                                                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span className="font-medium">Alternate:</span>
                                                <span className="ml-2">{parent.alternatePhone}</span>
                                            </div>
                                        )}
                                        {parent.occupation && (
                                            <div className="flex items-center text-sm">
                                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span className="font-medium">Occupation:</span>
                                                <span className="ml-2">{parent.occupation}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Address Information */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Address</h4>
                                    <div className="space-y-1 text-sm">
                                        {parent.address && (
                                            <p className="text-muted-foreground">{parent.address}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {parent.city && (
                                                <Badge variant="outline" className="text-xs">
                                                    {parent.city}
                                                </Badge>
                                            )}
                                            {parent.state && (
                                                <Badge variant="outline" className="text-xs">
                                                    {parent.state}
                                                </Badge>
                                            )}
                                            {parent.country && (
                                                <Badge variant="outline" className="text-xs">
                                                    {parent.country}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status and Stats */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                                <Badge variant={parent.status === "active" ? "default" : "secondary"}>
                                    {parent.status || "Active"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    {children.length} {children.length === 1 ? 'Child' : 'Children'}
                                </Badge>
                                {parent.joinDate && (
                                    <Badge variant="outline" className="text-xs">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Joined {new Date(parent.joinDate).toLocaleDateString()}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Children Section */}
            <Card className="shadow-sm hover:shadow transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle>Children</CardTitle>
                        <CardDescription>Manage linked students</CardDescription>
                    </div>
                    {canManage && (
                        <Button
                            onClick={() => setShowLinkDialog(true)}
                            size="sm"
                            className="hover:bg-primary/90"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Link Student
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {children.length === 0 ? (
                        <div className="text-center py-10 bg-muted/10 rounded-lg border-2 border-dashed">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-sm font-semibold text-muted-foreground">
                                No children linked
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {canManage
                                    ? "Start by linking a student to this parent."
                                    : "This parent has no linked students."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {children.map((child) => (
                                <div
                                    key={child.id}
                                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                                >
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-2">
                                            <AvatarImage src={child.profileImage || undefined} alt={child.name} />
                                            <AvatarFallback className="bg-primary/10">
                                                {child.name.split(" ").map((n) => n[0]).join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{child.name}</p>
                                                {child.isPrimary && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        Primary
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <School className="h-3 w-3" />
                                                {child.class}
                                                <Separator orientation="vertical" className="h-3" />
                                                {child.relation}
                                                {child.enrollmentDate && (
                                                    <>
                                                        <Separator orientation="vertical" className="h-3" />
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(child.enrollmentDate).toLocaleDateString()}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {canManage && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setStudentToUnlink(child.linkId);
                                                setShowUnlinkDialog(true);
                                            }}
                                            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                                        >
                                            <Trash className="h-4 w-4" />
                                            <span className="sr-only">Unlink {child.name}</span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

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
        </div>
    );
} 