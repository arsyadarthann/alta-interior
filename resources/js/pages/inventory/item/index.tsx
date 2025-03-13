import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import InventoryLayout from '@/layouts/inventory/layout';
import HeadingSmall from '@/components/heading-small';
import { useToastNotification } from "@/hooks/use-toast-notification";
import { ColumnDef, Row } from "@tanstack/react-table";
import { createNumberColumn } from "@/components/data-table/columns";
import { ActionColumn } from "@/components/data-table/action-column";
import { Pencil, Plus, Trash2, FilterIcon } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/use-permissions";
import { FormDialog } from "@/components/form-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ItemCategory = {
    id: number;
    name: string;
}

type ItemUnit = {
    id: number;
    name: string;
    abbreviation: string;
}

type Branch = {
    id: number;
    name: string;
}

type Item = {
    id: number;
    name: string;
    code: string;
    item_category_id: number;
    item_unit_id: number;
    price: number;
    item_category?: ItemCategory;
    item_unit?: ItemUnit;
    stock?: number;
}

interface Props {
    items: Item[];
    itemCategories: ItemCategory[];
    itemUnits: ItemUnit[];
    branches: Branch[];
    selectedBranchId?: string;
}

export default function Item({ items, itemCategories, itemUnits, branches, selectedBranchId = '' }: Props) {
    const { hasPermission } = usePermissions();
    const { showErrorToast } = useToastNotification();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | undefined>();
    const [currentBranchId, setCurrentBranchId] = useState(selectedBranchId || branches[0]?.id?.toString() || "");

    const createForm = useForm({
        name: '',
        code: '',
        item_category_id: '',
        item_unit_id: '',
        price: '',
    });

    const editForm = useForm({
        name: '',
        code: '',
        item_category_id: '',
        item_unit_id: '',
        price: '',
    });

    const handleBranchChange = (value: string) => {
        setCurrentBranchId(value);
        router.get(route('item.index'), { branch_id: value }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('item.store'), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        editForm.put(route('item.update', selectedItem.id), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedItem(undefined);
            }
        });
    };

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    }

    const columns: ColumnDef<Item>[] = [
        createNumberColumn<Item>(),
        {
            accessorKey: "code",
            header: "Code",
            cell: ({ row }: { row: Row<Item> }) => {
                return row.original.code;
            }
        },
        {
            accessorKey: "name",
            header: "Item Name",
            cell: ({ row }: { row: Row<Item> }) => {
                return row.original.name;
            }
        },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }: { row: Row<Item> }) => {
                return row.original.item_category?.name || '-';
            }
        },
        {
            accessorKey: "stock",
            header: "Stock",
            cell: ({ row }: { row: Row<Item> }) => {
                return row.original.stock !== undefined ? row.original.stock + ' ' + row.original.item_unit?.abbreviation : '-';
            }
        },
        {
            accessorKey: "price",
            header: "Price",
            cell: ({ row }: { row: Row<Item> }) => {
                return formatPrice(row.original.price);
            }
        },
        (hasPermission('update_item') || hasPermission('delete_item')) && (
            ActionColumn<Item>({
                hasPermission: hasPermission,
                actions: (item) => [
                    {
                        label: "Edit",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => {
                            setSelectedItem(data);
                            editForm.setData({
                                name: data.name,
                                code: data.code,
                                item_category_id: data.item_category_id.toString(),
                                item_unit_id: data.item_unit_id.toString(),
                                price: data.price.toString(),
                            });
                            setIsEditModalOpen(true);
                        },
                        permission: 'update_item',
                    },
                    {
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        className: "text-red-600",
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: "Delete Item",
                            description: `This action cannot be undone. This will permanently delete the "${item.name}" item.`,
                        },
                        onClick: (data) => {
                            router.delete(route('item.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_item',
                    }
                ],
            })
        )
    ].filter(Boolean) as ColumnDef<Item>[];

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Items',
            href: route('item.index'),
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Items" />

            <InventoryLayout fullWidth>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Items"
                        description="Manage your inventory items."
                    />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="branch_id" className="whitespace-nowrap">Branch:</Label>
                            <Select
                                value={currentBranchId}
                                onValueChange={handleBranchChange}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id.toString()}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {hasPermission('create_item') && (
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Item
                            </Button>
                        )}
                    </div>

                    <DataTable
                        columns={columns}
                        data={items}
                    />

                    <FormDialog
                        title="Add Item"
                        description="Create a new item for your inventory."
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateSubmit}
                        isProcessing={createForm.processing}
                        submitLabel="Create"
                        processingLabel="Creating..."
                    >
                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="name">
                                Item Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={createForm.data.name}
                                onChange={e => createForm.setData('name', e.target.value)}
                                placeholder="Enter item name"
                                className={createForm.errors.name ? "border-red-500 ring-red-100" : ""}
                            />
                        </div>

                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="code">
                                Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="code"
                                type="text"
                                value={createForm.data.code}
                                onChange={e => createForm.setData('code', e.target.value)}
                                placeholder="Enter item code"
                                className={createForm.errors.code ? "border-red-500 ring-red-100" : ""}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 relative grid gap-2">
                                <Label htmlFor="item_category_id">
                                    Category <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={createForm.data.item_category_id}
                                    onValueChange={(value) => createForm.setData('item_category_id', value)}
                                >
                                    <SelectTrigger
                                        className={createForm.errors.item_category_id ? "border-red-500 ring-red-100" : ""}
                                    >
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {itemCategories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 relative grid gap-2">
                                <Label htmlFor="item_unit_id">
                                    Unit <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={createForm.data.item_unit_id}
                                    onValueChange={(value) => createForm.setData('item_unit_id', value)}
                                >
                                    <SelectTrigger
                                        className={createForm.errors.item_unit_id ? "border-red-500 ring-red-100" : ""}
                                    >
                                        <SelectValue placeholder="Select a unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {itemUnits.map((unit) => (
                                            <SelectItem key={unit.id} value={unit.id.toString()}>
                                                {unit.name} ({unit.abbreviation})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="price">
                                Price <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center">
                                <span className="mr-2 text-sm text-muted-foreground">Rp</span>
                                <Input
                                    id="price"
                                    type="number"
                                    value={createForm.data.price}
                                    onChange={e => createForm.setData('price', e.target.value)}
                                    placeholder="Enter price"
                                    className={createForm.errors.price ? "border-red-500 ring-red-100" : ""}
                                />
                            </div>
                        </div>
                    </FormDialog>

                    <FormDialog
                        title="Edit Item"
                        description="Update the item details."
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSubmit={handleEditSubmit}
                        isProcessing={editForm.processing}
                        submitLabel="Save Changes"
                        processingLabel="Saving..."
                    >
                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="edit_name">
                                Item Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit_name"
                                type="text"
                                value={editForm.data.name}
                                onChange={e => editForm.setData('name', e.target.value)}
                                placeholder="Enter item name"
                                className={editForm.errors.name ? "border-red-500 ring-red-100" : ""}
                            />
                        </div>

                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="edit_code">
                                Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit_code"
                                type="text"
                                value={editForm.data.code}
                                onChange={e => editForm.setData('code', e.target.value)}
                                placeholder="Enter item code"
                                className={editForm.errors.code ? "border-red-500 ring-red-100" : ""}
                            />
                        </div>

                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="edit_item_category_id">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={editForm.data.item_category_id}
                                onValueChange={(value) => editForm.setData('item_category_id', value)}
                            >
                                <SelectTrigger
                                    className={editForm.errors.item_category_id ? "border-red-500 ring-red-100" : ""}
                                >
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {itemCategories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="edit_item_unit_id">
                                Unit <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={editForm.data.item_unit_id}
                                onValueChange={(value) => editForm.setData('item_unit_id', value)}
                            >
                                <SelectTrigger
                                    className={editForm.errors.item_unit_id ? "border-red-500 ring-red-100" : ""}
                                >
                                    <SelectValue placeholder="Select a unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {itemUnits.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id.toString()}>
                                            {unit.name} ({unit.abbreviation})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 relative grid gap-2">
                            <Label htmlFor="edit_price">
                                Price <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center">
                                <span className="mr-2 text-sm text-muted-foreground">Rp</span>
                                <Input
                                    id="edit_price"
                                    type="number"
                                    value={editForm.data.price}
                                    onChange={e => editForm.setData('price', e.target.value)}
                                    placeholder="Enter price"
                                    className={editForm.errors.price ? "border-red-500 ring-red-100" : ""}
                                />
                            </div>
                        </div>
                    </FormDialog>
                </div>
            </InventoryLayout>
        </AppLayout>
    );
}
