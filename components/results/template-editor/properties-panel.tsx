"use client";

import { useEditorStore } from "./editor-context";
import { 
    Settings2, X, Trash2, Copy, Layers, 
    Type, Image as ImageIcon, Box, Grid, 
    AlignLeft, AlignCenter, AlignRight, 
    ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
    Plus, Minus, Database, Table as TableIcon,
    ArrowUpCircle, ArrowRightCircle, Paintbrush, Loader2,
    Edit, Bold, Italic
} from "lucide-react";
import { ColorPicker } from "@/components/color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue,
    SelectGroup,
    SelectLabel,
    SelectSeparator
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { groupedFields, type DynamicFieldDefinition } from "@/lib/result-templates/dynamic-fields";


export function PropertiesPanel() {
    const selectedId = useEditorStore((state) => state.selectedId);
    const selectedIds = useEditorStore((state) => state.selectedIds);
    const elements = useEditorStore((state) => state.elements);
    const element = elements.find((el) => el.id === selectedId);
    
    const updateElement = useEditorStore((state) => state.updateElement);
    const deleteElement = useEditorStore((state) => state.deleteElement);
    const setSelectedId = useEditorStore((state) => state.setSelectedId);
    
    const canvasSize = useEditorStore((state) => state.canvasSize);
    const setCanvasSize = useEditorStore((state) => state.setCanvasSize);
    const bringToFront = useEditorStore((state) => state.bringToFront);
    const sendToBack = useEditorStore((state) => state.sendToBack);
    const bringForward = useEditorStore((state) => state.bringForward);
    const sendBackward = useEditorStore((state) => state.sendBackward);
    const duplicateElement = useEditorStore((state) => state.duplicateElement);
    const alignSelected = useEditorStore((state) => state.alignSelected);
    const distributeSelected = useEditorStore((state) => state.distributeSelected);
    const groupElements = useEditorStore((state) => state.groupElements);
    const ungroupElements = useEditorStore((state) => state.ungroupElements);
    const lockElement = useEditorStore((state) => state.lockElement);
    const unlockElement = useEditorStore((state) => state.unlockElement);
    const addTableRow = useEditorStore((state) => state.addTableRow);
    const removeTableRow = useEditorStore((state) => state.removeTableRow);
    const addTableColumn = useEditorStore((state) => state.addTableColumn);
    const removeTableColumn = useEditorStore((state) => state.removeTableColumn);
    const schoolData = useEditorStore((state) => state.schoolData);

    const isMultiSelect = selectedIds.length > 1;

    if (!element && !isMultiSelect) {
        return (
            <div className="w-80 bg-white border-l flex flex-col h-full shrink-0 z-10 overflow-auto">
                <div className="p-4 border-b bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Canvas Settings
                    </h3>
                </div>
                
                <div className="p-4 space-y-6">
                    {schoolData && (
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mb-2">
                             <div className="flex items-center gap-3 mb-2">
                                {schoolData.logo ? (
                                    <img src={schoolData.logo} alt="School Logo" className="h-10 w-10 object-contain" />
                                ) : (
                                    <div className="h-10 w-10 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-500">LOGO</div>
                                )}
                                <div>
                                    <p className="text-sm font-bold truncate max-w-[150px]">{schoolData.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Branding Active</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: schoolData.primaryColor }} title="Primary Color" />
                                <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: schoolData.secondaryColor }} title="Secondary Color" />
                             </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Label>Page Size</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button 
                                variant={canvasSize.width === 794 ? "secondary" : "outline"} 
                                onClick={() => setCanvasSize({ width: 794, height: 1123 })}
                                className="w-full text-xs"
                            >
                                A4 Portrait
                            </Button>
                            <Button 
                                variant={canvasSize.width === 1123 ? "secondary" : "outline"} 
                                onClick={() => setCanvasSize({ width: 1123, height: 794 })}
                                className="w-full text-xs"
                            >
                                A4 Landscape
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <Label>Custom Dimensions</Label>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-500">Width (px)</Label>
                                <Input 
                                    type="number" 
                                    value={canvasSize.width} 
                                    onChange={(e) => setCanvasSize({ ...canvasSize, width: parseInt(e.target.value) || 0 })} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-500">Height (px)</Label>
                                <Input 
                                    type="number" 
                                    value={canvasSize.height} 
                                    onChange={(e) => setCanvasSize({ ...canvasSize, height: parseInt(e.target.value) || 0 })} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 text-sm text-orange-800">
                        <p className="font-semibold mb-1">Tip:</p>
                        <p>Select an element from the toolbar to add it to the canvas. Click on an element to edit its properties.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isMultiSelect) {
        return (
            <div className="w-80 bg-white border-l flex flex-col h-full shrink-0 z-10 overflow-auto">
                <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        {selectedIds.length} Elements Selected
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                
                <div className="p-4 space-y-6">
                    <div className="space-y-4">
                        <Label className="text-xs font-semibold uppercase text-slate-500">Alignment</Label>
                        <div className="grid grid-cols-4 gap-2">
                            <Button variant="outline" size="sm" onClick={() => alignSelected('left')} title="Align Left">
                                <AlignLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => alignSelected('center')} title="Align Center">
                                <AlignCenter className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => alignSelected('right')} title="Align Right">
                                <AlignRight className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => alignSelected('page-center-x')} title="Center to Canvas (Horizontal)" className="text-orange-600 bg-orange-50 hover:bg-orange-100">
                                <ArrowRightCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => alignSelected('top')} title="Align Top">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16" /></svg>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => alignSelected('middle')} title="Align Middle">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-8h8m-8 0H4" /></svg>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => alignSelected('bottom')} title="Align Bottom">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16" /></svg>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => alignSelected('page-center-y')} title="Center to Canvas (Vertical)" className="text-orange-600 bg-orange-50 hover:bg-orange-100">
                                <ArrowUpCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-xs font-semibold uppercase text-slate-500">Distribution</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => distributeSelected('horizontal')} className="flex items-center gap-2">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12V4m16 8V4m-8 8V4" /></svg>
                                Horizontal
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => distributeSelected('vertical')} className="flex items-center gap-2">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4H4m0 16h8m-8-8h16" /></svg>
                                Vertical
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-xs font-semibold uppercase text-slate-500">Actions</Label>
                        <div className="space-y-2">
                            <Button variant="secondary" className="w-full justify-start" onClick={() => groupElements(selectedIds)}>
                                <Layers className="h-4 w-4 mr-2" />
                                Group Elements
                            </Button>
                            <Button variant="destructive" className="w-full justify-start" onClick={() => {
                                selectedIds.forEach(id => deleteElement(id));
                                setSelectedId(null);
                            }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Selected
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const updateStyle = (key: string, value: any) => {
        updateElement(element.id, {
            style: { ...element.style, [key]: value }
        });
    };

    const updateMetadata = (key: string, value: any) => {
        updateElement(element.id, {
            metadata: { ...element.metadata, [key]: value }
        });
    };

    const isLocked = element.locked;

    return (
        <div className="w-80 bg-white border-l flex flex-col h-full shrink-0 z-10 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                <div className="flex flex-col">
                    <h3 className="font-bold text-slate-700 capitalize flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        {element.type} Properties
                    </h3>
                    {element.groupId && (
                        <span className="text-[10px] text-purple-600 font-semibold uppercase mt-0.5">Part of a group</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("h-8 w-8", isLocked ? "text-amber-600 bg-amber-50" : "text-slate-400")}
                        onClick={() => isLocked ? unlockElement(element.id) : lockElement(element.id)}
                    >
                        {isLocked ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                        )}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedId(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="style" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-full px-4 pt-2 bg-slate-50 border-b rounded-none shrink-0 flex justify-start gap-4">
                    <TabsTrigger value="style" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:font-bold rounded-none px-2 pb-2 h-auto bg-transparent shadow-none text-xs transition-all hover:text-orange-400">Style</TabsTrigger>
                    {(element.type === 'dynamic' || element.type === 'image' || element.type === 'watermark') && <TabsTrigger value="data" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:font-bold rounded-none px-2 pb-2 h-auto bg-transparent shadow-none text-xs transition-all hover:text-orange-400">Data</TabsTrigger>}
                    {element.type === 'table' && <TabsTrigger value="table" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:font-bold rounded-none px-2 pb-2 h-auto bg-transparent shadow-none text-xs transition-all hover:text-orange-400">Table</TabsTrigger>}
                    <TabsTrigger value="layout" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:font-bold rounded-none px-2 pb-2 h-auto bg-transparent shadow-none text-xs transition-all hover:text-orange-400">Layout</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        <TabsContent value="style" className="space-y-4 mt-0">
                            {element.type === 'text' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Content</Label>
                                        <Input 
                                            value={element.content} 
                                            onChange={(e) => updateElement(element.id, { content: e.target.value })} 
                                            disabled={isLocked}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Font Size</Label>
                                        <div className="flex items-center gap-4">
                                            <Slider 
                                                min={6} max={72} step={1}
                                                value={[element.style.fontSize]}
                                                onValueChange={([val]) => updateStyle('fontSize', val)}
                                                className="flex-1"
                                                disabled={isLocked}
                                            />
                                            <span className="text-xs font-mono w-8">{element.style.fontSize}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant={element.style.textAlign === 'left' ? 'secondary' : 'outline'} 
                                            size="icon" 
                                            onClick={() => updateStyle('textAlign', 'left')}
                                            disabled={isLocked}
                                        >
                                            <AlignLeft className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant={element.style.textAlign === 'center' ? 'secondary' : 'outline'} 
                                            size="icon" 
                                            onClick={() => updateStyle('textAlign', 'center')}
                                            disabled={isLocked}
                                        >
                                            <AlignCenter className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant={element.style.textAlign === 'right' ? 'secondary' : 'outline'} 
                                            size="icon" 
                                            onClick={() => updateStyle('textAlign', 'right')}
                                            disabled={isLocked}
                                        >
                                            <AlignRight className="h-4 w-4" />
                                        </Button>
                                        <Separator orientation="vertical" className="h-8 mx-1" />
                                        <Button 
                                            variant={element.style.fontWeight === 'bold' ? 'secondary' : 'outline'} 
                                            size="icon" 
                                            onClick={() => updateStyle('fontWeight', element.style.fontWeight === 'bold' ? 'normal' : 'bold')}
                                            disabled={isLocked}
                                        >
                                            <Bold className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}

                            <ColorPicker 
                                label={element.type === 'shape' ? 'Fill Color' : 'Text Color'}
                                color={(element.type === 'shape' ? element.style.backgroundColor : element.style.color) || '#000000'}
                                onChange={(val) => updateStyle(element.type === 'shape' ? 'backgroundColor' : 'color', val)}
                                disabled={isLocked}
                            />

                            {(element.type === 'shape' || element.type === 'image' || element.type === 'text' || element.type === 'dynamic') && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-500">Corner Radius</Label>
                                        <div className="flex items-center gap-4">
                                            <Slider 
                                                min={0} max={100} step={1}
                                                value={[element.style.borderRadius || 0]}
                                                onValueChange={([val]) => updateStyle('borderRadius', val)}
                                                className="flex-1"
                                                disabled={isLocked}
                                            />
                                            <span className="text-[10px] font-mono w-10 h-6 flex items-center justify-center bg-slate-50 border border-slate-200 rounded text-slate-600 font-bold">{element.style.borderRadius || 0}px</span>
                                        </div>
                                    </div>

                                    {(element.type === 'text' || element.type === 'dynamic') && (
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-500">Internal Padding</Label>
                                            <div className="flex items-center gap-4">
                                                <Slider 
                                                    min={0} max={40} step={1}
                                                    value={[element.style.padding || 0]}
                                                    onValueChange={([val]) => updateStyle('padding', val)}
                                                    className="flex-1"
                                                    disabled={isLocked}
                                                />
                                                <span className="text-[10px] font-mono w-10 h-6 flex items-center justify-center bg-slate-50 border border-slate-200 rounded text-slate-600 font-bold">{element.style.padding || 0}px</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-slate-100 space-y-4">
                                        <Label className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Border & Effects</Label>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] text-slate-500 uppercase font-bold">Width</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Slider 
                                                            min={0} max={20} step={1}
                                                            value={[element.style.borderWidth || 0]}
                                                            onValueChange={([val]) => updateStyle('borderWidth', val)}
                                                            className="flex-1"
                                                            disabled={isLocked}
                                                        />
                                                        <span className="text-[10px] font-mono w-8 h-6 flex items-center justify-center bg-slate-50 border border-slate-200 rounded text-slate-600 font-bold">{element.style.borderWidth || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] text-slate-500 uppercase font-bold">Style</Label>
                                                    <Select 
                                                        value={element.style.borderStyle || 'solid'} 
                                                        onValueChange={(val) => updateStyle('borderStyle', val)}
                                                        disabled={isLocked}
                                                    >
                                                        <SelectTrigger className="h-8 text-[10px] bg-slate-50 border-slate-200">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[110]">
                                                            <SelectItem value="solid" className="text-[10px]">Solid</SelectItem>
                                                            <SelectItem value="dashed" className="text-[10px]">Dashed</SelectItem>
                                                            <SelectItem value="dotted" className="text-[10px]">Dotted</SelectItem>
                                                            <SelectItem value="double" className="text-[10px]">Double</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            
                                            <ColorPicker 
                                                label="Border Color"
                                                color={element.style.borderColor || '#e2e8f0'}
                                                onChange={(val) => {
                                                    updateStyle('borderColor', val);
                                                    if (!element.style.borderWidth) updateStyle('borderWidth', 1);
                                                    if (!element.style.borderStyle) updateStyle('borderStyle', 'solid');
                                                }}
                                                disabled={isLocked}
                                            />

                                            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="space-y-0.5">
                                                    <Label className="text-xs font-semibold">Drop Shadow</Label>
                                                    <p className="text-[10px] text-slate-400">Add depth to this element</p>
                                                </div>
                                                <Switch 
                                                    checked={!!element.style.boxShadow}
                                                    onCheckedChange={(checked) => updateStyle('boxShadow', checked ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : undefined)}
                                                    disabled={isLocked}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
 
                             <div className="space-y-2">
                                 <Label>Opacity</Label>
                                 <div className="flex items-center gap-4">
                                     <Slider 
                                         min={0} max={1} step={0.01}
                                         value={[element.style.opacity || 1]}
                                         onValueChange={([val]) => updateStyle('opacity', val)}
                                         className="flex-1"
                                         disabled={isLocked}
                                     />
                                     <span className="text-[10px] font-mono w-10 h-6 flex items-center justify-center bg-slate-50 border border-slate-200 rounded text-slate-600 font-bold">{Math.round((element.style.opacity || 1) * 100)}%</span>
                                 </div>
                             </div>
                        </TabsContent>

                        <TabsContent value="data" className="space-y-4 mt-0">
                             {(element.type === 'dynamic' || element.type === 'watermark') && (
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2">
                                        <Database className="h-4 w-4" />
                                        Data Binding
                                    </Label>
                                    <Select 
                                        value={element.metadata?.field} 
                                        onValueChange={(val) => updateMetadata('field', val)}
                                        disabled={isLocked}
                                    >
                                        <SelectTrigger className="h-10 border-slate-200 hover:border-orange-500 transition-colors">
                                             <SelectValue placeholder="Select a field..." />
                                         </SelectTrigger>
                                         <SelectContent className="rounded-xl shadow-2xl border-slate-200">
                                             <ScrollArea className="h-[400px]">
                                                 <SelectGroup className="p-1">
                                                     <SelectLabel className="text-[10px] text-orange-600 font-bold uppercase tracking-widest py-2 bg-orange-50/50 rounded mb-1 px-3">Student Information</SelectLabel>
                                                     <div className="space-y-0.5">
                                                         {groupedFields.student.map((field) => (
                                                             <SelectItem key={field.key} value={field.key} className="py-2.5 rounded-md hover:bg-orange-50 focus:bg-orange-100 transition-colors">{field.label}</SelectItem>
                                                         ))}
                                                     </div>
                                                 </SelectGroup>
                                                 <SelectSeparator className="my-2" />
                                                 <SelectGroup className="p-1">
                                                     <SelectLabel className="text-[10px] text-blue-600 font-bold uppercase tracking-widest py-2 bg-blue-50/50 rounded mb-1 px-3">School Branding</SelectLabel>
                                                     <div className="space-y-0.5">
                                                         {groupedFields.school.map((field) => (
                                                             <SelectItem key={field.key} value={field.key} className="py-2.5 rounded-md hover:bg-blue-50 focus:bg-blue-100 transition-colors">{field.label}</SelectItem>
                                                         ))}
                                                     </div>
                                                 </SelectGroup>
                                                 <SelectSeparator className="my-2" />
                                                 <SelectGroup className="p-1">
                                                     <SelectLabel className="text-[10px] text-green-600 font-bold uppercase tracking-widest py-2 bg-green-50/50 rounded mb-1 px-3">Academic Period</SelectLabel>
                                                     <div className="space-y-0.5">
                                                         {groupedFields.period.map((field) => (
                                                             <SelectItem key={field.key} value={field.key} className="py-2.5 rounded-md hover:bg-green-50 focus:bg-green-100 transition-colors">{field.label}</SelectItem>
                                                         ))}
                                                     </div>
                                                 </SelectGroup>
                                                 <SelectSeparator className="my-2" />
                                                 <SelectGroup className="p-1">
                                                     <SelectLabel className="text-[10px] text-purple-600 font-bold uppercase tracking-widest py-2 bg-purple-50/50 rounded mb-1 px-3">Performance & Scores</SelectLabel>
                                                     <div className="space-y-0.5">
                                                         {groupedFields.result.map((field) => (
                                                             <SelectItem key={field.key} value={field.key} className="py-2.5 rounded-md hover:bg-purple-50 focus:bg-purple-100 transition-colors">{field.label}</SelectItem>
                                                         ))}
                                                     </div>
                                                 </SelectGroup>
                                             </ScrollArea>
                                         </SelectContent>
                                     </Select>
                                </div>
                             )}

                             {element.type === 'image' && (
                                <div className="space-y-4">
                                     <div className="space-y-2">
                                        <Label>Image Source</Label>
                                        <Select 
                                            value={element.metadata?.field || "custom"} 
                                            onValueChange={(val) => updateMetadata('field', val)}
                                            disabled={isLocked}
                                        >
                                        <SelectTrigger className="h-10 border-slate-200 hover:border-orange-500 transition-colors">
                                                 <SelectValue />
                                             </SelectTrigger>
                                             <SelectContent className="rounded-xl shadow-2xl border-slate-200 p-1">
                                                 <SelectItem value="custom" className="py-2.5 rounded-md hover:bg-slate-50 focus:bg-slate-100 transition-colors">Custom Upload</SelectItem>
                                                 <SelectItem value="school_logo" className="py-2.5 rounded-md hover:bg-slate-50 focus:bg-slate-100 transition-colors">School Logo</SelectItem>
                                                 <SelectItem value="student_photo" className="py-2.5 rounded-md hover:bg-slate-50 focus:bg-slate-100 transition-colors">Student Photo</SelectItem>
                                                 <SelectItem value="school_stamp" className="py-2.5 rounded-md hover:bg-slate-50 focus:bg-slate-100 transition-colors">Official Stamp</SelectItem>
                                                 <SelectItem value="principal_signature" className="py-2.5 rounded-md hover:bg-slate-50 focus:bg-slate-100 transition-colors">Principal Signature</SelectItem>
                                             </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {(!element.metadata?.field || element.metadata?.field === "custom") && (
                                        <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-slate-50">
                                            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            <Button size="sm" variant="outline">Upload Image</Button>
                                            <p className="text-[10px] text-slate-500">PNG, JPG, SVG supported</p>
                                        </div>
                                    )}
                                </div>
                             )}
                        </TabsContent>

                        <TabsContent value="table" className="space-y-6 mt-0">
                            <div className="space-y-4">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Grid Configuration</Label>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between p-2 border rounded-md bg-slate-50">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">Rows</span>
                                            <span className="text-[10px] text-slate-500">{element.metadata?.rows || 1} rows currently</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => removeTableRow(element.id)} disabled={isLocked || (element.metadata?.rows || 1) <= 1}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => addTableRow(element.id)} disabled={isLocked}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-2 border rounded-md bg-slate-50">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">Columns</span>
                                            <span className="text-[10px] text-slate-500">{element.metadata?.cols || 1} columns currently</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => removeTableColumn(element.id)} disabled={isLocked || (element.metadata?.cols || 1) <= 1}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => addTableColumn(element.id)} disabled={isLocked}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Table Headers</Label>
                                <div className="space-y-2">
                                    {[...Array(element.metadata?.cols || 0)].map((_, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <div className="text-[10px] text-slate-400 w-4 font-mono">#{i + 1}</div>
                                            <Input 
                                                className="h-8 text-xs" 
                                                placeholder={`Header ${i + 1}`}
                                                value={(element.metadata?.headers || [])[i] || ""}
                                                onChange={(e) => {
                                                    const newHeaders = [...(element.metadata?.headers || [])];
                                                    // Fill with empty strings if array is too short
                                                    while (newHeaders.length < (element.metadata?.cols || 0)) newHeaders.push("");
                                                    newHeaders[i] = e.target.value;
                                                    updateMetadata('headers', newHeaders);
                                                }}
                                                disabled={isLocked}
                                            />
                                        </div>
                                    ))}
                                    {(element.metadata?.cols || 0) === 0 && (
                                        <div className="text-center py-4 bg-slate-50 rounded italic text-slate-400 text-xs text-balance">
                                            Add columns to configure headers
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Styling</Label>
                                <div className="grid grid-cols-1 gap-4">
                                    <ColorPicker 
                                        label="Header Background"
                                        color={element.style.headerBgColor || '#1e293b'}
                                        onChange={(val) => updateStyle('headerBgColor', val)}
                                        disabled={isLocked}
                                    />
                                    <ColorPicker 
                                        label="Border Color"
                                        color={element.metadata?.borderColor || '#e2e8f0'}
                                        onChange={(val) => updateMetadata('borderColor', val)}
                                        disabled={isLocked}
                                    />
                                    <div className="pt-2 border-t border-slate-100">
                                        <Label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">Premium Customization</Label>
                                        <div className="grid grid-cols-1 gap-4">
                                            <ColorPicker 
                                                label="Table Background"
                                                color={element.style.backgroundColor || '#ffffff'}
                                                onChange={(val) => updateStyle('backgroundColor', val)}
                                                disabled={isLocked}
                                            />
                                            <ColorPicker 
                                                label="Striped Row Color"
                                                color={element.style.altRowColor || '#f8fafc'}
                                                onChange={(val) => updateStyle('altRowColor', val)}
                                                disabled={isLocked}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="layout" className="space-y-6 mt-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Width</Label>
                                    <Input 
                                        type="number" 
                                        value={Math.round(element.width)} 
                                        onChange={(e) => updateElement(element.id, { width: parseInt(e.target.value) })} 
                                        disabled={isLocked}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Height</Label>
                                    <Input 
                                        type="number" 
                                        value={Math.round(element.height)} 
                                        onChange={(e) => updateElement(element.id, { height: parseInt(e.target.value) })} 
                                        disabled={isLocked}
                                    />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">X Position</Label>
                                    <Input 
                                        type="number" 
                                        value={Math.round(element.x)} 
                                        onChange={(e) => updateElement(element.id, { x: parseInt(e.target.value) })} 
                                        disabled={isLocked}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-slate-500">Y Position</Label>
                                    <Input 
                                        type="number" 
                                        value={Math.round(element.y)} 
                                        onChange={(e) => updateElement(element.id, { y: parseInt(e.target.value) })} 
                                        disabled={isLocked}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Center on Canvas</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" className="h-9 px-2 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-100" onClick={() => alignSelected('page-center-x')} disabled={isLocked}>
                                        <ArrowRightCircle className="h-3 w-3 mr-2" />
                                        Horizontal
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-9 px-2 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-100" onClick={() => alignSelected('page-center-y')} disabled={isLocked}>
                                        <ArrowUpCircle className="h-3 w-3 mr-2" />
                                        Vertical
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                 <Label className="text-xs font-semibold uppercase text-slate-500">Arrangement</Label>
                                 <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" className="h-9 px-2 text-xs" onClick={() => bringForward(element.id)} disabled={isLocked}>
                                        <ArrowUp className="h-3 w-3 mr-2" />
                                        Forward
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-9 px-2 text-xs" onClick={() => sendBackward(element.id)} disabled={isLocked}>
                                        <ArrowDown className="h-3 w-3 mr-2" />
                                        Backward
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-9 px-2 text-xs" onClick={() => bringToFront(element.id)} disabled={isLocked}>
                                        <Layers className="h-3 w-3 mr-2" />
                                        To Front
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-9 px-2 text-xs" onClick={() => sendToBack(element.id)} disabled={isLocked}>
                                        <Layers className="h-3 w-3 mr-2" />
                                        To Back
                                    </Button>
                                 </div>
                            </div>
                            
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full h-9 text-xs" 
                                onClick={() => duplicateElement(element.id)}
                                disabled={isLocked}
                            >
                                <Copy className="h-3 w-3 mr-2" />
                                Duplicate Element
                            </Button>
                        </TabsContent>
                    </div>
                </ScrollArea>
            </Tabs>

            <div className="p-4 border-t bg-slate-50/50 shrink-0">
                <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 h-10"
                    onClick={() => deleteElement(element.id)}
                    disabled={isLocked}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Element
                </Button>
            </div>
        </div>
    );
}
