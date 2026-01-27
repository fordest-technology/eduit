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
  
  // Grouping state
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
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

        // If a class is already selected, set the level
        const currentClassId = searchParams.get("classId") || defaultClass;
        if (currentClassId) {
          const cls = data.find((c: Class) => c.id === currentClassId);
          if (cls) {
            setSelectedLevel(cls.name);
          }
        } else if (data.length > 0) {
           // Optional: Auto-select first grouping? simpler to show nothing or "Select Level"
        }

      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    }

    if (schoolId) {
      fetchClasses();
    }
  }, [schoolId, searchParams, defaultClass]);

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    
    // Update URL search params
    const params = new URLSearchParams(searchParams.toString());
    params.set("classId", classId);
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLevelSelect = (levelName: string) => {
    if (selectedLevel === levelName) return; // No change
    
    setSelectedLevel(levelName);
    
    // Auto-select the first class in this level
    const firstClassInLevel = classes.find(c => c.name === levelName);
    if (firstClassInLevel) {
      handleClassChange(firstClassInLevel.id);
    }
  };

  // Group classes by name
  const levels = Array.from(new Set(classes.map(c => c.name)));
  
  // Get sections for filtering
  const sectionsForLevel = selectedLevel 
    ? classes.filter(c => c.name === selectedLevel) 
    : [];

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
      <div className="space-y-4">
        {/* Level Selection (Top Row) */}
        <div>
           <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider ml-1">Levels / Years</div>
           <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 pb-2 px-1">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelSelect(level)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap border
                    ${selectedLevel === level 
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'
                    }
                  `}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>{level}</span>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>
        </div>
        
        {/* Section/Arm Selection (Bottom Row) - Only if level selected */}
        {selectedLevel && sectionsForLevel.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider ml-1">Classes / Arms</div>
             <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-2 pb-2 px-1">
                {sectionsForLevel.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => handleClassChange(cls.id)}
                    className={`
                      flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border
                      ${selectedClass === cls.id 
                        ? 'bg-orange-600 text-white border-orange-600 shadow-orange-200 shadow-md' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600'
                      }
                    `}
                  >
                     <span>{cls.section || "Main"}</span>
                     {cls.studentCount !== undefined && cls.studentCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={`ml-1 text-[10px] h-5 px-1.5 ${selectedClass === cls.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {cls.studentCount}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-2" />
            </ScrollArea>
          </div>
        )}
      </div>
    );
  };

  const selectedClassName = selectedClass 
    ? classes.find(c => c.id === selectedClass)?.name + " " + (classes.find(c => c.id === selectedClass)?.section || "")
    : 'Select Class';

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
              Select a Level and then a Class Arm
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
        <div className="bg-slate-50/80 p-4 rounded-xl mb-6">
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
 