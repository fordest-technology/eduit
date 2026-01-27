"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-mobile"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface ResponsiveModalProps {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    title?: string
    description?: string
    trigger?: React.ReactNode
    side?: "top" | "bottom" | "left" | "right"
}

export function ResponsiveModal({
    children,
    open,
    onOpenChange,
    title,
    description,
    trigger,
    side = "right",
}: ResponsiveModalProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")

    if (isDesktop) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
                <SheetContent side={side} className="sm:max-w-[700px] w-full overflow-y-auto">
                    <SheetHeader>
                        {title && <SheetTitle className="text-2xl font-bold font-sora">{title}</SheetTitle>}
                        {description && <SheetDescription>{description}</SheetDescription>}
                    </SheetHeader>
                    <div className="mt-4">{children}</div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="text-left">
                    {title && <DrawerTitle className="text-2xl font-bold font-sora">{title}</DrawerTitle>}
                    {description && <DrawerDescription>{description}</DrawerDescription>}
                </DrawerHeader>
                <div className="px-4 overflow-y-auto pb-8">{children}</div>
            </DrawerContent>
        </Drawer>
    )
}
