"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
    targetType: z.enum(["CLASS", "STUDENT"]),
    targetId: z.string(),
    dueDate: z.date(),
});

interface BillAssignmentFormProps {
    billId: string;
    students: Array<{
        id: string;
        user: {
            name: string;
        };
    }>;
    classes: Array<{
        id: string;
        name: string;
        students: Array<{
            id: string;
        }>;
    }>;
    onSubmit: (data: z.infer<typeof formSchema> & { billId: string }) => void;
    trigger?: React.ReactNode;
}

export function BillAssignmentDialog({
    billId,
    students,
    classes,
    onSubmit,
    trigger,
}: BillAssignmentFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [targetType, setTargetType] = useState<"CLASS" | "STUDENT">("CLASS");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            targetType: "CLASS",
            dueDate: new Date(),
        },
    });

    const handleSubmit = (data: z.infer<typeof formSchema>) => {
        onSubmit({ ...data, billId });
        setIsOpen(false);
        form.reset();
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>{trigger}</SheetTrigger>
            <SheetContent className="sm:max-w-md w-full overflow-y-auto" side="right">
                <SheetHeader>
                    <SheetTitle>Assign Bill</SheetTitle>
                    <SheetDescription>
                        Assign this bill to a class or individual student
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                    >
                        <FormField
                            control={form.control}
                            name="targetType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign To</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            setTargetType(value as "CLASS" | "STUDENT");
                                        }}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select target type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CLASS">Class</SelectItem>
                                            <SelectItem value="STUDENT">Student</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Choose whether to assign to a class or individual student
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="targetId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {targetType === "CLASS" ? "Class" : "Student"}
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={`Select ${targetType === "CLASS"
                                                        ? "class"
                                                        : "student"
                                                        }`}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {targetType === "CLASS"
                                                ? classes.map((cls) => (
                                                    <SelectItem
                                                        key={cls.id}
                                                        value={cls.id}
                                                    >
                                                        {cls.name}
                                                    </SelectItem>
                                                ))
                                                : students.map((student) => (
                                                    <SelectItem
                                                        key={student.id}
                                                        value={student.id}
                                                    >
                                                        {student.user.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Due Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value &&
                                                        "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date: Date) =>
                                                    date < new Date()
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Select the due date for this bill
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <SheetFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Assign Bill</Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
} 