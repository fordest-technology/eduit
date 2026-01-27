"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash, FileText, MoreHorizontal, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Period {
    id: string;
    name: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  periodId?: string;
  period?: Period;
  updatedAt: string;
}

export function ResultsTemplatesList({ schoolId }: { schoolId: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningTemplate, setAssigningTemplate] = useState<Template | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch templates
      const templatesRes = await fetch(`/api/schools/${schoolId}/results/templates`);
      if (!templatesRes.ok) throw new Error("Failed to fetch templates");
      const templatesData = await templatesRes.json();
      setTemplates(templatesData);

      // Fetch periods from school config
      const configRes = await fetch(`/api/schools/${schoolId}/results/config`);
      if (configRes.ok) {
          const configs = await configRes.json();
          // Take periods from the first (latest) config
          if (configs && configs.length > 0) {
              setPeriods(configs[0].periods || []);
          }
      }
    } catch (error) {
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const handleDelete = async (id: string) => {
    try {
        const res = await fetch(`/api/schools/${schoolId}/results/templates/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete");
        setTemplates(prev => prev.filter(t => t.id !== id));
        toast.success("Template deleted successfully");
    } catch (error) {
        toast.error("Failed to delete template");
    }
  };

  const handleAssignPeriod = async () => {
    if (!assigningTemplate) return;
    
    try {
        setIsAssigning(true);
        const res = await fetch(`/api/schools/${schoolId}/results/templates/${assigningTemplate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...assigningTemplate,
                periodId: selectedPeriodId === "none" ? null : selectedPeriodId
            })
        });

        if (!res.ok) throw new Error("Failed to assign term");
        
        toast.success("Template assigned to term");
        setAssigningTemplate(null);
        fetchData(); // Refresh list
    } catch (error) {
        toast.error("Error assigning template to term");
    } finally {
        setIsAssigning(false);
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border shadow-sm gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Result Templates</h2>
           <p className="text-slate-500 text-sm mt-1">Design premium layouts and assign them to specific academic terms.</p>
        </div>
        <Link href={`/dashboard/results/templates/new`}>
            <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200 transition-all active:scale-95">
            <Plus className="mr-2 h-4 w-4" /> Create New Layout
            </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden border-slate-200 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-100 transition-all group">
            <CardHeader className="bg-slate-50/50 border-b pb-4 px-5">
               <div className="flex justify-between items-start">
                   <div className="space-y-1">
                       <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                            <FileText className="h-5 w-5 text-orange-500 shrink-0"/>
                            <span className="truncate max-w-[180px]">{template.name}</span>
                       </CardTitle>
                       <div className="flex flex-wrap gap-2">
                            {template.isDefault && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 font-semibold px-2 py-0">Default</Badge>
                            )}
                            {template.period && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {template.period.name}
                                </Badge>
                            )}
                       </div>
                   </div>
                   
                   <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-slate-600">
                               <MoreHorizontal className="h-4 w-4" />
                           </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="w-48">
                           <DropdownMenuLabel>Template Actions</DropdownMenuLabel>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={() => router.push(`/dashboard/results/templates/${template.id}/edit`)}>
                               <Edit className="h-4 w-4 mr-2" /> Edit Design
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => {
                               setAssigningTemplate(template);
                               setSelectedPeriodId(template.periodId || "none");
                           }}>
                               <Calendar className="h-4 w-4 mr-2" /> Assign to Term
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <AlertDialog>
                               <AlertDialogTrigger asChild>
                                   <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onSelect={(e) => e.preventDefault()}>
                                       <Trash className="h-4 w-4 mr-2" /> Delete Properly
                                   </DropdownMenuItem>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                   <AlertDialogHeader>
                                       <AlertDialogTitle>Delete this template?</AlertDialogTitle>
                                       <AlertDialogDescription>
                                           Are you sure you want to delete "{template.name}"? This action is permanent and will remove the layout from all assigned terms.
                                       </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                       <AlertDialogCancel>Keep it</AlertDialogCancel>
                                       <AlertDialogAction onClick={() => handleDelete(template.id)} className="bg-red-600 hover:bg-red-700">Delete Permanently</AlertDialogAction>
                                   </AlertDialogFooter>
                               </AlertDialogContent>
                           </AlertDialog>
                       </DropdownMenuContent>
                   </DropdownMenu>
               </div>
            </CardHeader>
            <CardContent className="pt-5 px-5 h-32 flex flex-col justify-between">
              <p className="text-slate-500 text-sm italic line-clamp-3">
                {template.description || "Designed to provide a high-fidelity academic summary for students."}
              </p>
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 uppercase tracking-tight">
                <CheckCircle2 className="h-3 w-3 text-slate-300" />
                Updated {new Date(template.updatedAt).toLocaleDateString()}
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/30 border-t p-2">
                <Link href={`/dashboard/results/templates/${template.id}/edit`} className="w-full">
                    <Button variant="ghost" size="sm" className="w-full text-xs font-semibold text-slate-600 hover:text-orange-600 hover:bg-orange-50 gap-2">
                        Open Editor <Plus className="h-3 w-3" />
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
        
        {templates.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
                    <FileText className="h-10 w-10 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">No Premium Templates Found</h3>
                <p className="text-slate-500 max-w-sm mt-2 mb-8">Begin your journey by crafting a state-of-the-art result card layout for your students.</p>
                <Link href={`/dashboard/results/templates/new`}>
                    <Button className="bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-100 h-12 px-8">
                    <Plus className="mr-2 h-5 w-5" /> Start Designing
                    </Button>
                </Link>
            </div>
        )}
      </div>

      {/* Assign to Term Dialog */}
      <Dialog open={!!assigningTemplate} onOpenChange={(open) => !open && setAssigningTemplate(null)}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-orange-500" />
                      Assign to Term
                  </DialogTitle>
                  <DialogDescription>
                      Link this template to a specific academic period. This layout will be used when generating results for the selected term.
                  </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                  <div className="space-y-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                      <p className="text-xs font-semibold uppercase text-orange-600 tracking-wider">Target Template</p>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-orange-200 shadow-sm">
                            <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <h4 className="font-bold text-slate-800">{assigningTemplate?.name}</h4>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <Label htmlFor="period" className="text-sm font-bold text-slate-700">Select Academic Term</Label>
                      <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                          <SelectTrigger id="period" className="h-12 border-slate-200 shadow-sm focus:ring-orange-500 transition-all">
                              <SelectValue placeholder="Choose a term..." />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="none" className="text-slate-400 italic font-normal">None (Unassigned)</SelectItem>
                              {periods.length > 0 ? (
                                  <>
                                    <DropdownMenuSeparator />
                                    {periods.map((p) => (
                                        <SelectItem key={p.id} value={p.id} className="font-medium">
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                  </>
                              ) : (
                                  <SelectItem value="disabled" disabled className="text-xs text-slate-500 italic">
                                      No terms configured in result settings
                                  </SelectItem>
                              )}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setAssigningTemplate(null)}>Cancel</Button>
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 h-11 px-8" 
                    onClick={handleAssignPeriod}
                    disabled={isAssigning || (periods.length === 0 && selectedPeriodId !== "none")}
                  >
                      {isAssigning ? "Saving..." : "Save Assignment"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}

