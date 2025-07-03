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
        title: 'Customers',
        href: route('customers.index'),
    },
];

interface Props {
    customers: {
        data: Customer[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters?: {
        search?: string;
    };
}

type Customer = {
    id: number;
    name: string;
    contact_name: string;
    email: string | null;
    phone: string;
    address: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    unpaid_invoices_count: number;
    total_receivable: string;
};

export default function Index({ customers, filters }: Props) {
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

    // Debounced search handler untuk mengurangi request berlebihan
    const debouncedSearch = useDebounce((value: string) => {
        router.get(
            route('customers.index'),
            { search: value, page: 1 }, // Reset page ke 1 ketika search berubah
            {
                preserveState: true,
                preserveScroll: true,
                only: ['customers'],
                onBefore: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            },
        );
    }, 500);

    // Set search state ketika component mount
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

    // Format currency helper
    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(parseFloat(amount));
    };

    const columns: ColumnDef<Customer>[] = [
        createNumberColumn<Customer>(),
        {
            accessorKey: 'name',
            header: 'Company Name',
        },
        {
            accessorKey: 'contact_name',
            header: 'Contact Person',
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }: { row: Row<Customer> }) => {
                const email = row.getValue('email') as string | null;
                return email ? email : '-';
            },
        },
        {
            accessorKey: 'phone',
            header: 'Phone',
        },
        {
            accessorKey: 'address',
            header: 'Address',
        },
        {
            accessorKey: 'unpaid_invoices_count',
            header: 'Unpaid Invoices',
            cell: ({ row }: { row: Row<Customer> }) => {
                const count = row.getValue('unpaid_invoices_count') as number;
                if (count === 0) {
                    return <Badge variant="secondary">0</Badge>;
                }
                return <Badge variant={count > 0 ? 'destructive' : 'secondary'}>{count}</Badge>;
            },
        },
        {
            accessorKey: 'total_receivable',
            header: 'Outstanding',
            cell: ({ row }: { row: Row<Customer> }) => {
                const amount = row.getValue('total_receivable') as string;
                const numAmount = parseFloat(amount);
                return <span className={numAmount > 0 ? 'font-medium text-red-600' : 'text-gray-500'}>{formatCurrency(amount)}</span>;
            },
        },
        ActionColumn<Customer>({
            hasPermission,
            actions: (customer) => [
                {
                    label: 'View Details',
                    icon: <Eye className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('customers.show', data.id)),
                    permission: 'read_customer',
                },
                {
                    label: 'Edit',
                    icon: <Pencil className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('customers.edit', data.id)),
                    permission: 'update_customer',
                },
                {
                    label: 'Delete',
                    icon: <Trash2 className="h-4 w-4" />,
                    className: 'text-red-600',
                    showConfirmDialog: true,
                    confirmDialogProps: {
                        title: 'Delete Customer',
                        description: `This action cannot be undone. This will permanently delete ${customer.name}.`,
                    },
                    onClick: (data) => {
                        router.delete(route('customers.destroy', data.id), {
                            preserveScroll: true,
                        });
                    },
                    permission: 'delete_customer',
                },
            ],
        }),
    ].filter(Boolean) as ColumnDef<Customer>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customers" />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="flex items-center justify-between">
                    <Heading title="Customer" description="Manage your customers." />
                    {hasPermission('create_customer') && (
                        <Link href={route('customers.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Customer
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={customers.data}
                    searchable={true}
                    searchPlaceholder="Search by company name..."
                    searchValue={search}
                    onSearchChange={handleSearchChange}
                    serverPagination={{
                        pageCount: customers.last_page,
                        currentPage: customers.current_page,
                        totalItems: customers.total,
                        isLoading: isLoading,
                        onPageChange: (page) => {
                            router.get(
                                route('customers.index'),
                                { page, search },
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                    only: ['customers'],
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
