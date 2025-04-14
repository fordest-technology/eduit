'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BillWithRelations } from '@/types';

interface FeesTableProps {
    initialBills: BillWithRelations[];
    userRole: string;
    schoolId: string;
}

export function FeesTable({ initialBills, userRole, schoolId }: FeesTableProps) {
    const router = useRouter();
    const [selectedBill, setSelectedBill] = useState<string | null>(null);
    const [bills, setBills] = useState<BillWithRelations[]>(initialBills);

    const handleViewDetails = (billId: string) => {
        router.push(`/dashboard/fees/${billId}`);
    };

    const handleEdit = (billId: string) => {
        router.push(`/dashboard/fees/${billId}/edit`);
    };

    const handleDelete = async (billId: string) => {
        try {
            const response = await fetch(`/api/bills/${billId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete bill');
            }

            router.refresh();
        } catch (error) {
            console.error('Error deleting bill:', error);
        }
    };

    const getBillStatus = (bill: BillWithRelations) => {
        if (bill.assignments.some(assignment => assignment.status === 'OVERDUE')) {
            return { label: 'Overdue', variant: 'destructive' as const };
        }
        if (bill.assignments.every(assignment => assignment.status === 'PAID')) {
            return { label: 'Paid', variant: 'secondary' as const };
        }
        return { label: 'Pending', variant: 'default' as const };
    };

    const getTotalAmount = (bill: BillWithRelations) => {
        return bill.items.reduce((sum, item) => sum + item.amount, 0);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bills?.length > 0 ? (
                        bills.map((bill) => {
                            const status = getBillStatus(bill);
                            const totalAmount = getTotalAmount(bill);
                            return (
                                <TableRow key={bill.id}>
                                    <TableCell>{bill.account.name}</TableCell>
                                    <TableCell>${totalAmount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={status.variant}>
                                            {status.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(bill.createdAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => setSelectedBill(bill.id)}
                                                >
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => handleViewDetails(bill.id)}
                                                >
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleEdit(bill.id)}
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(bill.id)}
                                                    className="text-red-600"
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
                                No bills found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
} 