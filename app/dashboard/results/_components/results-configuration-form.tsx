"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { ResultConfiguration } from "../types";

const configurationSchema = z.object({
    academicYear: z.string().min(1, "Academic year is required"),
    periods: z.array(z.object({
        name: z.string().min(1, "Period name is required"),
        weight: z.number().min(0.1).default(1),
    })).min(1, "At least one period is required"),
    assessmentComponents: z.array(z.object({
        name: z.string().min(1, "Component name is required"),
        key: z.string().min(1, "Component key is required"),
        maxScore: z.number().min(1, "Max score must be greater than 0"),
    })).min(1, "At least one assessment component is required"),
    gradingScale: z.array(z.object({
        minScore: z.number().min(0, "Minimum score must be at least 0"),
        maxScore: z.number().max(100, "Maximum score cannot exceed 100"),
        grade: z.string().min(1, "Grade is required"),
        remark: z.string().min(1, "Remark is required"),
    })).min(1, "At least one grade scale is required"),
    cumulativeEnabled: z.boolean().default(true),
    cumulativeMethod: z.string().default("progressive_average"),
    showCumulativePerTerm: z.boolean().default(true),
});

type ConfigurationForm = z.infer<typeof configurationSchema>;

interface ResultsConfigurationFormProps {
    initialData?: ResultConfiguration;
}

export function ResultsConfigurationForm({ initialData }: ResultsConfigurationFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ConfigurationForm>({
        resolver: zodResolver(configurationSchema),
        defaultValues: initialData || {
            academicYear: "",
            periods: [
                { name: "First Term", weight: 1 },
                { name: "Second Term", weight: 1 },
                { name: "Third Term", weight: 1 },
            ],
            assessmentComponents: [
                { name: "Test 1", key: "test1", maxScore: 20 },
                { name: "Test 2", key: "test2", maxScore: 20 },
                { name: "Exam", key: "exam", maxScore: 60 },
            ],
            gradingScale: [
                { minScore: 80, maxScore: 100, grade: "A", remark: "Excellent" },
                { minScore: 70, maxScore: 79, grade: "B", remark: "Very Good" },
                { minScore: 60, maxScore: 69, grade: "C", remark: "Good" },
                { minScore: 50, maxScore: 59, grade: "D", remark: "Fair" },
                { minScore: 40, maxScore: 49, grade: "E", remark: "Pass" },
                { minScore: 0, maxScore: 39, grade: "F", remark: "Fail" },
            ],
            cumulativeEnabled: true,
            cumulativeMethod: "progressive_average",
            showCumulativePerTerm: true,
        },
    });

    const {
        fields: periodFields,
        append: appendPeriod,
        remove: removePeriod,
    } = useFieldArray({
        control: form.control,
        name: "periods",
    });

    const {
        fields: componentFields,
        append: appendComponent,
        remove: removeComponent,
    } = useFieldArray({
        control: form.control,
        name: "assessmentComponents",
    });

    const {
        fields: gradeFields,
        append: appendGrade,
        remove: removeGrade,
    } = useFieldArray({
        control: form.control,
        name: "gradingScale",
    });

    async function onSubmit(data: ConfigurationForm) {
        try {
            setIsSubmitting(true);
            const response = await fetch("/api/schools/${window.location.pathname.split("/")[2]}/results/config", {
                method: initialData ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(initialData ? { id: initialData.id, ...data } : data),
            });

            if (!response.ok) {
                throw new Error("Failed to save configuration");
            }

            toast({
                title: "Success",
                description: "Result configuration saved successfully",
            });

            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save configuration",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="academicYear"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Academic Year</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    disabled
                                    className="bg-muted"
                                />
                            </FormControl>
                            <FormMessage />
                            <p className="text-sm text-muted-foreground">
                                Academic year is automatically set from the current academic session
                            </p>
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Academic Periods</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendPeriod({ name: "", weight: 1 })}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Period
                        </Button>
                    </div>

                    {periodFields.map((field, index) => (
                        <Card key={field.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                        <FormField
                                            control={form.control}
                                            name={`periods.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Period Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <FormField
                                            control={form.control}
                                            name={`periods.${index}.weight`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Weight</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(parseFloat(e.target.value))
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="mt-8"
                                        onClick={() => removePeriod(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Assessment Components</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                appendComponent({ name: "", key: "", maxScore: 0 })
                            }
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Component
                        </Button>
                    </div>

                    {componentFields.map((field, index) => (
                        <Card key={field.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                        <FormField
                                            control={form.control}
                                            name={`assessmentComponents.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Component Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <FormField
                                            control={form.control}
                                            name={`assessmentComponents.${index}.key`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Key</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <FormField
                                            control={form.control}
                                            name={`assessmentComponents.${index}.maxScore`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Max Score</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(parseFloat(e.target.value))
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="mt-8"
                                        onClick={() => removeComponent(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Grading Scale</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                appendGrade({
                                    minScore: 0,
                                    maxScore: 0,
                                    grade: "",
                                    remark: "",
                                })
                            }
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Grade
                        </Button>
                    </div>

                    {gradeFields.map((field, index) => (
                        <Card key={field.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-32">
                                        <FormField
                                            control={form.control}
                                            name={`gradingScale.${index}.minScore`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Min Score</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(parseFloat(e.target.value))
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <FormField
                                            control={form.control}
                                            name={`gradingScale.${index}.maxScore`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Max Score</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(parseFloat(e.target.value))
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <FormField
                                            control={form.control}
                                            name={`gradingScale.${index}.grade`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Grade</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <FormField
                                            control={form.control}
                                            name={`gradingScale.${index}.remark`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Remark</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="mt-8"
                                        onClick={() => removeGrade(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Additional Settings</h3>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="cumulativeEnabled"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                    <div>
                                        <FormLabel>Enable Cumulative Average</FormLabel>
                                        <FormDescription>
                                            Calculate and display cumulative averages across periods
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="showCumulativePerTerm"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                    <div>
                                        <FormLabel>Show Per-Term Cumulative</FormLabel>
                                        <FormDescription>
                                            Display cumulative average for each term
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Configuration"}
                </Button>
            </form>
        </Form>
    );
} 