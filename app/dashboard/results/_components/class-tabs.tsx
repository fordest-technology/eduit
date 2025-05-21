"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useColors } from "@/contexts/color-context";
import { Loader2 } from "lucide-react";

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
      <ScrollArea className="w-full px-1">
        <div className="flex space-x-1 pb-3">
          <TabsTrigger
            value="all"
            className={`rounded-md flex items-center justify-center px-4 py-2 text-sm font-medium transition-all ${
              !selectedClass ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            onClick={() => {
              setSelectedClass(null);
              const params = new URLSearchParams(searchParams.toString());
              params.delete("classId");
              router.push(`${pathname}?${params.toString()}`);
            }}
            style={!selectedClass ? { 
              backgroundColor: colors.primaryColor,
              color: "#fff" 
            } : {}}
          >
            All Classes
          </TabsTrigger>
          
          {classes.map((cls) => (
            <TabsTrigger
              key={cls.id}
              value={cls.id}
              className={`rounded-md flex items-center justify-center px-4 py-2 text-sm font-medium transition-all ${
                selectedClass === cls.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
              onClick={() => handleClassChange(cls.id)}
              style={selectedClass === cls.id ? { 
                backgroundColor: colors.primaryColor,
                color: "#fff" 
              } : {}}
            >
              <span>{cls.name}</span>
              {cls.section && (
                <span className="ml-1 text-xs">({cls.section})</span>
              )}
              {cls.studentCount !== undefined && (
                <Badge variant="secondary" className="ml-2 bg-background/50 text-2xs">
                  {cls.studentCount} 
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <Tabs defaultValue={selectedClass || "all"} className="w-full">
          <TabsList className="justify-start w-full h-auto bg-card p-1 mb-6">
            {renderClassTabs()}
          </TabsList>
          
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="mt-2">
              {children(selectedClass)}
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
} 