import React from 'react';
import {Head, Link, router} from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Eye, Plus } from 'lucide-react';
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import Heading from "@/components/heading";
import { useToastNotification } from "@/hooks/use-toast-notification";
import {createNumberColumn} from "@/components/data-table/columns";
import {ActionColumn} from "@/components/data-table/action-column";
import { Pencil, Trash2 } from "lucide-react";
import {usePermissions} from "@/hooks/use-permissions";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: route('customers.index'),
    }
];

interface Props {
    customers: Customer[];
}

type Customer = {
    id: number;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
}

export default function Index({ customers } : Props) {
    useToastNotification();
    const { hasPermission } = usePermissions();

    const columns: ColumnDef<Customer>[] = [
        createNumberColumn<Customer>(),
        {
            accessorKey: "name",
            header: "Company Name",
        },
        {
            accessorKey: "contact_name",
            header: "Contact Person",
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "phone",
            header: "Phone",
        },
        {
            accessorKey: "address",
            header: "Address",
        },
        (hasPermission('update_customer') || hasPermission('delete_customer')) && (
            ActionColumn<Customer>({
                hasPermission: hasPermission,
                actions: (customer) => [
                    {
                        label: "View Details",
                        icon: <Eye className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('customers.show', data.id)),
                        permission: 'read_customer',
                    },
                    {
                        label: "Edit",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('customers.edit', data.id)),
                        permission: 'update_customer',
                    },
                    {
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        className: "text-red-600",
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: "Delete Customer",
                            description: `This action cannot be undone. This will permanently delete ${customer.name}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('customers.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_customer',
                    },
                ]
            })
        )
    ].filter(Boolean) as ColumnDef<Customer>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customers" />

            <div className="bg-white rounded-lg px-8 py-6">
                <div className="flex justify-between items-center">
                    <Heading title="Customer" description="Manage your customers." />
                    { hasPermission('create_customer') && (
                        <Link href={route('customers.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Customer
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable columns={columns} data={customers} />
            </div>
        </AppLayout>
    );
}
