"use client";

import { useState, useEffect } from "react";
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
import { Trash2, Plus, Link2, Link2Off } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { ResultConfiguration } from "../types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

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
        isComposite: z.boolean().default(false),
        composedOf: z.array(z.string()).default([]),
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
    selectedClassId?: string | null;
    isReadOnly?: boolean;
}

export function ResultsConfigurationForm({ 
    initialData, 
    selectedClassId,
    isReadOnly = false 
}: ResultsConfigurationFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Transform initialData to include composite component properties
    const transformedInitialData = initialData ? {
        ...initialData,
        assessmentComponents: initialData.assessmentComponents.map(comp => ({
            ...comp,
            isComposite: comp.name.toLowerCase().includes('midterm') || comp.name.toLowerCase().includes('mid term'),
            composedOf: [],
        }))
    } : undefined;

    const form = useForm<ConfigurationForm>({
        resolver: zodResolver(configurationSchema),
        defaultValues: transformedInitialData || {
            academicYear: "",
            periods: [
                { name: "First Term", weight: 1 },
                { name: "Second Term", weight: 1 },
                { name: "Third Term", weight: 1 },
            ],
            assessmentComponents: [
                { name: "Test 1", key: "test1", maxScore: 20, isComposite: false, composedOf: [] },
                { name: "Test 2", key: "test2", maxScore: 20, isComposite: false, composedOf: [] },
                { name: "Mid Term", key: "midterm", maxScore: 40, isComposite: true, composedOf: ["test1", "test2"] },
                { name: "Exam", key: "exam", maxScore: 60, isComposite: false, composedOf: [] },
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

    // Update composedOf fields based on component keys
    useEffect(() => {
        const components = form.getValues("assessmentComponents");
        const updatedComponents = components.map(component => {
            if (component.isComposite) {
                // Filter out any components that don't exist anymore
                const availableKeys = components.map(c => c.key);
                const validComposedOf = component.composedOf.filter(key => 
                    availableKeys.includes(key) && key !== component.key
                );
                return { ...component, composedOf: validComposedOf };
            }
            return component;
        });
        
        form.setValue("assessmentComponents", updatedComponents);
    }, [componentFields.length, form]);

    async function onSubmit(data: ConfigurationForm) {
        if (isReadOnly) {
            toast({
                title: "Permission Denied",
                description: "You don't have permission to edit this configuration",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsSubmitting(true);
            
            // Get ID from URL path
            const pathParts = window.location.pathname.split("/");
            const schoolIdIndex = pathParts.indexOf("dashboard") + 1;
            const schoolId = pathParts[schoolIdIndex];

            // Prepare data by removing composite info before sending to API
            const apiData = {
                ...data,
                assessmentComponents: data.assessmentComponents.map(({ isComposite, composedOf, ...rest }) => rest)
            };

            const response = await fetch(`/api/schools/${schoolId}/results/config`, {
                method: initialData ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(initialData ? { id: initialData.id, ...apiData } : apiData),
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
                {isReadOnly && (
                    <Alert>
                        <InfoIcon className="h-4 w-4" />
                        <AlertTitle>View Only Mode</AlertTitle>
                        <AlertDescription>
                            You don't have permission to edit this configuration. You can only view it.
                            {selectedClassId && " To edit, you must be assigned to this class."}
                        </AlertDescription>
                    </Alert>
                )}

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

                <Accordion type="single" collapsible defaultValue="periods" className="space-y-4">
                    <AccordionItem value="periods">
                        <AccordionTrigger>
                            <h3 className="text-lg font-medium">Academic Periods</h3>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Define the academic periods (terms/semesters) for this configuration
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isReadOnly}
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
                                                                    <Input {...field} disabled={isReadOnly} />
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
                                                                        disabled={isReadOnly}
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
                                                    disabled={isReadOnly || periodFields.length <= 1}
                                                    onClick={() => removePeriod(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="components">
                        <AccordionTrigger>
                            <h3 className="text-lg font-medium">Assessment Components</h3>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Define the assessment components (tests, exams, etc.) for this configuration
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isReadOnly}
                                        onClick={() =>
                                            appendComponent({ 
                                                name: "", 
                                                key: "", 
                                                maxScore: 0, 
                                                isComposite: false,
                                                composedOf: []
                                            })
                                        }
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Component
                                    </Button>
                                </div>

                                {componentFields.map((field, index) => (
                                    <Card key={field.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex flex-col space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1">
                                                        <FormField
                                                            control={form.control}
                                                            name={`assessmentComponents.${index}.name`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Component Name</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...field} disabled={isReadOnly} />
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
                                                                        <Input {...field} disabled={isReadOnly} />
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
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                            onChange={(e) =>
                                                                                field.onChange(parseInt(e.target.value))
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
                                                        disabled={isReadOnly || componentFields.length <= 1}
                                                        onClick={() => removeComponent(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`assessmentComponents.${index}.isComposite`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                                <FormControl>
                                                                    <Switch
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        disabled={isReadOnly}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">
                                                                    This is a composite component (like mid-term)
                                                                </FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {form.watch(`assessmentComponents.${index}.isComposite`) && (
                                                    <div className="pl-4 border-l-2 border-muted-foreground/20">
                                                        <FormField
                                                            control={form.control}
                                                            name={`assessmentComponents.${index}.composedOf`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Composed of</FormLabel>
                                                                    <FormControl>
                                                                        <div className="space-y-2">
                                                                            {componentFields
                                                                                .filter((_, i) => i !== index)
                                                                                .map((compField, i) => {
                                                                                    const compKey = form.watch(`assessmentComponents.${i < index ? i : i + 1}.key`);
                                                                                    const isSelected = field.value.includes(compKey);
                                                                                    
                                                                                    return (
                                                                                        <div key={compField.id} className="flex items-center space-x-2">
                                                                                            <Switch
                                                                                                checked={isSelected}
                                                                                                onCheckedChange={(checked) => {
                                                                                                    const newValue = checked
                                                                                                        ? [...field.value, compKey]
                                                                                                        : field.value.filter(k => k !== compKey);
                                                                                                    field.onChange(newValue);
                                                                                                }}
                                                                                                disabled={isReadOnly}
                                                                                            />
                                                                                            <span>{form.watch(`assessmentComponents.${i < index ? i : i + 1}.name`)}</span>
                                                                                            {isSelected && <Link2 className="h-4 w-4 text-muted-foreground" />}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                        </div>
                                                                    </FormControl>
                                                                    <FormDescription>
                                                                        Select which assessment components form this composite component
                                                                    </FormDescription>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="gradingScale">
                        <AccordionTrigger>
                            <h3 className="text-lg font-medium">Grading Scale</h3>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Define the grading scale for student results
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isReadOnly}
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-1/2">
                                                        <FormField
                                                            control={form.control}
                                                            name={`gradingScale.${index}.minScore`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Min Score</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                            onChange={(e) =>
                                                                                field.onChange(parseInt(e.target.value))
                                                                            }
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="w-1/2">
                                                        <FormField
                                                            control={form.control}
                                                            name={`gradingScale.${index}.maxScore`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Max Score</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                            onChange={(e) =>
                                                                                field.onChange(parseInt(e.target.value))
                                                                            }
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4">
                                                    <div className="w-1/3">
                                                        <FormField
                                                            control={form.control}
                                                            name={`gradingScale.${index}.grade`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Grade</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...field} disabled={isReadOnly} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="w-2/3">
                                                        <FormField
                                                            control={form.control}
                                                            name={`gradingScale.${index}.remark`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Remark</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...field} disabled={isReadOnly} />
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
                                                        disabled={isReadOnly || gradeFields.length <= 1}
                                                        onClick={() => removeGrade(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="settings">
                        <AccordionTrigger>
                            <h3 className="text-lg font-medium">Cumulative Result Settings</h3>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="cumulativeEnabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    Enable Cumulative Results
                                                </FormLabel>
                                                <FormDescription>
                                                    Calculate cumulative averages across terms
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isReadOnly}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {form.watch("cumulativeEnabled") && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="cumulativeMethod"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Calculation Method</FormLabel>
                                                    <Select
                                                        disabled={isReadOnly}
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select method" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="simple_average">
                                                                Simple Average
                                                            </SelectItem>
                                                            <SelectItem value="weighted_average">
                                                                Weighted Average (using period weights)
                                                            </SelectItem>
                                                            <SelectItem value="progressive_average">
                                                                Progressive Average
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        How to calculate cumulative results across terms
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="showCumulativePerTerm"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">
                                                            Show Cumulative Per Term
                                                        </FormLabel>
                                                        <FormDescription>
                                                            Display cumulative averages on each term's result
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={isReadOnly}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Button type="submit" disabled={isSubmitting || isReadOnly}>
                    {isSubmitting ? "Saving..." : "Save Configuration"}
                </Button>
            </form>
        </Form>
    );
} 