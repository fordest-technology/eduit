"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, type ParentColumn } from "./columns";
import { Plus } from "lucide-react";
import { AddParentModal } from "./add-parent-modal";
import { useRouter } from "next/navigation";
import { Parent } from "./types";

export interface ParentsClientProps {
    parents: ParentColumn[];
    stats: any; // Define a proper type for stats if available
    error?: string;
}

export function ParentsClient({ parents: initialParents, stats, error }: ParentsClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
    const router = useRouter();

    const fetchParents = () => {
        router.refresh(); // Or a soft refetch
    };

    const handleAddOrEdit = (parent: ParentColumn | null) => {
        // Convert ParentColumn to Parent if needed
        if (parent) {
            const parentData: Parent = {
                id: parent.id,
                name: parent.name,
                email: parent.email,
                profileImage: parent.profileImage,
                phone: parent.phone,
                alternatePhone: parent.alternatePhone,
                occupation: parent.occupation
            };
            setSelectedParent(parentData);
        } else {
            setSelectedParent(null);
        }
        setIsAddModalOpen(true);
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
                    <Button onClick={() => handleAddOrEdit(null)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Parent
                    </Button>
                </div>
            </div>
            <DataTable
                columns={columns({
                    onEdit: handleAddOrEdit
                })}
                data={initialParents}
                searchKey="name"
            />

            {/* The Sheet component is now directly used in AddParentModal */}
            <AddParentModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                parentToEdit={selectedParent}
                onSuccess={fetchParents}
            />
        </div>
    );
} 