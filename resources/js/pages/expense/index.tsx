import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Eye, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Finance',
        href: '#',
    },
    {
        title: 'Expenses',
        href: '#',
    },
];

interface Props {
    expenses: {
        data: Expense[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    branches: Branch[];
    selectedBranchId?: string;
}

type Branch = {
    id: number;
    name: string;
};

type Expense = {
    id: number;
    code: string;
    date: string;
    branch: {
        id: number;
        name: string;
    };
    total_amount: string;
    user: {
        id: number;
        name: string;
    };
    is_locked: boolean;
};

export default function Index({ expenses, branches, selectedBranchId = '' }: Props) {
    useToastNotification();

    const { hasPermission } = usePermissions();
    const { auth } = usePage().props as unknown as {
        auth: { user: { branch_id: number } };
    };
    const [, setIsLoading] = useState(false);
    const initialLoadComplete = useRef(false);

    const getDefaultBranchValue = () => {
        if (auth.user.branch_id) {
            return `${auth.user.branch_id}`;
        }

        if (selectedBranchId) {
            return selectedBranchId;
        }

        return 'all';
    };

    const [currentBranch, setCurrentBranch] = useState(getDefaultBranchValue());

    useEffect(() => {
        if (!initialLoadComplete.current && auth?.user?.branch_id) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlBranchId = urlParams.get('branch_id');

            if (urlBranchId !== auth.user.branch_id.toString()) {
                initialLoadComplete.current = true;

                if (window.history && window.history.replaceState) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('branch_id', auth.user.branch_id.toString());
                    window.history.replaceState({}, '', url.toString());
                }

                setTimeout(() => {
                    router.reload({
                        data: {
                            branch_id: auth.user.branch_id.toString(),
                        },
                        only: ['expenses'],
                    });
                }, 0);
            } else {
                initialLoadComplete.current = true;
            }
        } else if (!initialLoadComplete.current) {
            initialLoadComplete.current = true;
        }
    }, []);

    const handleBranchChange = (value: string) => {
        if (auth.user.branch_id) {
            // If user is branch-restricted, don't allow changing
            return;
        }

        setCurrentBranch(value);
        setIsLoading(true);

        let params = {};
        if (value !== 'all') {
            params = {
                branch_id: value,
            };
        }

        router.get(route('expense.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['expenses', 'branches', 'selectedBranchId'],
            onFinish: () => setIsLoading(false),
        });
    };

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        let params: any = { page };

        // Maintain branch filtering when changing pages
        if (currentBranch !== 'all' && !auth.user.branch_id) {
            params.branch_id = currentBranch;
        } else if (auth.user.branch_id) {
            params.branch_id = auth.user.branch_id;
        }

        router.get(route('expense.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['expenses'],
            onFinish: () => setIsLoading(false),
        });
    };

    const columns: ColumnDef<Expense>[] = [
        createNumberColumn<Expense>(),
        {
            accessorKey: 'code',
            header: 'Code',
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }: { row: Row<Expense> }) => {
                const date = row.getValue('date') as string;
                return formatDate(date);
            },
        },
        {
            accessorKey: 'branch.name',
            header: 'Branch',
        },
        {
            accessorKey: 'total_amount',
            header: 'Total Amount',
            cell: ({ row }: { row: Row<Expense> }) => {
                const amount = row.getValue('total_amount') as string;
                return formatCurrency(parseFloat(amount));
            },
        },
        {
            accessorKey: 'user.name',
            header: 'Created By',
        },
        {
            accessorKey: 'is_locked',
            header: 'Status',
            cell: ({ row }: { row: Row<Expense> }) => {
                const isLocked = row.getValue('is_locked');

                return (
                    <span className={`rounded px-2 py-1 text-xs font-medium ${isLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {isLocked ? 'Locked' : 'Not Locked'}
                    </span>
                );
            },
        },
        (hasPermission('update_expense') || hasPermission('delete_expense')) &&
            ActionColumn<Expense>({
                hasPermission: hasPermission,
                actions: (expense) => [
                    {
                        label: 'View Detail',
                        icon: <Eye className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('expense.show', data.id)),
                        permission: 'read_expense',
                    },
                    {
                        label: 'Edit',
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('expense.edit', data.id)),
                        permission: 'update_expense',
                        isHidden: (data) => data.is_locked,
                    },
                    {
                        label: 'Lock',
                        icon: <Lock className="h-4 w-4" />,
                        onClick: (data) => {
                            router.patch(
                                route('expense.lock', data.id),
                                {},
                                {
                                    preserveScroll: true,
                                },
                            );
                        },
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Lock Expense',
                            description: `Are you sure you want to lock expense ${expense.code}? This will prevent any further changes.`,
                            buttonText: 'Lock',
                            buttonClassName: 'bg-green-600',
                        },
                        permission: 'update_expense',
                        isHidden: (data) => data.is_locked,
                    },
                    {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4" />,
                        className: 'text-red-600',
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Delete Expense',
                            description: `This action cannot be undone. This will permanently delete expense ${expense.code}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('expense.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_expense',
                        isHidden: (data) => data.is_locked,
                    },
                ],
            }),
    ].filter(Boolean) as ColumnDef<Expense>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />

            <div className="rounded-lg bg-white px-8 py-6">
                <Heading title="Expenses" description="Manage your expenses." />

                <div className="mb-4 flex items-center justify-between">
                    {!auth.user.branch_id ? (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="branch" className="whitespace-nowrap">
                                Branch Filter:
                            </Label>
                            <Combobox
                                value={currentBranch}
                                onValueChange={handleBranchChange}
                                options={[
                                    { value: 'all', label: 'All Branches' },
                                    ...branches.map((branch) => ({
                                        value: `${branch.id}`,
                                        label: branch.name,
                                    })),
                                ]}
                                placeholder="Select branch"
                                searchPlaceholder="Search branches..."
                                className="w-[200px]"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Label className="whitespace-nowrap">Branch:</Label>
                            <span className="text-sm font-medium">
                                {branches.find((branch) => branch.id === auth.user.branch_id)?.name || 'Unknown Branch'}
                            </span>
                        </div>
                    )}

                    {hasPermission('create_expense') && (
                        <Link href={route('expense.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Expense
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={expenses.data}
                    serverPagination={{
                        pageCount: expenses.last_page,
                        currentPage: expenses.current_page,
                        totalItems: expenses.total,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>
        </AppLayout>
    );
}
