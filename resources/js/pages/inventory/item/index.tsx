import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { BatchItemsTable } from '@/components/data-table/batch-items-table';
import { createNumberColumn } from '@/components/data-table/columns';
import { FormDialog } from '@/components/form-dialog';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import InventoryLayout from '@/layouts/inventory/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ItemCategory = {
    id: number;
    name: string;
};

type ItemWholesaleUnit = {
    id: number;
    name: string;
    abbreviation: string;
};

type ItemUnit = {
    id: number;
    name: string;
    abbreviation: string;
};

type Branch = {
    id: number;
    name: string;
};

type Warehouse = {
    id: number;
    name: string;
};

type Item = {
    id: number;
    name: string;
    code: string;
    item_category_id: number;
    item_wholesale_unit_id?: number;
    item_unit_id: number;
    wholesale_unit_conversion?: number;
    price: number;
    item_category?: ItemCategory;
    item_wholesale_unit?: ItemWholesaleUnit;
    item_unit?: ItemUnit;
    stock?: number;
};

type SourceItem = {
    id: number;
    name: string;
    type: 'Branch' | 'Warehouse';
};

interface Props {
    items: {
        data: Item[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    itemCategories: ItemCategory[];
    itemWholesaleUnits: ItemWholesaleUnit[];
    itemUnits: ItemUnit[];
    warehouses: Warehouse[];
    branches: Branch[];
    selectedSourceAbleId?: string;
    selectedSourceAbleType?: string;
    filters?: {
        search?: string;
    };
}

export default function Item({
    items,
    itemCategories,
    itemWholesaleUnits,
    itemUnits,
    warehouses,
    branches,
    selectedSourceAbleId = '',
    selectedSourceAbleType = '',
    filters,
}: Props) {
    const { hasPermission } = usePermissions();
    const { showErrorToast } = useToastNotification();
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | undefined>();
    const { auth } = usePage().props as unknown as { auth: { user: { branch_id: number | null } } };
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');

    const getSourceFromSelectedValue = (value: string): { id: number; type: string } => {
        const [type, idStr] = value.split(':');
        return {
            id: parseInt(idStr, 10), // Pastikan parsing ke integer
            type: type,
        };
    };

    // Custom debounce hook
    function useDebounce(callback: Function, delay: number) {
        const timeoutRef = useRef<NodeJS.Timeout>();

        return useCallback(
            (...args: any[]) => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => {
                    callback(...args);
                }, delay);
            },
            [callback, delay],
        );
    }

    // Debounced search handler
    const debouncedSearch = useDebounce((value: string) => {
        setIsLoading(true);
        let params: any = { search: value, page: 1 };

        if (selectedSource && selectedSource !== 'all') {
            const sourceDetails = getSourceFromSelectedValue(selectedSource);
            params.source_able_id = sourceDetails.id; // DIPERBAIKI: Menggunakan id (number)
            params.source_able_type = sourceDetails.type;
        }

        router.get(route('item.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['items'],
            onFinish: () => setIsLoading(false),
        });
    }, 500);

    // Set search state ketika component mount
    useEffect(() => {
        if (filters?.search !== undefined) {
            setSearch(filters.search);
        }
    }, [filters?.search]);

    // Handle search change
    const handleSearchChange = (value: string) => {
        setSearch(value);
        debouncedSearch(value);
    };

    const sources: SourceItem[] = useMemo(() => {
        const branchSources = branches.map((branch) => ({
            id: branch.id,
            name: `${branch.name}`,
            type: 'Branch' as const,
        }));

        const warehouseSources = warehouses.map((warehouse) => ({
            id: warehouse.id,
            name: `${warehouse.name}`,
            type: 'Warehouse' as const,
        }));

        return [...warehouseSources, ...branchSources];
    }, [branches, warehouses]);

    const defaultSource = useMemo(() => {
        if (auth?.user?.branch_id) {
            return `Branch:${auth.user.branch_id}`;
        }
        if (selectedSourceAbleId && selectedSourceAbleType) {
            return `${selectedSourceAbleType}:${selectedSourceAbleId}`;
        }
        if (warehouses.length > 0) {
            return `Warehouse:${warehouses[0].id}`;
        }
        if (branches.length > 0) {
            return `Branch:${branches[0].id}`;
        }
        return 'all';
    }, [auth?.user?.branch_id, selectedSourceAbleId, selectedSourceAbleType, warehouses, branches]);

    const [selectedSource, setSelectedSource] = useState(defaultSource);

    // Fetch items based on selected source
    useEffect(() => {
        setIsLoading(true);
        const paramsForRoute: Record<string, string | number | undefined> = {};

        if (search) {
            paramsForRoute.search = search;
        }

        if (selectedSource && selectedSource !== 'all') {
            const { id, type } = getSourceFromSelectedValue(selectedSource);
            paramsForRoute.source_able_id = id; // DIPERBAIKI: Menggunakan id (number)
            paramsForRoute.source_able_type = type;
        }
        // Untuk memastikan halaman kembali ke 1 saat filter sumber berubah
        // paramsForRoute.page = 1; // Anda bisa tambahkan ini jika diperlukan

        router.get(route('item.index'), paramsForRoute, {
            preserveState: true,
            preserveScroll: true,
            only: ['items'],
            onFinish: () => setIsLoading(false),
        });
    }, [selectedSource, search]); // Menambahkan search sebagai dependensi agar konsisten

    const createForm = useForm({
        name: '',
        code: '',
        item_category_id: '',
        item_unit_id: '',
        item_wholesale_unit_id: '',
        wholesale_unit_conversion: '',
        price: '',
    });

    const editForm = useForm({
        name: '',
        code: '',
        item_category_id: '',
        item_unit_id: '',
        item_wholesale_unit_id: '',
        wholesale_unit_conversion: '',
        price: '',
    });

    const handleSourceChange = (value: string) => {
        setSelectedSource(value);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let routeParams: { source_able_id?: number; source_able_type?: string } = {};

        if (selectedSource && selectedSource !== 'all') {
            const sourceDetails = getSourceFromSelectedValue(selectedSource);
            routeParams.source_able_id = sourceDetails.id; // DIPERBAIKI: Menggunakan id (number)
            routeParams.source_able_type = sourceDetails.type;
        }

        createForm.post(
            route('item.store', routeParams), // Menggunakan routeParams yang sudah berisi id number
            {
                preserveScroll: true,
                onError: showErrorToast,
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    createForm.reset();
                },
            },
        );
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        let routeUpdateParams: { source_able_id?: number; source_able_type?: string } = {};

        if (selectedSource && selectedSource !== 'all') {
            const sourceDetails = getSourceFromSelectedValue(selectedSource);
            routeUpdateParams.source_able_id = sourceDetails.id; // DIPERBAIKI: Menggunakan id (number)
            routeUpdateParams.source_able_type = sourceDetails.type;
        }

        editForm.put(
            route('item.update', [
                selectedItem.id,
                routeUpdateParams, // Menggunakan routeUpdateParams yang sudah berisi id number
            ]),
            {
                preserveScroll: true,
                onError: showErrorToast,
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    setSelectedItem(undefined);
                },
            },
        );
    };

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const columns: ColumnDef<Item>[] = [
        createNumberColumn<Item>(),
        {
            accessorKey: 'code',
            header: 'Code',
            cell: ({ row }: { row: Row<Item> }) => {
                return row.original.code;
            },
        },
        {
            accessorKey: 'name',
            header: 'Item Name',
            cell: ({ row }: { row: Row<Item> }) => {
                return row.original.name;
            },
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: ({ row }: { row: Row<Item> }) => {
                return row.original.item_category?.name || '-';
            },
        },
        {
            accessorKey: 'item_wholesale_unit.abbreviation',
            header: 'Wholesale Unit',
            cell: ({ row }: { row: Row<Item> }) => {
                return row.original.item_wholesale_unit?.abbreviation || '-';
            },
        },
        {
            accessorKey: 'stock',
            header: 'Stock',
            cell: ({ row }: { row: Row<Item> }) => {
                if (row.original.stock === undefined) return '-';

                const stockValue = Number(row.original.stock);
                const formattedStock = Number.isInteger(stockValue) ? stockValue.toString() : stockValue.toFixed(2);

                return formattedStock + ' ' + row.original.item_unit?.abbreviation;
            },
        },
        {
            accessorKey: 'price',
            header: 'Price',
            cell: ({ row }: { row: Row<Item> }) => {
                return formatPrice(row.original.price);
            },
        },
        ActionColumn<Item>({
            hasPermission: hasPermission,
            actions: (item) => [
                {
                    label: 'Batch',
                    icon: <Boxes className="h-4 w-4" />,
                    onClick: (data) => {
                        setSelectedItem(data);
                        setIsBatchModalOpen(true);
                    },
                },
                {
                    label: 'Edit',
                    icon: <Pencil className="h-4 w-4" />,
                    onClick: (data) => {
                        setSelectedItem(data);
                        editForm.setData({
                            name: data.name,
                            code: data.code,
                            item_category_id: data.item_category_id.toString(),
                            item_unit_id: data.item_unit_id.toString(),
                            item_wholesale_unit_id: data.item_wholesale_unit_id ? data.item_wholesale_unit_id.toString() : '',
                            wholesale_unit_conversion: data.wholesale_unit_conversion ? data.wholesale_unit_conversion.toString() : '',
                            price: data.price.toString(),
                        });
                        setIsEditModalOpen(true);
                    },
                    permission: 'update_item',
                },
                {
                    label: 'Delete',
                    icon: <Trash2 className="h-4 w-4" />,
                    className: 'text-red-600',
                    showConfirmDialog: true,
                    confirmDialogProps: {
                        title: 'Delete Item',
                        description: `This action cannot be undone. This will permanently delete the "${item.name}" item.`,
                    },
                    onClick: (data) => {
                        router.delete(route('item.destroy', data.id), {
                            preserveScroll: true,
                        });
                    },
                    permission: 'delete_item',
                },
            ],
        }),
    ].filter(Boolean) as ColumnDef<Item>[];

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Items',
            href: route('item.index'),
        },
    ];

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        let params: any = { page };

        if (selectedSource && selectedSource !== 'all') {
            const sourceDetails = getSourceFromSelectedValue(selectedSource);
            params.source_able_id = sourceDetails.id;
            params.source_able_type = sourceDetails.type;
        }

        if (search) {
            params.search = search;
        }

        router.get(route('item.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['items'],
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Items" />

            <InventoryLayout fullWidth>
                <div className="space-y-6">
                    <HeadingSmall title="Items" description="Manage your inventory items." />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="source" className="whitespace-nowrap">
                                Location Filter:
                            </Label>
                            <Combobox
                                value={selectedSource}
                                onValueChange={handleSourceChange}
                                options={sources.map((source) => ({
                                    value: `${source.type}:${source.id}`,
                                    label: source.name,
                                }))}
                                placeholder="Filter by location"
                                searchPlaceholder="Search locations..."
                            />
                        </div>

                        {hasPermission('create_item') && (
                            <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add Item
                            </Button>
                        )}
                    </div>

                    <DataTable
                        columns={columns}
                        data={items.data}
                        searchable={true}
                        searchPlaceholder="Search by code, name, or category..."
                        searchValue={search}
                        onSearchChange={handleSearchChange}
                        serverPagination={{
                            pageCount: items.last_page,
                            currentPage: items.current_page,
                            totalItems: items.total,
                            isLoading: isLoading,
                            onPageChange: handlePageChange,
                        }}
                    />

                    <FormDialog
                        title={`Item Batch - ${selectedItem?.name || 'Item'} ${
                            selectedSource && selectedSource !== 'all'
                                ? `(${sources.find((source) => `${source.type}:${source.id}` === selectedSource)?.name || ''})`
                                : ''
                        }`}
                        description="Manage batch information for this item."
                        isOpen={isBatchModalOpen}
                        onClose={() => setIsBatchModalOpen(false)}
                        size="xl"
                        hideSubmitButton={true}
                    >
                        {selectedItem && selectedSource && selectedSource !== 'all' && (
                            <BatchItemsTable
                                itemId={selectedItem.id}
                                sourceAbleId={getSourceFromSelectedValue(selectedSource).id} // Pastikan id adalah number
                                sourceAbleType={getSourceFromSelectedValue(selectedSource).type}
                            />
                        )}
                    </FormDialog>

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
                        <div className="relative grid gap-2 space-y-2">
                            <Label htmlFor="name">
                                Item Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={createForm.data.name}
                                onChange={(e) => createForm.setData('name', e.target.value)}
                                placeholder="Enter item name"
                                className={createForm.errors.name ? 'border-red-500 ring-red-100' : ''}
                            />
                        </div>
                        <div className="relative grid gap-2 space-y-2">
                            <Label htmlFor="code">
                                Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="code"
                                type="text"
                                value={createForm.data.code}
                                onChange={(e) => createForm.setData('code', e.target.value)}
                                placeholder="Enter item code"
                                className={createForm.errors.code ? 'border-red-500 ring-red-100' : ''}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="item_category_id">
                                    Category <span className="text-red-500">*</span>
                                </Label>
                                <Combobox
                                    value={createForm.data.item_category_id}
                                    onValueChange={(value) => createForm.setData('item_category_id', value)}
                                    options={itemCategories.map((category) => ({
                                        value: category.id.toString(),
                                        label: category.name,
                                    }))}
                                    placeholder="Select a category"
                                    searchPlaceholder="Search categories..."
                                    className={createForm.errors.item_category_id ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>

                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="item_unit_id">
                                    Unit <span className="text-red-500">*</span>
                                </Label>
                                <Combobox
                                    value={createForm.data.item_unit_id}
                                    onValueChange={(value) => createForm.setData('item_unit_id', value)}
                                    options={itemUnits.map((unit) => ({
                                        value: unit.id.toString(),
                                        label: `${unit.name} (${unit.abbreviation})`,
                                    }))}
                                    placeholder="Select a unit"
                                    searchPlaceholder="Search units..."
                                    className={createForm.errors.item_unit_id ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="item_wholesale_unit_id">Wholesale Unit</Label>
                                <Combobox
                                    value={createForm.data.item_wholesale_unit_id}
                                    onValueChange={(value) => {
                                        createForm.setData('item_wholesale_unit_id', value);
                                        if (!value) {
                                            createForm.setData('wholesale_unit_conversion', '');
                                        }
                                    }}
                                    options={[
                                        { value: null, label: 'None' },
                                        ...itemWholesaleUnits.map((unit) => ({
                                            value: unit.id.toString(),
                                            label: `${unit.name} (${unit.abbreviation})`,
                                        })),
                                    ]}
                                    placeholder="Select a wholesale"
                                    searchPlaceholder="Search units..."
                                    className={createForm.errors.item_wholesale_unit_id ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>

                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="wholesale_unit_conversion">
                                    Conversion {createForm.data.item_wholesale_unit_id && <span className="text-red-500">*</span>}
                                </Label>
                                <Input
                                    id="wholesale_unit_conversion"
                                    type="number"
                                    value={createForm.data.wholesale_unit_conversion}
                                    onChange={(e) => createForm.setData('wholesale_unit_conversion', e.target.value)}
                                    placeholder="Enter conversion rate"
                                    disabled={!createForm.data.item_wholesale_unit_id}
                                    className={createForm.errors.wholesale_unit_conversion ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                        </div>

                        <div className="relative grid gap-2 space-y-2">
                            <Label htmlFor="price">
                                Price <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center">
                                <span className="text-muted-foreground mr-2 text-sm">Rp</span>
                                <Input
                                    id="price"
                                    type="number"
                                    value={createForm.data.price}
                                    onChange={(e) => createForm.setData('price', e.target.value)}
                                    placeholder="Enter price"
                                    className={createForm.errors.price ? 'border-red-500 ring-red-100' : ''}
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
                        <div className="relative grid gap-2 space-y-2">
                            <Label htmlFor="edit_name">
                                Item Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit_name"
                                type="text"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                placeholder="Enter item name"
                                className={editForm.errors.name ? 'border-red-500 ring-red-100' : ''}
                            />
                        </div>

                        <div className="relative grid gap-2 space-y-2">
                            <Label htmlFor="edit_code">
                                Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit_code"
                                type="text"
                                value={editForm.data.code}
                                onChange={(e) => editForm.setData('code', e.target.value)}
                                placeholder="Enter item code"
                                className={editForm.errors.code ? 'border-red-500 ring-red-100' : ''}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="edit_item_category_id">
                                    Category <span className="text-red-500">*</span>
                                </Label>
                                <Combobox
                                    value={editForm.data.item_category_id}
                                    onValueChange={(value) => editForm.setData('item_category_id', value)}
                                    options={itemCategories.map((category) => ({
                                        value: category.id.toString(),
                                        label: category.name,
                                    }))}
                                    placeholder="Select a category"
                                    searchPlaceholder="Search categories..."
                                    className={editForm.errors.item_category_id ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>

                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="edit_item_unit_id">
                                    Unit <span className="text-red-500">*</span>
                                </Label>
                                <Combobox
                                    value={editForm.data.item_unit_id}
                                    onValueChange={(value) => editForm.setData('item_unit_id', value)}
                                    options={itemUnits.map((unit) => ({
                                        value: unit.id.toString(),
                                        label: `${unit.name} (${unit.abbreviation})`,
                                    }))}
                                    placeholder="Select a unit"
                                    searchPlaceholder="Search units..."
                                    className={editForm.errors.item_unit_id ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="edit_item_wholesale_unit_id">Wholesale Unit</Label>
                                <Combobox
                                    value={editForm.data.item_wholesale_unit_id}
                                    onValueChange={(value) => {
                                        editForm.setData('item_wholesale_unit_id', value);
                                        if (!value) {
                                            editForm.setData('wholesale_unit_conversion', '');
                                        }
                                    }}
                                    options={[
                                        { value: null, label: 'None' },
                                        ...itemWholesaleUnits.map((unit) => ({
                                            value: unit.id.toString(),
                                            label: `${unit.name} (${unit.abbreviation})`,
                                        })),
                                    ]}
                                    placeholder="Select a wholesale"
                                    searchPlaceholder="Search units..."
                                    className={editForm.errors.item_wholesale_unit_id ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>

                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="edit_wholesale_unit_conversion">
                                    Conversion {editForm.data.item_wholesale_unit_id && <span className="text-red-500">*</span>}
                                </Label>
                                <Input
                                    id="edit_wholesale_unit_conversion"
                                    type="number"
                                    value={editForm.data.wholesale_unit_conversion}
                                    onChange={(e) => editForm.setData('wholesale_unit_conversion', e.target.value)}
                                    placeholder="Enter conversion rate"
                                    disabled={!editForm.data.item_wholesale_unit_id}
                                    className={editForm.errors.wholesale_unit_conversion ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                        </div>

                        <div className="relative grid gap-2 space-y-2">
                            <Label htmlFor="edit_price">
                                Price <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center">
                                <span className="text-muted-foreground mr-2 text-sm">Rp</span>
                                <Input
                                    id="edit_price"
                                    type="number"
                                    value={editForm.data.price}
                                    onChange={(e) => editForm.setData('price', e.target.value)}
                                    placeholder="Enter price"
                                    className={editForm.errors.price ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                        </div>
                    </FormDialog>
                </div>
            </InventoryLayout>
        </AppLayout>
    );
}
