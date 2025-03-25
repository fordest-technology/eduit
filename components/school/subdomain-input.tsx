"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSubdomainAvailable } from "@/lib/subdomain";
import { generateSubdomain, normalizeSubdomain } from "@/lib/subdomain";

interface SubdomainInputProps {
    value: string;
    onChange: (value: string) => void;
    schoolName?: string;
    className?: string;
}

export function SubdomainInput({
    value,
    onChange,
    schoolName,
    className,
}: SubdomainInputProps) {
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Generate subdomain from school name when it changes
    useEffect(() => {
        if (schoolName && !value) {
            const generated = generateSubdomain(schoolName);
            onChange(generated);
        }
    }, [schoolName, value, onChange]);

    // Check availability when value changes
    useEffect(() => {
        const checkAvailability = async () => {
            if (!value) {
                setIsAvailable(null);
                setError(null);
                return;
            }

            setIsChecking(true);
            setError(null);

            try {
                const available = await isSubdomainAvailable(value);
                setIsAvailable(available);
            } catch (err) {
                setError("Failed to check subdomain availability");
                setIsAvailable(false);
            } finally {
                setIsChecking(false);
            }
        };

        const timeoutId = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timeoutId);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const normalized = normalizeSubdomain(e.target.value);
        onChange(normalized);
    };

    return (
        <div className={cn("space-y-2", className)}>
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="relative">
                <Input
                    id="subdomain"
                    value={value}
                    onChange={handleChange}
                    placeholder="school-name"
                    className={cn(
                        "pr-10",
                        isAvailable === true && "border-green-500",
                        isAvailable === false && "border-red-500"
                    )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isChecking ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : isAvailable === true ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : isAvailable === false ? (
                        <X className="h-4 w-4 text-red-500" />
                    ) : null}
                </div>
            </div>
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
            {isAvailable === false && !error && (
                <p className="text-sm text-red-500">
                    This subdomain is already taken. Please choose another one.
                </p>
            )}
            <p className="text-sm text-muted-foreground">
                Your school will be accessible at {value}.yourplatform.com
            </p>
        </div>
    );
} 