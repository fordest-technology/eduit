"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash, FileText } from "lucide-react";
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

interface Template {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  updatedAt: string;
}

export function ResultsTemplatesList({ schoolId }: { schoolId: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`/api/schools/${schoolId}/results/templates`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      toast.error("Error loading templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [schoolId]);

  const handleDelete = async (id: string) => {
    try {
        const res = await fetch(`/api/schools/${schoolId}/results/templates/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete");
        setTemplates(prev => prev.filter(t => t.id !== id));
        toast.success("Template deleted");
    } catch (error) {
        toast.error("Failed to delete template");
    }
  }

  if (loading) return <div className="grid grid-cols-3 gap-4"><Skeleton className="h-40"/><Skeleton className="h-40"/><Skeleton className="h-40"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
        <div>
           <h2 className="text-xl font-bold text-slate-800">Result Templates</h2>
           <p className="text-slate-500 text-sm">Design and manage your result card layouts</p>
        </div>
        <Link href={`/dashboard/results/templates/new`}>
            <Button className="bg-orange-600 hover:bg-orange-700">
            <Plus className="mr-2 h-4 w-4" /> Create Template
            </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow group relative">
            <CardHeader className="bg-slate-50 border-b pb-3">
               <div className="flex justify-between items-start">
                   <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-orange-500"/>
                        {template.name}
                   </CardTitle>
                   {template.isDefault && <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Default</Badge>}
               </div>
            </CardHeader>
            <CardContent className="pt-4 h-32">
              <p className="text-slate-500 text-sm line-clamp-3">
                {template.description || "No description provided."}
              </p>
              <div className="mt-4 text-xs text-slate-400">
                Last updated: {new Date(template.updatedAt).toLocaleDateString()}
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 border-t p-3 flex justify-end gap-2">
                <Link href={`/dashboard/results/templates/${template.id}/edit`}>
                    <Button variant="outline" size="sm" className="h-8">
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                </Link>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the result template properly.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(template.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
          </Card>
        ))}
         {templates.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                <FileText className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-700">No Templates Yet</h3>
                <p className="text-slate-500 max-w-sm mb-6">Create your first result template to start generating custom report cards.</p>
                <Link href={`/dashboard/results/templates/new`}>
                    <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700">
                    <Plus className="mr-2 h-4 w-4" /> Create First Template
                    </Button>
                </Link>
            </div>
         )}
      </div>
    </div>
  );
}
