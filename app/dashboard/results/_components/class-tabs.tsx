"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useColors } from "@/contexts/color-context";
import { Loader2, Users, GraduationCap } from "lucide-react";

interface Class {
  id: string;
  name: string;
  section?: string;
  studentCount?: number;
}

interface ClassTabsProps {
  schoolId: string;
  children: (classId: string | null) => React.ReactNode;
  defaultClass?: string | null;
}

export function ClassTabs({ schoolId, children, defaultClass = null }: ClassTabsProps) {
  const { colors } = useColors();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(
    searchParams.get("classId") || defaultClass
  );

  useEffect(() => {
    async function fetchClasses() {
      try {
        setLoading(true);
        const response = await fetch(`/api/schools/${schoolId}/classes`);
        if (!response.ok) {
          throw new Error("Failed to fetch classes");
        }
        const data = await response.json();
        setClasses(data);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    }

    if (schoolId) {
      fetchClasses();
    }
  }, [schoolId]);

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    
    // Update URL search params
    const params = new URLSearchParams(searchParams.toString());
    params.set("classId", classId);
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const renderClassTabs = () => {
    if (loading) {
      return (
        <div className="w-full flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading classes...</span>
        </div>
      );
    }

    if (classes.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          No classes found.
        </div>
      );
    }

    return (
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-2 px-1">
          {/* All Classes Button */}
          <button
            onClick={() => {
              setSelectedClass(null);
              const params = new URLSearchParams(searchParams.toString());
              params.delete("classId");
              router.push(`${pathname}?${params.toString()}`);
            }}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${!selectedClass 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200' 
                : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600'
              }
            `}
          >
            <Users className="h-4 w-4" />
            <span>All Classes</span>
          </button>
          
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => handleClassChange(cls.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${selectedClass === cls.id 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600'
                }
              `}
            >
              <GraduationCap className="h-4 w-4" />
              <span>{cls.name}</span>
              {cls.section && (
                <span className={`text-xs ${selectedClass === cls.id ? 'text-orange-100' : 'text-slate-400'}`}>
                  ({cls.section})
                </span>
              )}
              {cls.studentCount !== undefined && cls.studentCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className={`ml-1 text-xs ${selectedClass === cls.id ? 'bg-white/20 text-white' : 'bg-slate-100'}`}
                >
                  {cls.studentCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-2" />
      </ScrollArea>
    );
  };

  const selectedClassName = selectedClass 
    ? classes.find(c => c.id === selectedClass)?.name 
    : 'All Classes';

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-orange-500" />
              Select Class
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1">
              Choose a class to view and manage student results
            </CardDescription>
          </div>
          {selectedClass && (
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
              <Users className="h-3 w-3 mr-1" />
              {selectedClassName}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Class Selection Pills */}
        <div className="bg-slate-50/80 p-3 rounded-xl mb-6">
          {renderClassTabs()}
        </div>
        
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div>
            {children(selectedClass)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
 