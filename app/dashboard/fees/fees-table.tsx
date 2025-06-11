'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { MoreHorizontal, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/app/lib/utils';

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
            return { label: 'Overdue', variant: 'destructive' as const, icon: <XCircle className="h-3 w-3 mr-1" /> };
        }
        if (bill.assignments.every(assignment => assignment.status === 'PAID')) {
            return { label: 'Paid', variant: 'default' as const, icon: <CheckCircle className="h-3 w-3 mr-1" /> };
        }
        return { label: 'Pending', variant: 'outline' as const };
    };

    const getTotalAmount = (bill: BillWithRelations) => {
        return bill.items.reduce((sum, item) => sum + item.amount, 0);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fee Bills</CardTitle>
            </CardHeader>
            <CardContent>
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
                                        <TableRow key={bill.id} className="group hover:bg-muted/50">
                                            <TableCell className="font-medium">{bill.account.name}</TableCell>
                                            <TableCell>{formatCurrency(totalAmount)}</TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant} className="flex items-center">
                                                    {status.icon}
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
                                                            className="flex items-center"
                                                        >
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleEdit(bill.id)}
                                                            className="flex items-center"
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(bill.id)}
                                                            className="flex items-center text-red-600"
                                                        >
                                                            <XCircle className="h-4 w-4 mr-2" />
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
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <p className="text-muted-foreground">No bills found</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
} 