"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { TeacherStatsCards } from "./_components/TeacherStatsCards";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface TeacherStats {
    totalStudents: number;
    totalClasses: number;
    totalSubjects: number;
    pendingResults: number;
    pendingAttendance: number;
    averagePerformance: number;
}

export default function TeacherDashboardPage() {
    const [stats, setStats] = useState<TeacherStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                const response = await fetch("/api/teachers/dashboard/stats");

                if (!response.ok) {
                    throw new Error("Failed to fetch dashboard stats");
                }

                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Error fetching stats:", error);
                toast.error("Failed to load dashboard statistics");
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Teacher Dashboard"
                text="Welcome back! Here's an overview of your teaching activities."
                showBanner={true}
                icon={<GraduationCap className="h-8 w-8 text-white" />}
            />

            <TeacherStatsCards
                stats={stats || {
                    totalStudents: 0,
                    totalClasses: 0,
                    totalSubjects: 0,
                    pendingResults: 0,
                    pendingAttendance: 0,
                    averagePerformance: 0,
                }}
                loading={loading}
            />

            {/* TODO: Add more sections */}
            {/* - Today's Schedule */}
            {/* - Recent Activity */}
            {/* - Upcoming Events */}
            {/* - Quick Actions */}
        </div>
    );
}
