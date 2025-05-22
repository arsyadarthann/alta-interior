import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import { FormDialog } from '@/components/form-dialog';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import InventoryLayout from '@/layouts/inventory/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

type ItemCategory = {
    id: number;
    name: string;
};

interface Props {
    itemCategories: ItemCategory[];
}

export default function ItemCategory({ itemCategories }: Props) {
    const { hasPermission } = usePermissions();
    const { showErrorToast } = useToastNotification();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItemCategory, setSelectedItemCategory] = useState<ItemCategory | undefined>();

    const createForm = useForm({
        name: '',
    });

    const editForm = useForm({
        name: selectedItemCategory ? selectedItemCategory.name : '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('category.store'), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset('name');
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemCategory) return;

        editForm.put(route('category.update', selectedItemCategory.id), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedItemCategory(undefined);
            },
        });
    };

    const columns: ColumnDef<ItemCategory>[] = [
        createNumberColumn<ItemCategory>(),
        {
            accessorKey: 'name',
            header: 'Category Name',
            cell: ({ row }: { row: Row<ItemCategory> }) => {
                return row.original.name;
            },
        },
        (hasPermission('update_item_category') || hasPermission('delete_item_category')) &&
            ActionColumn<ItemCategory>({
                hasPermission: hasPermission,
                actions: (itemCategory) => [
                    {
                        label: 'Edit',
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => {
                            setSelectedItemCategory(data);
                            editForm.setData('name', data.name);
                            setIsEditModalOpen(true);
                        },
                        permission: 'update_item_category',
                    },
                    {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4" />,
                        className: 'text-red-600',
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Delete Item Category',
                            description: `This action cannot be undone. This will permanently delete the "${itemCategory.name}" category.`,
                        },
                        onClick: (data) => {
                            router.delete(route('category.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_item_category',
                    },
                ],
            }),
    ].filter(Boolean) as ColumnDef<ItemCategory>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Item Category" />

            <InventoryLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall title="Item Category" description="Manage your item categories." />
                        {hasPermission('create_item_category') && (
                            <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add Item Category
                            </Button>
                        )}
                    </div>

                    <DataTable columns={columns} data={itemCategories} searchable={false} />

                    <FormDialog
                        title="Add Item Category"
                        description="Create a new category for your items."
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateSubmit}
                        isProcessing={createForm.processing}
                        submitLabel="Create"
                        processingLabel="Creating..."
                    >
                        <div className="relative grid gap-2 space-y-2">
                            <Label htmlFor="name">
                                Category Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                placeholder="Enter category name"
                                className={createForm.errors.name ? 'border-red-500 ring-red-100' : ''}
                            />
                        </div>
                    </FormDialog>

                    <FormDialog
                        title="Edit Item Category"
                        description="Update the item category name."
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSubmit={handleEditSubmit}
                        isProcessing={editForm.processing}
                        submitLabel="Save Changes"
                        processingLabel="Saving..."
                    >
                        <div className="relative grid gap-2 space-y-2">
                            <Label htmlFor="edit_name">Category Name</Label>
                            <Input
                                id="edit_name"
                                type="text"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                placeholder="Enter category name"
                                className={editForm.errors.name ? 'border-red-500 ring-red-100' : ''}
                            />
                        </div>
                    </FormDialog>
                </div>
            </InventoryLayout>
        </AppLayout>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Item Category',
        href: route('category.index'),
    },
];
