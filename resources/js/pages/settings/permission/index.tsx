import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { useToastNotification } from "@/hooks/use-toast-notification";
import { ColumnDef, Row } from "@tanstack/react-table";
import { createNumberColumn } from "@/components/data-table/columns";
import { ActionColumn } from "@/components/data-table/action-column";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/use-permissions";
import { FormDialog } from "@/components/form-dialog";

type Permission = {
    id: number;
    name: string;
}

interface Props {
    permissions: Permission[];
}

export default function Permission({ permissions }: Props) {
    const { hasPermission } = usePermissions();
    const { showErrorToast } = useToastNotification();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState<Permission | undefined>();

    const createForm = useForm({
        name: '',
    });

    const editForm = useForm({
        name: selectedPermission?.name || '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('permissions.store'), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset('name');
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPermission) return;

        editForm.put(route('permissions.update', selectedPermission.id), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedPermission(undefined);
            }
        });
    };

    const columns: ColumnDef<Permission>[] = [
        createNumberColumn<Permission>(),
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }: { row: Row<Permission> }) => row.original.name
        },
        (hasPermission('update_permission') || hasPermission('delete_permission')) && (
            ActionColumn<Permission>({
                hasPermission: hasPermission,
                actions: (permission) => [
                    {
                        label: "Edit",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => {
                            setSelectedPermission(data);
                            editForm.setData('name', data.name);
                            setIsEditModalOpen(true);
                        },
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
                    <div className="flex items-center justify-between">
                        <HeadingSmall
                            title="Permissions"
                            description="Manage your permissions."
                        />

                        {hasPermission('create_permission') && (
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Permission
                            </Button>
                        )}
                    </div>

                    <DataTable
                        columns={columns}
                        data={permissions}
                    />

                    <FormDialog
                        title="Add Permission"
                        description="Add a new permission to the system."
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateSubmit}
                        isProcessing={createForm.processing}
                        submitLabel="Create"
                        processingLabel="Creating..."
                    >
                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="name">Permission Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={createForm.data.name}
                                onChange={e => createForm.setData('name', e.target.value)}
                                placeholder="Enter permission name"
                                className={createForm.errors.name ? "border-red-500 ring-red-100" : ""}
                            />
                        </div>
                    </FormDialog>

                    <FormDialog
                        title="Edit Permission"
                        description="Update permission details."
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSubmit={handleEditSubmit}
                        isProcessing={editForm.processing}
                        submitLabel="Save Changes"
                        processingLabel="Saving..."
                    >
                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="edit_name">Permission Name</Label>
                            <Input
                                id="edit_name"
                                type="text"
                                value={editForm.data.name}
                                onChange={e => editForm.setData('name', e.target.value)}
                                placeholder="Enter permission name"
                                className={editForm.errors.name ? "border-red-500 ring-red-100" : ""}
                            />
                        </div>
                    </FormDialog>
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
