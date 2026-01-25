"use client";

import { useEditorStore, CanvasElement } from "./editor-context";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ElementContextMenu } from "./element-context-menu";
import { ContextMenuTrigger } from "@/components/ui/context-menu";

export function Canvas() {
  const elements = useEditorStore((state) => state.elements);
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const zoom = useEditorStore((state) => state.zoom);
  const showGrid = useEditorStore((state) => state.showGrid);
  const gridSize = useEditorStore((state) => state.gridSize);
  const setSelectedId = useEditorStore((state) => state.setSelectedId);
  const setSelectedIds = useEditorStore((state) => state.setSelectedIds);
  const schoolData = useEditorStore((state) => state.schoolData);

  const [selection, setSelection] = useState<{ start: { x: number, y: number }, current: { x: number, y: number } } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        setSelection({ start: { x, y }, current: { x, y } });
        setSelectedId(null);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!selection || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        setSelection(prev => prev ? { ...prev, current: { x, y } } : null);
    };

    const handleMouseUp = () => {
        if (!selection) return;

        const x1 = Math.min(selection.start.x, selection.current.x);
        const y1 = Math.min(selection.start.y, selection.current.y);
        const x2 = Math.max(selection.start.x, selection.current.x);
        const y2 = Math.max(selection.start.y, selection.current.y);

        // Filter elements within selection rectangle
        const selectedIds = elements
            .filter(el => {
                const elX1 = el.x;
                const elY1 = el.y;
                const elX2 = el.x + el.width;
                const elY2 = el.y + el.height;
                
                // Check for intersection
                return !(elX2 < x1 || elX1 > x2 || elY2 < y1 || elY1 > y2);
            })
            .map(el => el.id);

        if (selectedIds.length > 0) {
            setSelectedIds(selectedIds);
        }

        setSelection(null);
    };

    if (selection) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selection, elements, zoom, setSelectedIds]);

  // Separate watermark elements (render at back)
  const watermarkElements = elements.filter(el => el.type === "watermark");
  const normalElements = elements.filter(el => el.type !== "watermark");

  return (
    <div 
        ref={canvasRef}
        className="bg-white shadow-2xl relative overflow-hidden transition-all duration-300 ring-1 ring-slate-900/5"
        style={{
            width: `${canvasSize.width * zoom}px`,
            height: `${canvasSize.height * zoom}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            backgroundImage: showGrid 
                ? `radial-gradient(#cbd5e1 1px, transparent 1px)` 
                : 'none',
            backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
            backgroundColor: 'white'
        }}
        onMouseDown={handleMouseDown}
    >
      {/* Selection Marquee */}
      {selection && (
          <div 
            className="absolute border border-primary bg-primary/10 z-[100] pointer-events-none"
            style={{
                left: Math.min(selection.start.x, selection.current.x),
                top: Math.min(selection.start.y, selection.current.y),
                width: Math.abs(selection.current.x - selection.start.x),
                height: Math.abs(selection.current.y - selection.start.y),
            }}
          />
      )}

      {/* Watermark layer (rendered first, at back) */}
      {watermarkElements.map((element) => (
        <WatermarkElement key={element.id} element={element} schoolData={schoolData} />
      ))}
      
      {/* Normal elements */}
      {normalElements.map((element) => (
        <DraggableElement key={element.id} element={element} zoom={zoom} gridSize={gridSize} showGrid={showGrid} />
      ))}
    </div>
  );
}

// Watermark element (centered logo with low opacity)
function WatermarkElement({ element, schoolData }: { element: CanvasElement; schoolData: any }) {
  return (
    <div
      className="absolute pointer-events-none select-none flex items-center justify-center"
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        opacity: element.style.opacity || 0.08,
      }}
    >
      {schoolData?.logo ? (
        <img 
          src={schoolData.logo} 
          alt="School Logo Watermark" 
          className="w-full h-full object-contain"
          style={{ filter: 'grayscale(100%)' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg">
          <span className="text-slate-300 text-sm">Logo Watermark</span>
        </div>
      )}
    </div>
  );
}

function DraggableElement({ 
    element, 
    zoom, 
    gridSize, 
    showGrid 
}: { 
    element: CanvasElement, 
    zoom: number, 
    gridSize: number, 
    showGrid: boolean 
}) {
    const setSelectedId = useEditorStore((state) => state.setSelectedId);
    const updateElement = useEditorStore((state) => state.updateElement);
    const toggleSelectId = useEditorStore((state) => state.toggleSelectId);
    const selectedId = useEditorStore((state) => state.selectedId);
    const schoolData = useEditorStore((state) => state.schoolData);
    const isSelected = selectedId === element.id;

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPos, setInitialPos] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const snapToGrid = useCallback((value: number) => {
        if (!showGrid) return value;
        return Math.round(value / gridSize) * gridSize;
    }, [gridSize, showGrid]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (e.shiftKey) {
            toggleSelectId(element.id);
        } else {
            setSelectedId(element.id);
        }

        if (element.locked) return;

        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialPos({ 
            x: element.x, 
            y: element.y, 
            width: element.width, 
            height: element.height 
        });
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (element.locked) return;
        setIsResizing(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialPos({ 
            x: element.x, 
            y: element.y, 
            width: element.width, 
            height: element.height 
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const dx = (e.clientX - dragStart.x) / zoom;
                const dy = (e.clientY - dragStart.y) / zoom;
                
                const newX = snapToGrid(initialPos.x + dx);
                const newY = snapToGrid(initialPos.y + dy);
                
                updateElement(element.id, { x: newX, y: newY });
            } else if (isResizing) {
                const dx = (e.clientX - dragStart.x) / zoom;
                const dy = (e.clientY - dragStart.y) / zoom;

                const newWidth = Math.max(10, snapToGrid(initialPos.width + dx));
                const newHeight = Math.max(10, snapToGrid(initialPos.height + dy));

                updateElement(element.id, { width: newWidth, height: newHeight });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragStart, initialPos, zoom, element.id, updateElement, snapToGrid]);

    const renderContent = () => {
        const commonStyle = {
            ...element.style,
            width: '100%',
            height: '100%',
        } as React.CSSProperties;

        // Format field name for display
        const formatFieldName = (field: string) => {
            return field
                .replace(/_/g, ' ')
                .replace(/\./g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        switch(element.type) {
            case 'text':
                return (
                    <div 
                        style={{
                            ...commonStyle, 
                            display: 'flex', 
                            alignItems: element.style.alignItems || 'center',
                            justifyContent: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                            padding: element.style.padding || 0,
                            borderWidth: element.style.borderWidth || 0,
                            borderColor: element.style.borderColor || 'transparent',
                            borderStyle: element.style.borderStyle || 'solid',
                            borderRadius: element.style.borderRadius || 0,
                        }}
                    >
                        <span style={{ lineHeight: element.style.lineHeight || 1.4 }}>
                            {element.content}
                        </span>
                    </div>
                );
            
            case 'shape':
                return (
                    <div 
                        style={{
                            ...commonStyle,
                            borderRadius: element.style.borderRadius || 0,
                            borderWidth: element.style.borderWidth || 0,
                            borderColor: element.style.borderColor || 'transparent',
                            borderStyle: element.style.borderStyle || 'solid',
                        }}
                    />
                );
            
            case 'dynamic':
                const fieldName = element.metadata?.field as string;
                const isImageField = fieldName?.includes('logo') || fieldName?.includes('photo') || fieldName?.includes('stamp') || fieldName?.includes('signature');
                
                if (isImageField) {
                    // Show real logo if logo field and school data exists
                    if (fieldName === 'school.logo' && schoolData?.logo) {
                        return (
                            <div 
                                style={{
                                    ...commonStyle, 
                                    borderRadius: element.style.borderRadius || 0,
                                    borderWidth: element.style.borderWidth || 0,
                                    borderColor: element.style.borderColor || 'transparent',
                                    borderStyle: element.style.borderStyle || 'solid',
                                    overflow: 'hidden',
                                }} 
                                className="overflow-hidden"
                            >
                                <img src={schoolData.logo} alt="Logo" className="w-full h-full object-contain" />
                                <div className="absolute top-0 right-0 bg-primary/20 text-[6px] px-1 text-primary shadow-sm font-bold backdrop-blur-sm">LOGO</div>
                            </div>
                        );
                    }
                    return (
                        <div 
                            style={{
                                ...commonStyle, 
                                borderRadius: element.style.borderRadius || 0,
                                borderWidth: element.style.borderWidth || (element.style.borderColor ? 1 : 0),
                                borderColor: element.style.borderColor || '#cbd5e1',
                                borderStyle: element.style.borderWidth ? (element.style.borderStyle || 'solid') : 'dashed',
                                overflow: 'hidden',
                            }} 
                            className="flex flex-col items-center justify-center bg-slate-100/50 text-slate-400"
                        >
                            <svg className="w-6 h-6 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[9px] font-medium uppercase tracking-wide">
                                {formatFieldName(fieldName || 'Image')}
                            </span>
                        </div>
                    );
                }
                
                // Show real school data for common fields if available
                let content = `{{${formatFieldName(fieldName || 'field')}}}`;
                if (fieldName === 'school.name' && schoolData?.name) content = schoolData.name;
                if (fieldName === 'school.motto' && schoolData?.motto) content = schoolData.motto;
                if (fieldName === 'school.address' && schoolData?.address) content = schoolData.address;

                return (
                    <div 
                        style={{
                            ...commonStyle,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                            padding: element.style.padding || 4,
                            borderRadius: element.style.borderRadius || 2,
                        }} 
                        className={cn(content.startsWith('{{') ? "bg-orange-50/80 border border-orange-200" : "")}
                    >
                        <span className={cn(content.startsWith('{{') ? "truncate text-orange-700 font-semibold" : "")} style={{ fontSize: element.style.fontSize || 11 }}>
                            {content}
                        </span>
                    </div>
                );
            
            case 'image':
                const imageField = element.metadata?.field as string;
                if (imageField === 'school_logo' && schoolData?.logo) {
                    return (
                        <div 
                            style={{
                                ...commonStyle, 
                                borderRadius: element.style.borderRadius || 0,
                                borderWidth: element.style.borderWidth || 0,
                                borderColor: element.style.borderColor || 'transparent',
                                borderStyle: element.style.borderStyle || 'solid',
                                overflow: 'hidden',
                            }} 
                            className="overflow-hidden"
                        >
                            <img src={schoolData.logo} alt="School Logo" className="w-full h-full object-contain" />
                        </div>
                    );
                }
                return (
                    <div 
                        style={{
                            ...commonStyle,
                            borderRadius: element.style.borderRadius || 0,
                            borderWidth: element.style.borderWidth || (element.style.borderColor ? 1 : 0),
                            borderColor: element.style.borderColor || '#cbd5e1',
                            borderStyle: element.style.borderWidth ? (element.style.borderStyle || 'solid') : 'dashed',
                            overflow: 'hidden',
                        }} 
                        className="flex flex-col items-center justify-center bg-slate-50 text-slate-400"
                    >
                        <svg className="w-8 h-8 mb-1 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] font-medium">
                            {imageField ? formatFieldName(imageField) : 'Image'}
                        </span>
                    </div>
                );
            
            case 'line':
                return (
                    <div 
                        style={{
                            ...commonStyle,
                            backgroundColor: element.style.backgroundColor || '#000000',
                            height: `${element.height}px`,
                        }}
                    />
                );

            case 'table':
                const rows = element.metadata?.rows || 3;
                const cols = element.metadata?.cols || 3;
                const borderColor = element.metadata?.borderColor || '#000000';
                const headers = element.metadata?.headers as string[] | undefined;
                const tableType = element.metadata?.tableType as string | undefined;
                const headerBgColor = element.style?.headerBgColor || '#1e40af';
                const headerTextColor = element.style?.headerTextColor || '#ffffff';
                const altRowColor = element.style?.altRowColor || '#f8fafc';
                
                const colWidths = element.metadata?.columnWidths;
                const gridTemplateColumns = colWidths && colWidths.length === cols 
                    ? colWidths.map((w: number) => `${w}fr`).join(' ')
                    : `repeat(${cols}, 1fr)`;

                const tableBgColor = element.style?.backgroundColor || 'white';

                return (
                    <div 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            borderColor: borderColor,
                            fontSize: element.style.fontSize || 9,
                            backgroundColor: tableBgColor,
                        }} 
                        className="border overflow-hidden"
                    >
                        {/* Header Row */}
                        {headers && headers.length > 0 && headers.some(h => h.trim() !== "") && (
                            <div 
                                className="grid shrink-0"
                                style={{ 
                                    gridTemplateColumns: gridTemplateColumns,
                                    backgroundColor: headerBgColor,
                                    color: headerTextColor,
                                }}
                            >
                                {[...Array(cols)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="px-1 py-0.5 text-center font-bold border-r last:border-r-0 truncate"
                                        style={{ borderColor: borderColor, fontSize: Math.max(6, (element.style.fontSize || 9) - 1) }}
                                    >
                                        {headers[i] || ""}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Data Rows */}
                        <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
                            {[...Array(rows)].map((_, rowIdx) => (
                                <div 
                                    key={rowIdx} 
                                    className="grid border-b last:border-b-0"
                                    style={{ 
                                        gridTemplateColumns: gridTemplateColumns,
                                        backgroundColor: rowIdx % 2 === 1 ? altRowColor : 'transparent',
                                        borderColor: borderColor,
                                    }}
                                >
                                    {[...Array(cols)].map((_, colIdx) => (
                                        <div 
                                            key={colIdx} 
                                            className="border-r last:border-r-0 px-1 py-0.5 flex items-center justify-center overflow-hidden"
                                            style={{ borderColor: borderColor }}
                                        >
                                            <span 
                                                className="text-slate-300 select-none"
                                                style={{ fontSize: element.style.fontSize || 9 }}
                                            >
                                                {tableType === 'subjects' && colIdx === 0 ? 'Subject' : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            
            default:
                // Fallback for unknown types - render as a labeled box
                return (
                    <div 
                        style={commonStyle} 
                        className="flex items-center justify-center bg-slate-100 text-slate-500 border border-slate-300 text-xs"
                    >
                        {element.type.toUpperCase()}
                    </div>
                );
        }
    };

    // Check if element is locked
    const isLocked = element.locked;

    const handleDragStart = (e: React.MouseEvent) => {
        if (isLocked) return;
        handleMouseDown(e);
    };

    const handleResizeStartSafe = (e: React.MouseEvent) => {
        if (isLocked) return;
        handleResizeStart(e);
    };

    return (
        <ElementContextMenu 
            elementId={element.id} 
            elementType={element.type}
            isLocked={isLocked}
            groupId={element.groupId}
        >
            <ContextMenuTrigger asChild>
                <div
                    className={cn(
                        "absolute select-none group touch-none",
                        !isDragging && !isResizing && "transition-all duration-100",
                        isLocked ? "cursor-not-allowed" : (isDragging ? "cursor-grabbing" : "cursor-pointer"),
                        element.groupId && "ring-1 ring-purple-300/50"
                    )}
                    style={{
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                    }}
                    onMouseDown={handleDragStart}
                >
                    {/* Element specific content */}
                    {renderContent()}
                    
                    {/* Selection indicator and resize handles */}
                    {isSelected && (
                        <>
                            {/* Border - show different color if locked */}
                            <div className={cn(
                                "absolute inset-0 border-2 pointer-events-none",
                                isLocked ? "border-amber-500" : "border-primary"
                            )} />
                            
                            {/* Lock indicator */}
                            {isLocked && (
                                <div className="absolute -top-6 left-0 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Locked
                                </div>
                            )}

                            {/* Group indicator */}
                            {element.groupId && (
                                <div className="absolute -top-6 right-0 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded shadow-sm">
                                    Grouped
                                </div>
                            )}
                            
                            {/* Resize Handle (Bottom Right) - Only show if not locked */}
                            {!isLocked && (
                                <div 
                                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-se-resize z-30 shadow-sm flex items-center justify-center"
                                    onMouseDown={handleResizeStartSafe}
                                >
                                     <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                </div>
                            )}

                            {/* Additional resize handles for better control */}
                            {!isLocked && (
                                <>
                                    {/* Top Left */}
                                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-primary rounded-sm cursor-nw-resize z-30 shadow-sm" />
                                    {/* Top Right */}
                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border border-primary rounded-sm cursor-ne-resize z-30 shadow-sm" />
                                    {/* Bottom Left */}
                                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border border-primary rounded-sm cursor-sw-resize z-30 shadow-sm" />
                                </>
                            )}

                            {/* Dimensions label */}
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                                {Math.round(element.width)} × {Math.round(element.height)}
                            </div>
                        </>
                    )}

                    {/* Hover effect when not selected - semi-transparent overlay that still shows content */}
                    {!isSelected && (
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/40 group-hover:bg-primary/5 rounded transition-all pointer-events-none" />
                    )}
                </div>
            </ContextMenuTrigger>
        </ElementContextMenu>
    );
}

