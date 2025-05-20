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
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
}

type Customer = {
    id: number;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
};

export default function Index({ customers }: Props) {
    useToastNotification();
    const { hasPermission } = usePermissions();
    const [, setIsLoading] = useState(false);

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
                    serverPagination={{
                        pageCount: customers.last_page,
                        currentPage: customers.current_page,
                        totalItems: customers.total,
                        onPageChange: (page) => {
                            router.get(
                                route('customers.index'),
                                { page },
                                {
                                    preserveState: true,
                                    preserveScroll: true,
                                    only: ['customers'],
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
