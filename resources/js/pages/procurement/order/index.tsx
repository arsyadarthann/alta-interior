import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Printer, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Procurement',
        href: '#',
    },
    {
        title: 'Purchase Order',
        href: '#',
    },
];

interface Props {
    purchaseOrders: {
        data: PurchaseOrder[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters?: {
        search?: string;
    };
}

type PurchaseOrder = {
    id: number;
    code: string;
    date: string;
    supplier: {
        id: number;
        name: string;
    };
    expected_delivery_date: string;
    status: string;
};

export default function Index({ purchaseOrders, filters }: Props) {
    useToastNotification();
    const { hasPermission } = usePermissions();
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');

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
        router.get(
            route('procurement.order.index'),
            { search: value, page: 1 }, // Reset page to 1 when search changes
            {
                preserveState: true,
                preserveScroll: true,
                only: ['purchaseOrders'],
                onBefore: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            },
        );
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

    const columns: ColumnDef<PurchaseOrder>[] = [
        createNumberColumn<PurchaseOrder>(),
        {
            accessorKey: 'code',
            header: 'Code',
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }: { row: Row<PurchaseOrder> }) => {
                const date = row.getValue('date') as string;

                return formatDate(date);
            },
        },
        {
            accessorKey: 'supplier.name',
            header: 'Supplier',
        },
        {
            accessorKey: 'expected_delivery_date',
            header: 'Expected Delivery',
            cell: ({ row }: { row: Row<PurchaseOrder> }) => {
                const expected_delivery_date = row.getValue('expected_delivery_date') as string;

                return formatDate(expected_delivery_date);
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: { row: Row<PurchaseOrder> }) => {
                const status = row.getValue('status') as string;

                let variant = 'outline';
                let classes = '';
                let label = '';

                if (status === 'pending') {
                    variant = 'outline';
                    classes = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200';
                    label = 'Pending';
                } else if (status === 'partially_received') {
                    variant = 'outline';
                    classes = 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
                    label = 'Partially Received';
                } else if (status === 'received') {
                    variant = 'outline';
                    classes = 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
                    label = 'Received';
                }

                return (
                    <Badge variant={variant as never} className={classes}>
                        {label}
                    </Badge>
                );
            },
        },
        (hasPermission('update_stock_audit') || hasPermission('delete_stock_audit')) &&
            ActionColumn<PurchaseOrder>({
                hasPermission: hasPermission,
                actions: (purchaseOrder) => [
                    {
                        label: 'View Detail',
                        icon: <Eye className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('procurement.order.show', data.id)),
                        permission: 'read_purchase_order',
                    },
                    {
                        label: 'Edit',
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('procurement.order.edit', data.id)),
                        permission: 'update_purchase_order',
                        isHidden: (data) => data.status !== 'pending',
                    },
                    {
                        label: 'Print PDF',
                        icon: <Printer className="h-4 w-4" />,
                        onClick: (data) => {
                            window.open(route('procurement.order.generate-pdf', data.id), '_blank');
                        },
                        permission: 'read_purchase_order',
                    },
                    {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4" />,
                        className: 'text-red-600',
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Delete Purchase Order',
                            description: `This action cannot be undone. This will permanently delete purchase order ${purchaseOrder.code}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('procurement.order.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_purchase_order',
                        isHidden: (data) => data.status !== 'pending',
                    },
                ],
            }),
    ].filter(Boolean) as ColumnDef<PurchaseOrder>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Order" />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="flex items-center justify-between">
                    <Heading title="Purchase Order" description="Manage your purchase orders." />

                    {hasPermission('create_purchase_order') && (
                        <Link href={route('procurement.order.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Purchase Order
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={purchaseOrders.data}
                    searchable={true}
                    searchPlaceholder="Search by code or supplier..."
                    searchValue={search}
                    onSearchChange={handleSearchChange}
                    serverPagination={{
                        pageCount: purchaseOrders.last_page,
                        currentPage: purchaseOrders.current_page,
                        totalItems: purchaseOrders.total,
                        isLoading: isLoading,
                        onPageChange: (page) => {
                            router.get(
                                route('procurement.order.index'),
                                { page, search },
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                    only: ['purchaseOrders'],
                                    onBefore: () => setIsLoading(true),
                                    onFinish: () => setIsLoading(false),
                                },
                            );
                        },
                    }}
                />
            </div>
        </AppLayout>
    );
}
