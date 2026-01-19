"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, ArrowLeft, LayoutTemplate, Type, Image as ImageIcon, Box, Grid, ZoomIn, ZoomOut, Undo, Redo } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Editor Components
import { Canvas } from "@/components/results/template-editor/canvas";
import { PropertiesPanel } from "@/components/results/template-editor/properties-panel";
import { Toolbar } from "@/components/results/template-editor/toolbar";
import { EditorProvider, useEditorStore } from "@/components/results/template-editor/editor-context";

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const initializeEditor = useEditorStore((state) => state.initialize);
  const setSchoolData = useEditorStore((state) => state.setSchoolData);
  const getEditorState = useEditorStore((state) => state.getState);
  
  // View controls
  const showGrid = useEditorStore((state) => state.showGrid);
  const setShowGrid = useEditorStore((state) => state.setShowGrid);
  const zoom = useEditorStore((state) => state.zoom);
  const setZoom = useEditorStore((state) => state.setZoom);

  // Editor Actions
  const selectedId = useEditorStore((state) => state.selectedId);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const deleteElement = useEditorStore((state) => state.deleteElement);
  const duplicateElement = useEditorStore((state) => state.duplicateElement);
  const groupElements = useEditorStore((state) => state.groupElements);
  const updateElement = useEditorStore((state) => state.updateElement);
  const elements = useEditorStore((state) => state.elements);

  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' || e.key === 'Z') {
                e.preventDefault();
                if (e.shiftKey) redo?.();
                else undo?.();
            } else if (e.key === 'y' || e.key === 'Y') {
                e.preventDefault();
                redo?.();
            } else if (e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                if (selectedId) duplicateElement(selectedId);
            } else if (e.key === 'g' || e.key === 'G') {
                e.preventDefault();
                if (selectedIds.length >= 2) groupElements(selectedIds);
            } else if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                handleSave();
            }
            return;
        }

        if (selectedId) {
            const element = elements.find(el => el.id === selectedId);
            if (!element) return;
            if (element.locked) return; // Don't move locked elements

            if (e.key === 'Delete' || e.key === 'Backspace') {
                selectedIds.forEach(id => deleteElement(id));
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                updateElement(selectedId, { x: element.x - (e.shiftKey ? 10 : 1) });
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                updateElement(selectedId, { x: element.x + (e.shiftKey ? 10 : 1) });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                updateElement(selectedId, { y: element.y - (e.shiftKey ? 10 : 1) });
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                updateElement(selectedId, { y: element.y + (e.shiftKey ? 10 : 1) });
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedIds, elements, deleteElement, duplicateElement, groupElements, updateElement, undo, redo]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await getSession();
        if (!session?.schoolId) return;

        // Fetch both template and school data
        const [templateRes, schoolRes] = await Promise.all([
          fetch(`/api/schools/${session.schoolId}/results/templates/${params.id}`),
          fetch(`/api/schools/${session.schoolId}`)
        ]);

        if (!templateRes.ok) throw new Error("Failed to load template");
        
        const templateData = await templateRes.json();
        setTemplateName(templateData.name);
        
        if (schoolRes.ok) {
          const schoolData = await schoolRes.json();
          setSchoolData({
            name: schoolData.name,
            logo: schoolData.logo,
            primaryColor: schoolData.primaryColor || "#1e40af",
            secondaryColor: schoolData.secondaryColor || "#fbbf24",
            address: schoolData.address,
            phone: schoolData.phone,
            email: schoolData.email,
            motto: schoolData.motto,
          });
        }
        
        // Initialize editor store with saved content or defaults
        initializeEditor(templateData.content || {});
      } catch (error) {
        toast.error("Error loading template");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, initializeEditor, setSchoolData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const session = await getSession();
      if (!session?.schoolId) return;

      const content = getEditorState();

      const res = await fetch(`/api/schools/${session.schoolId}/results/templates/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          content: content,
        })
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Template saved successfully");
    } catch (error) {
      toast.error("Error saving template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading editor...</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 shrink-0 z-10">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Button>
                <div>
                   <Input 
                        value={templateName} 
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="h-8 font-semibold text-lg border-transparent hover:border-slate-200 focus:border-slate-300 w-[300px] px-2 -ml-2"
                   />
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                 <div className="flex items-center border-r pr-2 mr-2 gap-1">
                     <TooltipProvider delayDuration={300}>
                         <div className="flex items-center gap-1 mr-2 px-2 border-r">
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => undo?.()} className="h-8 w-8">
                                        <Undo className="h-4 w-4 text-slate-600" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                             </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => redo?.()} className="h-8 w-8">
                                        <Redo className="h-4 w-4 text-slate-600" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
                             </Tooltip>
                         </div>

                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setShowGrid(!showGrid)} className={cn(showGrid && "bg-slate-100")}>
                                    <Grid className="h-4 w-4 text-slate-600" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Toggle Grid</TooltipContent>
                         </Tooltip>
                     </TooltipProvider>

                     <div className="flex items-center gap-2 px-2">
                        <ZoomOut className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} />
                        <span className="text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
                        <ZoomIn className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => setZoom(Math.min(2, zoom + 0.1))} />
                     </div>
                 </div>

                 <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Template"}
                 </Button>
            </div>
        </header>

        {/* Main Editor Area */}
        <div className="flex-1 flex overflow-hidden">
            <Toolbar />
            <div className="flex-1 bg-slate-100 overflow-auto flex justify-center p-8 relative">
                 <Canvas />
            </div>
            <PropertiesPanel />
        </div>
    </div>
  );
}
