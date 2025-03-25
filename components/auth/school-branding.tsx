"use client";

import { useSchoolContext } from "@/hooks/use-school-context";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SchoolBrandingProps {
    className?: string;
}

export function SchoolBranding({ className }: SchoolBrandingProps) {
    const { school, isLoading } = useSchoolContext();

    if (isLoading) {
        return (
            <div className={cn("space-y-4", className)}>
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-6 w-48" />
            </div>
        );
    }

    if (!school) {
        return null;
    }

    return (
        <div className={cn("flex flex-col items-center space-y-4", className)}>
            {school.logo ? (
                <div className="relative h-16 w-16">
                    <Image
                        src={school.logo}
                        alt={`${school.name} logo`}
                        fill
                        className="rounded-full object-contain"
                    />
                </div>
            ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl font-bold text-primary">
                        {school.name.charAt(0)}
                    </span>
                </div>
            )}
            <div className="text-center">
                <h1 className="text-2xl font-semibold">{school.name}</h1>
                <p className="text-sm text-muted-foreground">
                    {school.subdomain}.yourplatform.com
                </p>
            </div>
        </div>
    );
} 