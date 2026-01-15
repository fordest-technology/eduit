"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Shield, Pencil, Trash2, Key } from "lucide-react";
import { AddAdminModal } from "./add-admin-modal";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { PERMISSION_GROUPS } from "@/lib/permissions";

interface AdminManagementProps {
    initialAdmins: any[];
    currentUserRole: string;
}

export function AdminManagement({ initialAdmins, currentUserRole }: AdminManagementProps) {
    const [admins, setAdmins] = useState(initialAdmins);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<any>(null);

    const handleDelete = async (adminId: string) => {
        if (!confirm("Are you sure you want to remove this administrator?")) return;

        try {
            const response = await fetch(`/api/users/${adminId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setAdmins(admins.filter((a) => a.id !== adminId));
                toast.success("Administrator removed successfully");
            } else {
                toast.error("Failed to remove administrator");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const getPermissionCount = (permissions: any) => {
        if (!permissions) return 0;
        if (Array.isArray(permissions)) return permissions.length;
        if (typeof permissions === 'object') {
            return Object.values(permissions).filter(v => v === true).length;
        }
        return 0;
    };

    const getTotalAvailablePermissions = () => {
        return PERMISSION_GROUPS.reduce((acc, group) => acc + group.permissions.length, 0);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    School Administrators
                </h2>
                <Button onClick={() => { setEditingAdmin(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Administrator
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No administrators found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                admins.map((admin) => (
                                    <TableRow key={admin.id}>
                                        <TableCell className="font-medium">{admin.name}</TableCell>
                                        <TableCell>{admin.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {getPermissionCount(admin.admin?.permissions)} / {getTotalAvailablePermissions()} Permissions
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                                Active
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setEditingAdmin(admin); setIsModalOpen(true); }}
                                                >
                                                    <Key className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setEditingAdmin(admin); setIsModalOpen(true); }}
                                                >
                                                    <Pencil className="h-4 w-4 text-gray-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(admin.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AddAdminModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                admin={editingAdmin}
                onSuccess={() => {
                    // Re-fetch or update list (simpler to refresh for now or use the return from modal)
                    window.location.reload();
                }}
            />
        </div>
    );
}
