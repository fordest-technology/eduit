"use client";

import { DataTable } from "@/components/ui/data-table";
import { columns, type ParentColumn } from "./columns";
import ParentModal from "./parent-modal";

interface ParentsClientProps {
    parents: ParentColumn[];
}

export default function ParentsClient({ parents }: ParentsClientProps) {
    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Parents</h1>
                <ParentModal />
            </div>

            <DataTable
                columns={columns}
                data={parents}
                searchKey="name"
                searchPlaceholder="Search parents..."
            />
        </>
    );
} 