"use client"

import { useState } from "react"
import { HexColorPicker } from "react-colorful"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ColorPickerProps {
    value: string
    onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="flex items-center space-x-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <div
                        className="w-10 h-10 rounded-md border cursor-pointer"
                        style={{ backgroundColor: value || "#ffffff" }}
                    />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <HexColorPicker color={value} onChange={onChange} />
                </PopoverContent>
            </Popover>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="w-[120px]"
            />
        </div>
    )
} 