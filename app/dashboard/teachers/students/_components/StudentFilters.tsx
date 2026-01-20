"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedClass: string;
    onClassChange: (value: string) => void;
    selectedGender: string;
    onGenderChange: (value: string) => void;
    selectedPerformance: string;
    onPerformanceChange: (value: string) => void;
    selectedAttendance: string;
    onAttendanceChange: (value: string) => void;
    classes: Array<{ id: string; name: string; section: string | null }>;
    onClearFilters: () => void;
    activeFiltersCount: number;
}

export function StudentFilters({
    searchQuery,
    onSearchChange,
    selectedClass,
    onClassChange,
    selectedGender,
    onGenderChange,
    selectedPerformance,
    onPerformanceChange,
    selectedAttendance,
    onAttendanceChange,
    classes,
    onClearFilters,
    activeFiltersCount,
}: StudentFiltersProps) {
    return (
        <Card className="border-none shadow-lg">
            <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search students by name or email..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 rounded-xl"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-600">Filters:</span>
                        </div>

                        {/* Class Filter */}
                        <Select value={selectedClass} onValueChange={onClassChange}>
                            <SelectTrigger className="w-[180px] rounded-xl">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.name} {cls.section && `(${cls.section})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Gender Filter */}
                        <Select value={selectedGender} onValueChange={onGenderChange}>
                            <SelectTrigger className="w-[140px] rounded-xl">
                                <SelectValue placeholder="Gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Genders</SelectItem>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Performance Filter */}
                        <Select value={selectedPerformance} onValueChange={onPerformanceChange}>
                            <SelectTrigger className="w-[160px] rounded-xl">
                                <SelectValue placeholder="Performance" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Performance</SelectItem>
                                <SelectItem value="excellent">Excellent (90-100%)</SelectItem>
                                <SelectItem value="good">Good (70-89%)</SelectItem>
                                <SelectItem value="fair">Fair (50-69%)</SelectItem>
                                <SelectItem value="poor">Poor (&lt;50%)</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Attendance Filter */}
                        <Select value={selectedAttendance} onValueChange={onAttendanceChange}>
                            <SelectTrigger className="w-[160px] rounded-xl">
                                <SelectValue placeholder="Attendance" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Attendance</SelectItem>
                                <SelectItem value="good">Good (≥80%)</SelectItem>
                                <SelectItem value="average">Average (60-79%)</SelectItem>
                                <SelectItem value="poor">Poor (&lt;60%)</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Clear Filters */}
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearFilters}
                                className="rounded-xl text-slate-600 hover:text-slate-900"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear ({activeFiltersCount})
                            </Button>
                        )}
                    </div>

                    {/* Active Filters Display */}
                    {activeFiltersCount > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedClass !== "all" && (
                                <Badge variant="secondary" className="rounded-lg">
                                    Class: {classes.find((c) => c.id === selectedClass)?.name}
                                </Badge>
                            )}
                            {selectedGender !== "all" && (
                                <Badge variant="secondary" className="rounded-lg">
                                    Gender: {selectedGender}
                                </Badge>
                            )}
                            {selectedPerformance !== "all" && (
                                <Badge variant="secondary" className="rounded-lg">
                                    Performance: {selectedPerformance}
                                </Badge>
                            )}
                            {selectedAttendance !== "all" && (
                                <Badge variant="secondary" className="rounded-lg">
                                    Attendance: {selectedAttendance}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
