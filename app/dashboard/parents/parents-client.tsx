"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, type ParentColumn } from "./columns";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ParentForm from "./parent-form";
import { useRouter } from "next/navigation";

interface ParentsClientProps {
    parents: ParentColumn[];
}

export function ParentsClient({ parents }: ParentsClientProps) {
    const [showAddModal, setShowAddModal] = useState(false);
    const router = useRouter();

    const handleSuccess = () => {
        setShowAddModal(false);
        router.refresh();
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Parents Directory</h2>
                    <p className="text-muted-foreground">
                        Create, manage, and link parent accounts to students
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Parent
                    </Button>
                </div>
            </div>
            <DataTable columns={columns} data={parents} searchKey="name" />

            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Parent</DialogTitle>
                    </DialogHeader>
                    <ParentForm onSuccess={handleSuccess} />
                </DialogContent>
            </Dialog>
        </div>
    );
} 