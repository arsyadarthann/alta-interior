import { DataTable } from '@/components/data-table';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Edit, Lock } from 'lucide-react';

interface ExpenseDetail {
    id: number;
    expense_id: number;
    name: string;
    amount: string;
    created_at: string;
    updated_at: string;
}

interface ExpenseProps {
    expense: {
        id: number;
        code: string;
        date: string;
        source_able_id: number;
        source_able_type: string;
        user_id: number;
        total_amount: string;
        is_locked: boolean;
        created_at: string;
        updated_at: string;
        user: {
            id: number;
            name: string;
        };
        source_able: {
            id: number;
            name: string;
        };
        expense_details: ExpenseDetail[];
    };
}

export default function Show({ expense }: ExpenseProps) {
    useToastNotification();
    const { hasPermission } = usePermissions();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Finance',
            href: '#',
        },
        {
            title: 'Expenses',
            href: route('expense.index'),
        },
        {
            title: expense.code,
            href: route('expense.show', expense.id),
        },
    ];

    const handleEdit = () => {
        router.visit(route('expense.edit', expense.id));
    };

    const handleToggleLock = () => {
        router.patch(route('expense.lock', expense.id));
    };

    // Get the source type label (Branch or Warehouse)
    const getSourceTypeLabel = () => {
        if (expense.source_able_type === 'App\\Models\\Branch') {
            return 'Branch';
        } else if (expense.source_able_type === 'App\\Models\\Warehouse') {
            return 'Warehouse';
        }
        return 'Location';
    };

    const columns: ColumnDef<ExpenseDetail>[] = [
        createNumberColumn<ExpenseDetail>(),
        {
            accessorKey: 'name',
            header: 'Expense Name',
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue('amount'));
                return formatCurrency(amount);
            },
            meta: {
                className: 'text-center',
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Expense: ${expense.code}`} />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Expense" description="Expense record details" />
                    <div className="flex gap-3">
                        <Link href={route('expense.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                        {hasPermission('update_expense') && !expense.is_locked && (
                            <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2">
                                <Edit className="h-4 w-4" /> Edit
                            </Button>
                        )}
                        {hasPermission('update_expense') && !expense.is_locked && (
                            <Button onClick={handleToggleLock} variant="default" className="flex items-center gap-2">
                                <Lock className="h-4 w-4" /> Lock
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <Card className="h-full border-0 shadow-sm">
                            <div className="p-6">
                                <h2 className="mb-4 text-base font-semibold text-gray-900">Expense Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Code</h3>
                                            <p className="mt-1 text-sm text-gray-900">{expense.code}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(expense.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">{getSourceTypeLabel()}</h3>
                                            <p className="mt-1 text-sm text-gray-900">{expense.source_able.name}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                                            <p className="mt-1 text-sm text-gray-900">{expense.user.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Total</h3>
                                            <p className="mt-1 text-sm font-semibold text-gray-900">
                                                {formatCurrency(parseFloat(expense.total_amount))}
                                            </p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                            <div className="mt-1">
                                                {expense.is_locked ? (
                                                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                                                        Locked
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                        Not Locked
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card className="h-full border-0 shadow-sm">
                            <div className="p-6">
                                <div className="mb-4 flex items-center">
                                    <h2 className="text-base font-semibold text-gray-900">Expense Details</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {expense.expense_details.length} items
                                    </Badge>
                                </div>

                                {expense.expense_details.length > 0 ? (
                                    <DataTable data={expense.expense_details} columns={columns} pageSize={10} />
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No expense details found</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
