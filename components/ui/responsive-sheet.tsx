"use client"

import * as React from "react"
import { useIsMobile } from "@/components/ui/use-mobile"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface ResponsiveSheetProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  className?: string
  headerClassName?: string
}

export function ResponsiveSheet({
  children,
  open,
  onOpenChange,
  title,
  description,
  className,
  headerClassName,
}: ResponsiveSheetProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("px-6 pb-10", className)}>
          <DrawerHeader className={cn("px-0 text-left", headerClassName)}>
            {title && (
              <DrawerTitle className="text-2xl font-black font-sora text-slate-900 tracking-tight">
                {title}
              </DrawerTitle>
            )}
            {description && (
              <DrawerDescription className="text-slate-500 font-medium">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="mt-4">{children}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className={cn(
          "rounded-l-[2.5rem] p-10 border-none shadow-2xl sm:max-w-xl overflow-y-auto",
          className
        )}
      >
        <SheetHeader className={cn("pb-8 border-b border-slate-50", headerClassName)}>
          {title && (
            <SheetTitle className="text-3xl font-black font-sora text-slate-900 tracking-tighter">
              {title}
            </SheetTitle>
          )}
          {description && (
            <SheetDescription className="font-medium text-slate-500 text-lg">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="py-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
