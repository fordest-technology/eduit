"use client";

import React, { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Check, Pipette } from "lucide-react";

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
}

const PRESET_COLORS = [
    "#000000", "#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0", "#94a3b8", "#64748b", "#475569",
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#06b6d4",
    "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#7c2d12",
    // Premium school colors
    "#1e40af", "#1e3a8a", "#431407", "#064e3b", "#312e81", "#4c1d95", "#fbbf24",
];

export function ColorPicker({ color, onChange, label, disabled, className }: ColorPickerProps) {
    const [hexValue, setHexValue] = useState(color || "#000000");

    useEffect(() => {
        setHexValue(color || "#000000");
    }, [color]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (val && !val.startsWith("#")) val = "#" + val;
        setHexValue(val);
        // Validate hex
        if (/^#[0-9A-F]{6}$/i.test(val) || /^#[0-9A-F]{3}$/i.test(val)) {
            onChange(val);
        }
    };

    return (
        <div className={cn("space-y-1.5 w-full", className)}>
            {label && <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">{label}</Label>}
            <Popover>
                <PopoverTrigger asChild>
                    <Button 
                        variant="outline" 
                        className={cn(
                            "w-full h-10 px-2 justify-start font-normal border-slate-200 hover:border-orange-200 transition-colors bg-white",
                            disabled && "opacity-50 pointer-events-none"
                        )}
                        disabled={disabled}
                    >
                        <div className="flex items-center gap-2 w-full">
                            <div 
                                className="h-6 w-10 rounded shadow-sm border border-black/5 shrink-0" 
                                style={{ backgroundColor: color || "#000000" }} 
                            />
                            <span className="text-xs font-mono uppercase text-slate-600 flex-1 text-left truncate">
                                {color || "#000000"}
                            </span>
                            <Pipette className="h-3 w-3 text-slate-400" />
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0 bg-white shadow-2xl border-slate-200 rounded-xl overflow-hidden z-[100]">
                    <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Palette & Custom</span>
                    </div>
                    
                    <div className="p-4 space-y-4">
                        {/* react-colorful HexColorPicker */}
                        <div className="flex justify-center professional-picker">
                            <HexColorPicker 
                                color={color || "#000000"} 
                                onChange={onChange} 
                                className="!w-full !h-40"
                            />
                        </div>

                        <div className="grid grid-cols-8 gap-1.5">
                            {PRESET_COLORS.map((preset) => (
                                <button
                                    key={preset}
                                    className={cn(
                                        "h-6 w-6 rounded-md border border-black/10 shadow-sm transition-transform hover:scale-110 flex items-center justify-center shrink-0",
                                        color?.toLowerCase() === preset.toLowerCase() && "ring-2 ring-orange-500 ring-offset-1"
                                    )}
                                    style={{ backgroundColor: preset }}
                                    onClick={() => onChange(preset)}
                                >
                                    {color?.toLowerCase() === preset.toLowerCase() && (
                                        <Check className={cn("h-3 w-3", preset === "#ffffff" || preset === "#f8fafc" ? "text-slate-900" : "text-white")} />
                                    )}
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <div className="relative flex-1">
                                <Input 
                                    className="h-9 text-xs font-mono pl-6 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    value={hexValue} 
                                    onChange={handleHexChange}
                                    placeholder="#000000"
                                />
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold font-mono">#</span>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
