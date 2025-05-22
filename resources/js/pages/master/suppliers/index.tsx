import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Row, type ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Suppliers',
        href: route('suppliers.index'),
    },
];

interface Props {
    suppliers: {
        data: Supplier[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters?: {
        search?: string;
    };
}

type Supplier = {
    id: number;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
};

export default function Index({ suppliers, filters }: Props) {
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

    // Debounced search handler
    const debouncedSearch = useDebounce((value: string) => {
        router.get(
            route('suppliers.index'),
            { search: value, page: 1 }, // Reset page ke 1 ketika search berubah
            {
                preserveState: true,
                preserveScroll: true,
                only: ['suppliers'],
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

    const columns: ColumnDef<Supplier>[] = [
        createNumberColumn<Supplier>(),
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
            cell: ({ row }: { row: Row<Supplier> }) => {
                const email = row.getValue('email') as string;
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
        (hasPermission('update_supplier') || hasPermission('delete_supplier')) &&
            ActionColumn<Supplier>({
                hasPermission: hasPermission,
                actions: (supplier) => [
                    {
                        label: 'Edit',
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('suppliers.edit', data.id)),
                        permission: 'update_supplier',
                    },
                    {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4" />,
                        className: 'text-red-600',
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Delete Supplier',
                            description: `This action cannot be undone. This will permanently delete ${supplier.name}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('suppliers.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_supplier',
                    },
                ],
            }),
    ].filter(Boolean) as ColumnDef<Supplier>[];

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        router.get(
            route('suppliers.index'),
            { page, search },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['suppliers'],
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suppliers" />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="flex items-center justify-between">
                    <Heading title="Supplier" description="Manage your suppliers." />
                    {hasPermission('create_supplier') && (
                        <Link href={route('suppliers.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Supplier
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={suppliers.data}
                    searchable={true}
                    searchPlaceholder="Search by company name"
                    searchValue={search}
                    onSearchChange={handleSearchChange}
                    serverPagination={{
                        pageCount: suppliers.last_page,
                        currentPage: suppliers.current_page,
                        totalItems: suppliers.total,
                        isLoading: isLoading,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>
        </AppLayout>
    );
}
