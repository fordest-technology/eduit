"use client";

import { useEditorStore, ElementType } from "./editor-context";
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Database, 
  Table as TableIcon,
  MousePointer2,
  Undo2,
  Redo2,
  Stamp,
  Upload,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const tools = [
  { id: "select", icon: MousePointer2, label: "Select (V)", type: null },
  { id: "text", icon: Type, label: "Text (T)", type: "text" },
  { id: "shape", icon: Square, label: "Shape (S)", type: "shape" },
  { id: "image", icon: ImageIcon, label: "Image (I)", type: "image" },
  { id: "dynamic", icon: Database, label: "Dynamic Field (D)", type: "dynamic" },
  { id: "table", icon: TableIcon, label: "Table (B)", type: "table" },
  { id: "watermark", icon: Stamp, label: "Logo Watermark (W)", type: "watermark" },
];

export function Toolbar() {
  const addElement = useEditorStore((state) => state.addElement);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const activeTool = useEditorStore((state) => state.activeTool);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);

  const handleToolClick = (toolId: string, type: string | null) => {
    setActiveTool(toolId);
    if (type) {
      addElement(type as ElementType);
      // Briefly show active then revert to select since element is added
      setTimeout(() => setActiveTool('select'), 300);
    }
  };

  return (
    <div className="w-16 bg-white border-r flex flex-col items-center py-4 gap-4 shrink-0 shadow-sm z-10">
      <TooltipProvider delayDuration={300}>
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 transition-all duration-200",
                    isActive 
                      ? "bg-orange-100 text-orange-600 shadow-sm" 
                      : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                  )}
                  onClick={() => handleToolClick(tool.id, tool.type)}
                >
                  <tool.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>

      <Separator className="w-10" />

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-600 hover:text-orange-600 hover:bg-orange-50" onClick={() => undo()}>
              <Undo2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-600 hover:text-orange-600 hover:bg-orange-50" onClick={() => redo()}>
              <Redo2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
