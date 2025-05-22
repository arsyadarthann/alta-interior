import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import { FormDialog } from '@/components/form-dialog';
import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

type Warehouse = {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
};

interface Props {
    warehouses: Warehouse[];
}

export default function Warehouse({ warehouses }: Props) {
    const { hasPermission } = usePermissions();
    const { showErrorToast } = useToastNotification();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | undefined>();

    const createForm = useForm({
        name: '',
        description: '',
    });

    const editForm = useForm({
        name: selectedWarehouse ? selectedWarehouse.name : '',
        description: selectedWarehouse?.description || '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('warehouses.store'), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWarehouse) return;

        editForm.put(route('warehouses.update', selectedWarehouse.id), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedWarehouse(undefined);
            },
        });
    };

    const columns: ColumnDef<Warehouse>[] = [
        createNumberColumn<Warehouse>(),
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }: { row: Row<Warehouse> }) => row.original.name,
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }: { row: Row<Warehouse> }) => row.original.description || '-',
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }: { row: Row<Warehouse> }) => (
                <Badge variant={row.original.is_active ? 'success' : 'destructive'}>{row.original.is_active ? 'Active' : 'Inactive'}</Badge>
            ),
        },
        (hasPermission('update_warehouse') || hasPermission('delete_warehouse')) &&
            ActionColumn<Warehouse>({
                hasPermission: hasPermission,
                actions: (warehouse) => [
                    {
                        label: 'Edit',
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => {
                            setSelectedWarehouse(data);
                            editForm.setData({
                                name: data.name,
                                description: data.description || '',
                            });
                            setIsEditModalOpen(true);
                        },
                        permission: 'update_warehouse',
                    },
                    {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4" />,
                        className: 'text-red-600',
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Delete Warehouse',
                            description: `This action cannot be undone. This will permanently delete the warehouse "${warehouse.name}".`,
                        },
                        onClick: (data) => {
                            router.delete(route('warehouses.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_warehouse',
                    },
                ],
            }),
    ].filter(Boolean) as ColumnDef<Warehouse>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Warehouses" />

            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall title="Warehouses" description="Manage your warehouses." />
                        {hasPermission('create_warehouse') && (
                            <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add Warehouse
                            </Button>
                        )}
                    </div>

                    <DataTable columns={columns} data={warehouses} searchable={false} />

                    <FormDialog
                        title="Add Warehouse"
                        description="Create a new warehouse for your inventory."
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateSubmit}
                        isProcessing={createForm.processing}
                        submitLabel="Create"
                        processingLabel="Creating..."
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="Enter warehouse name"
                                    className={createForm.errors.name ? 'border-red-500 ring-red-100' : ''}
                                />
                                {createForm.errors.name && <p className="text-xs text-red-500">{createForm.errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                    placeholder="Enter warehouse description (optional)"
                                    className={createForm.errors.description ? 'border-red-500 ring-red-100' : ''}
                                />
                                {createForm.errors.description && <p className="text-xs text-red-500">{createForm.errors.description}</p>}
                            </div>
                        </div>
                    </FormDialog>

                    <FormDialog
                        title="Edit Warehouse"
                        description="Update the warehouse information."
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSubmit={handleEditSubmit}
                        isProcessing={editForm.processing}
                        submitLabel="Save Changes"
                        processingLabel="Saving..."
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_name">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="edit_name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    placeholder="Enter warehouse name"
                                    className={editForm.errors.name ? 'border-red-500 ring-red-100' : ''}
                                />
                                {editForm.errors.name && <p className="text-xs text-red-500">{editForm.errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit_description">Description</Label>
                                <Textarea
                                    id="edit_description"
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    placeholder="Enter warehouse description (optional)"
                                    className={editForm.errors.description ? 'border-red-500 ring-red-100' : ''}
                                />
                                {editForm.errors.description && <p className="text-xs text-red-500">{editForm.errors.description}</p>}
                            </div>
                        </div>
                    </FormDialog>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Warehouses',
        href: route('warehouses.index'),
    },
];
