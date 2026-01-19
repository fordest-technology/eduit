"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, type ParentColumn } from "./columns";
import { Plus, Users, GraduationCap, School, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DashboardStatsCard, DashboardStatsGrid } from "@/components/dashboard-stats-card";
import { toast } from "sonner";
import { AddParentModal } from "./add-parent-modal";
import { useRouter } from "next/navigation";
import { Parent } from "./types";

export interface ParentStats {
    total: number
    withStudents: number
    occupations: number
}

export interface ParentsClientProps {
    parents: ParentColumn[];
    stats: ParentStats;
    error?: string;
}

export function ParentsClient({ parents: initialParents, stats, error: initialError }: ParentsClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredParents, setFilteredParents] = useState<ParentColumn[]>(initialParents);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let filtered = [...initialParents];
        if (searchQuery) {
            filtered = filtered.filter(parent => 
                parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                parent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (parent.phone || "").includes(searchQuery)
            );
        }
        setFilteredParents(filtered);
    }, [searchQuery, initialParents]);

    const handleSuccess = async () => {
        setIsLoading(true);
        const promise = (async () => {
            router.refresh();
            // In a real scenario, we might want to wait for the refresh or fetch manually
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        })();

        toast.promise(promise, {
            loading: 'Refreshing kinship directory...',
            success: '✅ Records synchronized successfully',
            error: '❌ Failed to refresh records',
        });

        await promise;
        setIsLoading(false);
    };

    const handleAddOrEdit = (parent: ParentColumn | null) => {
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
        <div className="space-y-8 animate-in fade-in duration-700 font-poppins pb-10">
            {/* Stats Cards Section */}
            <DashboardStatsGrid columns={3}>
                <DashboardStatsCard
                    title="Total Parents"
                    value={isLoading ? "..." : stats.total}
                    icon={Users}
                    color="blue"
                    description="Registered guardians"
                />
                <DashboardStatsCard
                    title="Linked Students"
                    value={isLoading ? "..." : stats.withStudents}
                    icon={GraduationCap}
                    color="emerald"
                    description="With active enrollments"
                />
                <DashboardStatsCard
                    title="Professional Diversity"
                    value={isLoading ? "..." : stats.occupations}
                    icon={School}
                    color="purple"
                    description="Unique occupations found"
                />
            </DashboardStatsGrid>

            {initialError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                    <p className="text-red-700 font-medium">{initialError}</p>
                </div>
            )}

            <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="px-8 pt-8 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <CardTitle className="text-2xl font-bold font-sora text-slate-800">Parents Directory</CardTitle>
                            <CardDescription className="font-medium text-slate-500">Manage family accounts and institutional kinship links</CardDescription>
                        </div>

                        <Button
                            onClick={() => handleAddOrEdit(null)}
                            style={{ backgroundColor: "#4f46e5" }}
                            className="text-white rounded-2xl px-6 h-12 shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Add Parent
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-4">
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                            <div className="relative flex-1 w-full sm:w-auto">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    type="search"
                                    placeholder="Search by name, email or phone..."
                                    className="pl-12 h-12 w-full bg-white border-slate-200 rounded-2xl focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                            <DataTable
                                columns={columns({
                                    onEdit: handleAddOrEdit
                                })}
                                data={filteredParents}
                                searchKey="name"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AddParentModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                parentToEdit={selectedParent}
                onSuccess={handleSuccess}
            />
        </div>
    );
} 