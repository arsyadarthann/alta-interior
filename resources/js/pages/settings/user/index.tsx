import { type BreadcrumbItem } from '@/types';
import {Head, router} from '@inertiajs/react';
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { useToastNotification } from "@/hooks/use-toast-notification";
import {ColumnDef, Row} from "@tanstack/react-table";
import { createNumberColumn } from "@/components/data-table/columns";
import { ActionColumn } from "@/components/data-table/action-column";
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Account',
        href: route('users.index'),
    }
]

type User = {
    id: number;
    name: string;
    email: string;
    roles: [
        {
            id: number;
            name: string;
        }
    ];
}

interface Props {
    users: User[];
}

export default function User({ users } : Props) {
    useToastNotification();
    const { hasPermission } = usePermissions();

    const formatRoleName = (name: string): string => {
        return name
            .split(/[_\s-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const columns: ColumnDef<User>[] = [
        createNumberColumn<User>(),
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }: { row: Row<User> }) => row.original.name
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }: { row: Row<User> }) => row.original.email
        },
        {
            accessorKey: "roles",
            header: "Roles",
            cell: ({ row }: { row: Row<User> }) => formatRoleName(row.original.roles[0].name),
        },
        (hasPermission('update_user') || hasPermission('delete_user')) && (
            ActionColumn<User>({
                hasPermission: hasPermission,
                actions: (user) => [
                    {
                        label: "Edit",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('users.edit', data.id)),
                        permission: 'update_user',
                    },
                    {
                        label: "Reset Password",
                        icon: <KeyRound className="h-4 w-4" />,
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: "Reset Password",
                            description: `Are you sure you want to reset the password for ${user.name}?`,
                            buttonClassName: "bg-slate-950 hover:bg-gray-900",
                            buttonText: "Reset Password",
                        },
                        onClick: (data) => router.patch(route('users.reset-password', data.id)),
                        permission: 'update_user',
                    },
                    {
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        className: "text-red-600",
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: "Delete User",
                            description: `This action cannot be undone. This will permanently delete ${user.name}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('users.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_user',
                    }
                ]
            })
        )
    ].filter(Boolean) as ColumnDef<User>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Account" />
            <SettingsLayout fullWidth>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall
                            title="User Account"
                            description="Manage your user account."
                        />

                        { hasPermission('create_user') && (
                            <Button
                                onClick={() => router.visit(route('users.create'))}
                            >
                                <Plus className="h-4 w-4" />
                                Add User
                            </Button>
                        )}
                    </div>

                    <DataTable
                        data={users}
                        columns={columns}
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    )
}

