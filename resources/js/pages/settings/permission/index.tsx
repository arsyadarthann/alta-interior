import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { useToastNotification } from "@/hooks/use-toast-notification";
import {ColumnDef, Row} from "@tanstack/react-table";
import { createNumberColumn } from "@/components/data-table/columns";
import { ActionColumn } from "@/components/data-table/action-column";
import { Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/use-permissions";

type Permission = {
    id: number;
    name: string;
}

interface Props {
    permissions: Permission[];
    editingPermission?: Permission;
}

export default function Permission({ permissions, editingPermission }: Props) {
    const { hasPermission } = usePermissions();
    const { showErrorToast } = useToastNotification();

    const createForm = useForm({
        name: '',
    });

    const editForm = useForm({
        name: editingPermission?.name || '',
    });

    const handleCreateSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        createForm.post(route('permissions.store'), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                createForm.reset('name');
            }
        });
    };

    const handleEditSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        if (!editingPermission) return;

        editForm.put(route('permissions.update', editingPermission.id), {
            preserveScroll: true,
            onError: showErrorToast
        });
    };

    const orderedPermissions = [...permissions].sort((a, b) => {
        if (a.id === editingPermission?.id) return -1;
        if (b.id === editingPermission?.id) return 1;
        return 0;
    });


    // @ts-ignore
    const columns: ColumnDef<Permission>[] = [
        createNumberColumn<Permission>(),
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }: { row : Row<Permission>}) => row.original.name
        },
        (hasPermission('update_permission') || hasPermission('delete_permission')) && (
            ActionColumn<Permission>({
                hasPermission: hasPermission,
                isHighlighted: (permission) => permission.id === editingPermission?.id,
                actions: (permission) => [
                    {
                        label: "Edit",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('permissions.index', {
                            id: data.id
                        }), {
                            preserveScroll: true
                        }),
                        permission: 'update_permission',
                    },
                    {
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        className: "text-red-600",
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: "Delete Permission",
                            description: `This action cannot be undone. This will permanently delete ${permission.name}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('permissions.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_permission',
                    }
                ],
            })
        )
    ].filter(Boolean) as ColumnDef<Permission>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permissions" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Permissions"
                        description="Manage your permissions."
                    />

                    {editingPermission ? (
                        <form onSubmit={handleEditSubmit} className="mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-grow">
                                    <Label htmlFor="edit_name" className="sr-only">
                                        Permission Name
                                    </Label>
                                    <Input
                                        id="edit_name"
                                        type="text"
                                        value={editForm.data.name}
                                        onChange={e => editForm.setData('name', e.target.value)}
                                        placeholder="Enter permission name"
                                        className={editForm.errors.name ? "border-red-500 ring-red-100" : ""}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="px-8"
                                    >
                                        {editForm.processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit(route('permissions.index'))}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        hasPermission('create_permission') && (
                            <form onSubmit={handleCreateSubmit} className="mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex-grow">
                                        <Label htmlFor="name" className="sr-only">
                                            Permission Name
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={createForm.data.name}
                                            onChange={e => createForm.setData('name', e.target.value)}
                                            placeholder="Enter permission name"
                                            className={createForm.errors.name ? "border-red-500 ring-red-100" : ""}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="px-8"
                                    >
                                        {createForm.processing ? 'Creating...' : 'Create Permission'}
                                    </Button>
                                </div>
                            </form>
                        )
                    )}

                    <DataTable
                        columns={columns}
                        data={orderedPermissions}
                        rowClassName={(row) =>
                            row.original.id === editingPermission?.id ?
                                "bg-gray-200" : ""
                        }
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Permissions',
        href: route('permissions.index'),
    }
];
