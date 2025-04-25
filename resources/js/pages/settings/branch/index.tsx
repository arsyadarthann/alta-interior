import { type BreadcrumbItem } from '@/types';
import {Head, router} from '@inertiajs/react';
import React, { useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { useToastNotification } from "@/hooks/use-toast-notification";
import {ColumnDef, Row} from "@tanstack/react-table";
import { createNumberColumn } from "@/components/data-table/columns";
import { ActionColumn } from "@/components/data-table/action-column";
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Branch',
        href: route('branches.index'),
    }
]

type Branch = {
    id: number;
    name: string;
    initial: string;
    contact: string;
    address: string;

}

interface Props {
    branches: Branch[];
}

export default function Branch({ branches } : Props) {
    useToastNotification();
    const { hasPermission } = usePermissions();

    const columns: ColumnDef<Branch>[] = [
        createNumberColumn<Branch>(),
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }: { row: Row<Branch> }) => row.original.name
        },
        {
            accessorKey: "initial",
            header: "Initial",
            cell: ({ row }: { row: Row<Branch> }) => row.original.initial
        },
        {
            accessorKey: "contact",
            header: "Contact",
            cell: ({ row }: { row: Row<Branch> }) => row.original.contact,
        },
        {
            accessorKey: "address",
            header: "Address",
            cell: ({ row }: { row: Row<Branch> }) => row.original.address,
        },
        (hasPermission('update_branch') || hasPermission('delete_branch')) && (
            ActionColumn<Branch>({
                hasPermission: hasPermission,
                actions: (branch) => [
                    {
                        label: "Edit",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('branches.edit', data.id)),
                        permission: 'update_branch',
                    },
                    {
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        className: "text-red-600",
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: "Delete Branch",
                            description: `This action cannot be undone. This will permanently delete ${branch.name}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('branches.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_branch',
                    }
                ]
            })
        )
    ].filter(Boolean) as ColumnDef<Branch>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branch" />
            <SettingsLayout fullWidth>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall
                            title="Branch"
                            description="Manage your branch."
                        />

                        { hasPermission('create_branch') && (
                            <Button
                                onClick={() => router.visit(route('branches.create'))}
                            >
                                <Plus className="h-4 w-4" />
                                Add Branch
                            </Button>
                        )}
                    </div>

                    <DataTable
                        data={branches}
                        columns={columns}
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    )
}

