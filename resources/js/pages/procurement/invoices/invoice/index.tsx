import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Procurement',
        href: '#',
    },
    {
        title: 'Invoice',
        href: '#',
    },
];

interface Props {
    purchaseInvoices: {
        data: PurchaseInvoice[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters?: {
        search?: string;
    };
}

type PurchaseInvoice = {
    id: number;
    code: string;
    date: string;
    due_date: string;
    supplier: {
        id: number;
        name: string;
    };
    grand_total: number;
    status: string;
    remaining_amount: number;
};

export default function Index({ purchaseInvoices, filters }: Props) {
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
            route('procurement.invoices.index'),
            { search: value, page: 1 }, // Reset page to 1 when search changes
            {
                preserveState: true,
                preserveScroll: true,
                only: ['purchaseInvoices'],
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

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const [year, month, day] = date.toISOString().split('T')[0].split('-');
        return `${year}-${month}-${day}`;
    };

    const getStatusBadge = (status: string) => {
        let variant = 'outline';
        let classes = '';
        let label = '';

        switch (status) {
            case 'unpaid':
                variant = 'outline';
                classes = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200';
                label = 'Unpaid';
                break;
            case 'partially_paid':
                variant = 'outline';
                classes = 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
                label = 'Partially Paid';
                break;
            case 'paid':
                variant = 'outline';
                classes = 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
                label = 'Paid';
                break;
            default:
                label = status.charAt(0).toUpperCase() + status.slice(1);
        }

        return (
            <Badge variant={variant as never} className={classes}>
                {label}
            </Badge>
        );
    };

    const columns: ColumnDef<PurchaseInvoice>[] = [
        createNumberColumn<PurchaseInvoice>(),
        {
            accessorKey: 'code',
            header: 'Code',
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }: { row: Row<PurchaseInvoice> }) => {
                const date = row.getValue('date') as string;
                return formatDate(date);
            },
        },
        {
            accessorKey: 'due_date',
            header: 'Due Date',
            cell: ({ row }: { row: Row<PurchaseInvoice> }) => {
                const date = row.getValue('due_date') as string;
                return formatDate(date);
            },
        },
        {
            accessorKey: 'supplier.name',
            header: 'Supplier',
        },
        {
            accessorKey: 'grand_total',
            header: 'Grand Total',
            cell: ({ row }: { row: Row<PurchaseInvoice> }) => {
                const grand_total = row.getValue('grand_total') as number;

                const formatCurrency = (value: number): string => {
                    const rounded = Math.round(value * 100) / 100;

                    const parts = rounded.toString().split('.');

                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

                    if (parts.length > 1 && parts[1] !== '00' && parseInt(parts[1]) !== 0) {
                        return 'Rp ' + parts[0] + ',' + (parts[1].length === 1 ? parts[1] + '0' : parts[1]);
                    }

                    return 'Rp ' + parts[0];
                };

                return formatCurrency(grand_total);
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: { row: Row<PurchaseInvoice> }) => {
                const status = row.getValue('status') as string;
                return getStatusBadge(status);
            },
        },
        ActionColumn<PurchaseInvoice>({
            hasPermission: hasPermission,
            actions: (purchaseInvoice) => [
                {
                    label: 'View Detail',
                    icon: <Eye className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('procurement.invoices.show', data.id)),
                    permission: 'read_purchase_invoice',
                },
                {
                    label: 'Edit',
                    icon: <Pencil className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('procurement.invoices.edit', data.id)),
                    permission: 'update_purchase_invoice',
                    isHidden: (data) => data.status !== 'unpaid',
                },
                {
                    label: 'Delete',
                    icon: <Trash2 className="h-4 w-4" />,
                    className: 'text-red-600',
                    showConfirmDialog: true,
                    confirmDialogProps: {
                        title: 'Delete Supplier Invoice',
                        description: `This action cannot be undone. This will permanently delete purchase order ${purchaseInvoice.code}.`,
                    },
                    onClick: (data) => {
                        router.delete(route('procurement.invoices.destroy', data.id), {
                            preserveScroll: true,
                        });
                    },
                    permission: 'delete_purchase_invoice',
                    isHidden: (data) => data.status !== 'unpaid',
                },
            ],
        }),
    ].filter(Boolean) as ColumnDef<PurchaseInvoice>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Supplier Invoice" />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="flex items-center justify-between">
                    <Heading title="Supplier Invoice" description="Manage your supplier invoice." />

                    {hasPermission('create_purchase_invoice') && (
                        <Link href={route('procurement.invoices.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Supplier Invoice
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={purchaseInvoices.data}
                    searchable={true}
                    searchPlaceholder="Search by code or supplier..."
                    searchValue={search}
                    onSearchChange={handleSearchChange}
                    serverPagination={{
                        pageCount: purchaseInvoices.last_page,
                        currentPage: purchaseInvoices.current_page,
                        totalItems: purchaseInvoices.total,
                        isLoading: isLoading,
                        onPageChange: (page) => {
                            router.get(
                                route('procurement.invoices.index'),
                                { page, search },
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                    only: ['purchaseInvoices'],
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
