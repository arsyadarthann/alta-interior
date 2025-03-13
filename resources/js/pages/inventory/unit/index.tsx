import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import InventoryLayout from '@/layouts/inventory/layout';
import HeadingSmall from '@/components/heading-small';
import { useToastNotification } from "@/hooks/use-toast-notification";
import { ColumnDef, Row } from "@tanstack/react-table";
import { createNumberColumn } from "@/components/data-table/columns";
import { ActionColumn } from "@/components/data-table/action-column";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/use-permissions";
import { FormDialog } from "@/components/form-dialog";

type ItemUnit = {
    id: number;
    name: string;
    abbreviation: string;
}

interface Props {
    itemUnits: ItemUnit[];
}

export default function ItemUnit({ itemUnits }: Props) {
    const { hasPermission } = usePermissions();
    const { showErrorToast } = useToastNotification();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItemUnit, setSelectedItemUnit] = useState<ItemUnit | undefined>();

    const createForm = useForm({
        name: '',
        abbreviation: '',
    });

    const editForm = useForm({
        name: selectedItemUnit ? selectedItemUnit.name : '',
        abbreviation: selectedItemUnit ? selectedItemUnit.abbreviation : '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('unit.store'), {
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
        if (!selectedItemUnit) return;

        editForm.put(route('unit.update', selectedItemUnit.id), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedItemUnit(undefined);
            }
        });
    };

    const columns: ColumnDef<ItemUnit>[] = [
        createNumberColumn<ItemUnit>(),
        {
            accessorKey: "name",
            header: "Unit Name",
            cell: ({ row }: { row: Row<ItemUnit> }) => {
                return row.original.name;
            }
        },
        {
            accessorKey: "abbreviation",
            header: "Abbreviation",
            cell: ({ row }: { row: Row<ItemUnit> }) => {
                return row.original.abbreviation;
            }
        },
        (hasPermission('update_item_unit') || hasPermission('delete_item_unint')) && (
            ActionColumn<ItemUnit>({
                hasPermission: hasPermission,
                actions: (itemUnit) => [
                    {
                        label: "Edit",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => {
                            setSelectedItemUnit(data);
                            editForm.setData({
                                name: data.name,
                                abbreviation: data.abbreviation,
                            });
                            setIsEditModalOpen(true);
                        },
                        permission: 'update_item_unit',
                    },
                    {
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        className: "text-red-600",
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: "Delete Item Unit",
                            description: `This action cannot be undone. This will permanently delete the "${itemUnit.name}" unit.`,
                        },
                        onClick: (data) => {
                            router.delete(route('unit.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_item_unit',
                    }
                ],
            })
        )
    ].filter(Boolean) as ColumnDef<ItemUnit>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Item Unit" />

            <InventoryLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall
                            title="Item Unit"
                            description="Manage your item units."
                        />
                        {hasPermission('create_item_unit') && (
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Item Unit
                            </Button>
                        )}
                    </div>

                    <DataTable
                        columns={columns}
                        data={itemUnits}
                    />

                    <FormDialog
                        title="Add Item Unit"
                        description="Create a new unit for your items."
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateSubmit}
                        isProcessing={createForm.processing}
                        submitLabel="Create"
                        processingLabel="Creating..."
                    >
                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="name">
                                Unit Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={createForm.data.name}
                                onChange={e => createForm.setData('name', e.target.value)}
                                placeholder="Enter unit name"
                                className={createForm.errors.name ? "border-red-500 ring-red-100" : ""}
                            />
                        </div>
                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="abbreviation">
                                Abbreviation <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="abbreviation"
                                type="text"
                                value={createForm.data.abbreviation}
                                onChange={e => createForm.setData('abbreviation', e.target.value)}
                                placeholder="Enter abbreviation"
                                className={createForm.errors.abbreviation ? "border-red-500 ring-red-100" : ""}
                            />
                        </div>
                    </FormDialog>

                    <FormDialog
                        title="Edit Item Unit"
                        description="Update the item unit name."
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSubmit={handleEditSubmit}
                        isProcessing={editForm.processing}
                        submitLabel="Save Changes"
                        processingLabel="Saving..."
                    >
                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="edit_name">Unit Name</Label>
                            <Input
                                id="edit_name"
                                type="text"
                                value={editForm.data.name}
                                onChange={e => editForm.setData('name', e.target.value)}
                                placeholder="Enter category name"
                                className={editForm.errors.name ? "border-red-500 ring-red-100" : ""}
                            />
                        </div>
                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="edit_abbreviation">Unit Name</Label>
                            <Input
                                id="edit_abbreviation"
                                type="text"
                                value={editForm.data.abbreviation}
                                onChange={e => editForm.setData('abbreviation', e.target.value)}
                                placeholder="Enter abbreviation"
                                className={editForm.errors.abbreviation ? "border-red-500 ring-red-100" : ""}
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
        title: 'Item Unit',
        href: route('unit.index'),
    }
];
