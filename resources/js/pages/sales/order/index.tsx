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
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: '#',
    },
    {
        title: 'Orders',
        href: '#',
    },
];

interface Props {
    salesOrders: {
        data: SalesOrder[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    branches: Branch[];
    selectedBranchId?: string;
    filters?: {
        search?: string;
    };
}

type Branch = {
    id: number;
    name: string;
};

type SalesOrder = {
    id: number;
    code: string;
    date: string;
    customer_id: number | null;
    customer_name: string;
    status: 'pending' | 'processed' | 'completed' | 'cancelled';
    branch: {
        id: number;
        name: string;
    };
    user: {
        id: number;
        name: string;
    };
    total_amount: string;
    tax_amount: string;
    grand_total: string;
};

export default function Index({ salesOrders, branches, selectedBranchId = '', filters }: Props) {
    useToastNotification();

    const { hasPermission } = usePermissions();
    const { auth } = usePage().props as unknown as {
        auth: { user: { branch_id: number } };
    };
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');
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

    // Custom debounce hook
    function useDebounce(callback: Function, delay: number) {
        const timeoutRef = useRef<NodeJS.Timeout>();

        return useCallback(
            (...args: any[]) => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => {
                    callback(...args);
                }, delay);
            },
            [callback, delay],
        );
    }

    // Debounced search handler to reduce excessive requests
    const debouncedSearch = useDebounce((value: string) => {
        const params: any = { search: value, page: 1 }; // Reset page to 1 when search changes

        // Maintain branch filtering when searching
        if (currentBranch !== 'all' && !auth.user.branch_id) {
            params.branch_id = currentBranch;
        } else if (auth.user.branch_id) {
            params.branch_id = auth.user.branch_id;
        }

        router.get(route('sales.order.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['salesOrders'],
            onBefore: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    }, 500);

    // Set search state when component mounts
    useEffect(() => {
        if (filters?.search !== undefined) {
            setSearch(filters.search);
        }
    }, []); // Run once on mount

    // Handle search change
    const handleSearchChange = (value: string) => {
        setSearch(value);
        debouncedSearch(value);
    };

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
                        only: ['salesOrders'],
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
            return;
        }

        setCurrentBranch(value);
        setIsLoading(true);

        let params: any = {};
        if (value !== 'all') {
            params.branch_id = value;
        }

        // Maintain search when changing branches
        if (search) {
            params.search = search;
        }

        router.get(route('sales.order.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['salesOrders', 'branches', 'selectedBranchId'],
            onFinish: () => setIsLoading(false),
        });
    };

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        const params: any = { page };

        // Maintain branch filtering when changing pages
        if (currentBranch !== 'all' && !auth.user.branch_id) {
            params.branch_id = currentBranch;
        } else if (auth.user.branch_id) {
            params.branch_id = auth.user.branch_id;
        }

        // Maintain search when changing pages
        if (search) {
            params.search = search;
        }

        router.get(route('sales.order.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['salesOrders'],
            onBefore: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processed':
                return 'bg-blue-100 text-blue-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const columns: ColumnDef<SalesOrder>[] = [
        createNumberColumn<SalesOrder>(),
        {
            accessorKey: 'code',
            header: 'Order Code',
        },
        {
            accessorKey: 'date',
            header: 'Date',
        },
        {
            accessorKey: 'customer_name',
            header: 'Customer',
        },
        {
            accessorKey: 'branch.name',
            header: 'Branch',
        },
        {
            accessorKey: 'user.name',
            header: 'Created By',
        },
        {
            accessorKey: 'grand_total',
            header: 'Total',
            cell: ({ row }: { row: Row<SalesOrder> }) => {
                const amount = row.getValue('grand_total') as number;
                return formatCurrency(amount);
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: { row: Row<SalesOrder> }) => {
                const status = row.getValue('status') as string;
                const statusClass = getStatusClass(status);

                return (
                    <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                );
            },
        },
        ActionColumn<SalesOrder>({
            hasPermission: hasPermission,
            actions: (salesOrder) => [
                {
                    label: 'View Detail',
                    icon: <Eye className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('sales.order.show', data.id)),
                    permission: 'read_sales_order',
                },
                {
                    label: 'Edit',
                    icon: <Pencil className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('sales.order.edit', data.id)),
                    permission: 'update_sales_order',
                    isHidden: (data) => data.status !== 'pending' && data.status !== 'processed',
                },
                {
                    label: 'Delete',
                    icon: <Trash2 className="h-4 w-4" />,
                    className: 'text-red-600',
                    showConfirmDialog: true,
                    confirmDialogProps: {
                        title: 'Delete Sales Order',
                        description: `This action cannot be undone. This will permanently delete order ${salesOrder.code}.`,
                    },
                    onClick: (data) => {
                        router.delete(route('sales.order.destroy', data.id), {
                            preserveScroll: true,
                        });
                    },
                    permission: 'delete_sales_order',
                    isHidden: (data) => data.status !== 'pending',
                },
            ],
        }),
    ].filter(Boolean) as ColumnDef<SalesOrder>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Orders" />

            <div className="rounded-lg bg-white px-8 py-6">
                <Heading title="Sales Orders" description="Manage your sales orders." />

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

                    {hasPermission('create_sales_order') && (
                        <Link href={route('sales.order.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Sales Order
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={salesOrders.data}
                    searchable={true}
                    searchPlaceholder="Search by order code or customer..."
                    searchValue={search}
                    onSearchChange={handleSearchChange}
                    serverPagination={{
                        pageCount: salesOrders.last_page,
                        currentPage: salesOrders.current_page,
                        totalItems: salesOrders.total,
                        isLoading: isLoading,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>
        </AppLayout>
    );
}
