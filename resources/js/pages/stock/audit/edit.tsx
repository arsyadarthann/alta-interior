import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { cn, formatDate, formatDateToYmd, formatDecimal } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarIcon, CheckCircle, Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stock',
        href: '#',
    },
    {
        title: 'Audit',
        href: route('stock.audit.index'),
    },
    {
        title: 'Edit',
        href: '#',
    },
];

type ItemCategory = {
    id: number;
    name: string;
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
    item_unit_id: number;
    price: number;
    item_category?: ItemCategory;
    item_unit?: ItemUnit;
    stock?: number;
};

type StockAudit = {
    id: number;
    code: string;
    date: string;
    source_able_type: string;
    source_able_id: string;
    branch_id?: number;
    stock_audit_details: {
        id: number;
        stock_audit_id: number;
        item_id: number;
        system_quantity: number;
        physical_quantity: number;
        discrepancy_quantity: number;
        reason: string;
    }[];
};

type StockAuditDetail = {
    id: number | null;
    item_id: number;
    system_quantity: number;
    physical_quantity: number;
    discrepancy_quantity: number;
    reason: string;
};

export default function EditStockAudit({
    stockAudit,
    branches = [],
    warehouses = [],
}: {
    stockAudit: StockAudit;
    branches?: Branch[];
    warehouses?: Warehouse[];
}) {
    const { showErrorToast } = useToastNotification();
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItemNames, setSelectedItemNames] = useState<Record<number, string>>({});
    const [selectedItemUnits, setSelectedItemUnits] = useState<Record<number, string>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [addingItem, setAddingItem] = useState<boolean>(false);
    const [deletedDetails, setDeletedDetails] = useState<number[]>([]);
    const { auth } = usePage().props as unknown as { auth: { user: { branch_id: number } } };
    const [initialized, setInitialized] = useState(false);
    const [shouldFetchItems, setShouldFetchItems] = useState(false);

    const isFetchingItems = useRef(false);

    const initialSourceType = () => {
        if (stockAudit.source_able_type) {
            if (stockAudit.source_able_type.includes('Branch')) {
                return 'branch';
            } else if (stockAudit.source_able_type.includes('Warehouse')) {
                return 'warehouse';
            }
        }
        return 'branch';
    };
    const initialSourceId = stockAudit.source_able_id || String(stockAudit.branch_id || '');

    const { data, setData, put, processing, errors } = useForm({
        code: stockAudit.code,
        date: stockAudit.date,
        source_able_type: initialSourceType(),
        source_able_id: initialSourceId,
        stock_audit_details: stockAudit.stock_audit_details.map((detail) => ({
            id: detail.id,
            item_id: detail.item_id,
            system_quantity: detail.system_quantity,
            physical_quantity: detail.physical_quantity,
            discrepancy_quantity: detail.discrepancy_quantity,
            reason: detail.reason || '',
        })),
        new_item: {
            item_id: 0,
            system_quantity: 0,
            physical_quantity: 0,
            discrepancy_quantity: 0,
            reason: '',
        },
    });

    // Initialize form data
    useEffect(() => {
        if (!initialized) {
            if (auth?.user?.branch_id && !data.source_able_id) {
                const userBranchId = auth.user.branch_id.toString();
                setData((prev) => ({
                    ...prev,
                    source_able_type: 'branch',
                    source_able_id: userBranchId,
                }));
            }
            setInitialized(true);
            setShouldFetchItems(true);
        }
    }, [initialized, auth?.user?.branch_id, setData, data.source_able_id]);

    // Fetch items when source changes
    useEffect(() => {
        if (shouldFetchItems && initialized && data.source_able_type && data.source_able_id) {
            if (isFetchingItems.current) return;

            isFetchingItems.current = true;
            const routeName = data.source_able_type === 'branch' ? 'item.getItemByBranch' : 'item.getItemByWarehouse';

            fetch(route(routeName, data.source_able_id), {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then((responseData) => {
                    let itemsData: Item[] = [];
                    if (Array.isArray(responseData)) {
                        itemsData = responseData;
                    } else if (responseData && responseData.items && Array.isArray(responseData.items)) {
                        itemsData = responseData.items;
                    } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
                        itemsData = responseData.data;
                    }
                    setItems(itemsData);
                    setShouldFetchItems(false);
                })
                .catch((error) => {
                    showErrorToast([error.message]);
                    setShouldFetchItems(false);
                })
                .finally(() => {
                    isFetchingItems.current = false;
                });
        }
    }, [data.source_able_type, data.source_able_id, initialized, shouldFetchItems, showErrorToast]);

    // Update item names and units when items or details change
    useEffect(() => {
        if (items.length > 0 && data.stock_audit_details.length > 0) {
            const newInitialItemNames: Record<number, string> = {};
            const newInitialItemUnits: Record<number, string> = {};

            data.stock_audit_details.forEach((detail, index) => {
                const item = items.find((itm) => itm.id === detail.item_id);
                if (item) {
                    newInitialItemNames[index] = `${item.name} (${item.code})`;
                    newInitialItemUnits[index] = item.item_unit?.abbreviation || '';
                } else {
                    newInitialItemNames[index] = 'Unknown Item';
                    newInitialItemUnits[index] = '';
                }
            });

            setSelectedItemNames(newInitialItemNames);
            setSelectedItemUnits(newInitialItemUnits);
        } else if (data.stock_audit_details.length === 0) {
            setSelectedItemNames({});
            setSelectedItemUnits({});
        }
    }, [items, data.stock_audit_details]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formattedData = {
            ...data,
            date: formatDateToYmd(new Date(data.date)),
            deleted_details: deletedDetails,
            stock_audit_details: data.stock_audit_details.map((detail) => ({
                id: detail.id,
                item_id: Number(detail.item_id),
                system_quantity: Number(detail.system_quantity),
                physical_quantity: Number(detail.physical_quantity),
                discrepancy_quantity: Number(detail.discrepancy_quantity),
                reason: detail.reason || '',
            })),
        };

        put(route('stock.audit.update', stockAudit.id), {
            data: formattedData,
            preserveScroll: true,
            onError: showErrorToast,
        } as any);
    };

    const addAuditItem = () => {
        setAddingItem(true);
        setData('new_item', {
            item_id: 0,
            system_quantity: 0,
            physical_quantity: 0,
            discrepancy_quantity: 0,
            reason: '',
        });
    };

    const saveAuditItem = () => {
        if (editingIndex !== null) {
            const editedDetail = data.stock_audit_details[editingIndex];
            if (editedDetail) {
                const selectedItem = items.find((itm) => itm.id === editedDetail.item_id);
                if (selectedItem) {
                    setSelectedItemNames((prev) => ({ ...prev, [editingIndex!]: `${selectedItem.name} (${selectedItem.code})` }));
                    setSelectedItemUnits((prev) => ({ ...prev, [editingIndex!]: selectedItem.item_unit?.abbreviation || '' }));
                }
            }
            setEditingIndex(null);
        } else {
            if (data.new_item.item_id !== 0) {
                setAddingItem(false);
                const newIndex = data.stock_audit_details.length;
                const newItemDetail: StockAuditDetail = {
                    id: null,
                    ...data.new_item,
                };
                setData('stock_audit_details', [...data.stock_audit_details, newItemDetail]);

                const selectedNewItem = items.find((itm) => itm.id === data.new_item.item_id);
                if (selectedNewItem) {
                    setSelectedItemNames((prev) => ({ ...prev, [newIndex]: `${selectedNewItem.name} (${selectedNewItem.code})` }));
                    setSelectedItemUnits((prev) => ({ ...prev, [newIndex]: selectedNewItem.item_unit?.abbreviation || '' }));
                }

                setData('new_item', {
                    item_id: 0,
                    system_quantity: 0,
                    physical_quantity: 0,
                    discrepancy_quantity: 0,
                    reason: '',
                });
            } else {
                showErrorToast(['Please select an item']);
            }
        }
    };

    const removeAuditItem = (index: number) => {
        const itemToRemove = data.stock_audit_details[index];
        if (itemToRemove.id) {
            setDeletedDetails((prev) => [...prev, itemToRemove.id!]);
        }

        const updatedAuditDetails = data.stock_audit_details.filter((_, i) => i !== index);
        setData('stock_audit_details', updatedAuditDetails);

        const newNames = { ...selectedItemNames };
        const newUnits = { ...selectedItemUnits };
        delete newNames[index];
        delete newUnits[index];

        const reIndexedNames: Record<number, string> = {};
        const reIndexedUnits: Record<number, string> = {};

        let currentNewIndex = 0;
        for (let i = 0; i < data.stock_audit_details.length + 1; i++) {
            if (i !== index) {
                if (newNames[i] !== undefined) reIndexedNames[currentNewIndex] = newNames[i];
                if (newUnits[i] !== undefined) reIndexedUnits[currentNewIndex] = newUnits[i];
                currentNewIndex++;
            }
        }
        setSelectedItemNames(reIndexedNames);
        setSelectedItemUnits(reIndexedUnits);

        if (editingIndex === index) {
            setEditingIndex(null);
        } else if (editingIndex !== null && editingIndex > index) {
            setEditingIndex(editingIndex - 1);
        }
    };

    const updateAuditItem = (
        index: number,
        field: 'item_id' | 'system_quantity' | 'physical_quantity' | 'discrepancy_quantity' | 'reason',
        value: string | number,
    ) => {
        setData(
            'stock_audit_details',
            data.stock_audit_details.map((detail, i) => {
                if (i === index) {
                    const updatedDetail = { ...detail };
                    if (field === 'item_id') {
                        const itemId = Number(value);
                        const selectedItem = items.find((itm) => itm.id === itemId);
                        if (selectedItem) {
                            const itemStock = selectedItem.stock ?? 0;
                            updatedDetail.item_id = itemId;
                            updatedDetail.system_quantity = itemStock;
                            updatedDetail.physical_quantity = 0; // Reset physical quantity on item change
                            updatedDetail.discrepancy_quantity = 0 - itemStock;

                            setSelectedItemNames((prev) => ({ ...prev, [index]: `${selectedItem.name} (${selectedItem.code})` }));
                            setSelectedItemUnits((prev) => ({ ...prev, [index]: selectedItem.item_unit?.abbreviation || '' }));
                        }
                    } else if (field === 'physical_quantity') {
                        let physicalQty = Number(value);
                        if (physicalQty < 0) physicalQty = 0;
                        updatedDetail.physical_quantity = physicalQty;
                        updatedDetail.discrepancy_quantity = physicalQty - updatedDetail.system_quantity;
                    } else if (field === 'reason') {
                        updatedDetail.reason = String(value);
                    }
                    return updatedDetail;
                }
                return detail;
            }),
        );
    };

    const getAvailableItems = (currentIndex: number) => {
        return items.filter((item) => {
            if (editingIndex === currentIndex && data.stock_audit_details[currentIndex]?.item_id === item.id) {
                return true;
            }
            return !data.stock_audit_details.some((auditItem, i) => i !== currentIndex && auditItem.item_id === item.id);
        });
    };

    const renderAuditItemForm = (auditItem: StockAuditDetail | null = null, index: number = -1, isAddingNew: boolean = false) => {
        const currentItemData = auditItem || data.new_item;
        const selectedItemId = currentItemData.item_id;
        const itemIdentifier = isAddingNew ? `new_item` : `stock_audit_details.${index}`;

        return (
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md border bg-gray-50 p-4">
                <div className="relative grid min-w-[200px] flex-1 gap-2">
                    <Label htmlFor={`item_id_${index}`}>
                        Item <span className="text-red-500">*</span>
                    </Label>
                    <Combobox
                        value={selectedItemId ? String(selectedItemId) : ''}
                        onValueChange={(value) => {
                            const itemId = Number(value);
                            const selectedItem = items.find((itm) => itm.id === itemId);
                            if (!selectedItem) return;

                            const itemStock = selectedItem.stock ?? 0;

                            if (isAddingNew) {
                                setData('new_item', {
                                    item_id: itemId,
                                    system_quantity: itemStock,
                                    physical_quantity: 0,
                                    discrepancy_quantity: 0 - itemStock,
                                    reason: '',
                                });
                                const newIndexForStates = data.stock_audit_details.length;
                                setSelectedItemNames((prev) => ({ ...prev, [newIndexForStates]: `${selectedItem.name} (${selectedItem.code})` }));
                                setSelectedItemUnits((prev) => ({ ...prev, [newIndexForStates]: selectedItem.item_unit?.abbreviation || '' }));
                            } else {
                                updateAuditItem(index, 'item_id', value);
                            }
                        }}
                        options={getAvailableItems(isAddingNew ? -1 : index).map((itm) => ({
                            value: String(itm.id),
                            label: `${itm.name} (${itm.code})`,
                        }))}
                        placeholder="Select an item"
                        searchPlaceholder="Search items..."
                        initialDisplayCount={5}
                        className={cn(
                            'w-full max-w-xs truncate',
                            errors[`${itemIdentifier}.item_id` as keyof typeof errors] ? 'border-red-500 ring-red-100' : '',
                        )}
                    />
                </div>
                <div className="relative grid min-w-[140px] flex-1 gap-2">
                    <Label htmlFor={`system_quantity_${index}`}>System Quantity</Label>
                    <div className="relative">
                        <Input
                            id={`system_quantity_${index}`}
                            type="number"
                            value={
                                currentItemData.system_quantity === 0
                                    ? 0
                                    : currentItemData.system_quantity % 1 === 0
                                      ? Math.abs(Number(currentItemData.system_quantity))
                                      : Number(currentItemData.system_quantity.toFixed(2))
                            }
                            readOnly
                            className="bg-gray-100 pr-10"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                            {selectedItemUnits[isAddingNew ? data.stock_audit_details.length : index] || ''}
                        </div>
                    </div>
                </div>
                <div className="relative grid min-w-[140px] flex-1 gap-2">
                    <Label htmlFor={`physical_quantity_${index}`}>
                        Physical Quantity <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id={`physical_quantity_${index}`}
                            type="number"
                            min="0"
                            value={currentItemData.physical_quantity === 0 ? '' : formatDecimal(currentItemData.physical_quantity)}
                            onChange={(e) => {
                                const physicalQty = Math.max(0, Number(e.target.value));
                                const systemQty = currentItemData.system_quantity || 0;
                                if (isAddingNew) {
                                    setData('new_item', {
                                        ...data.new_item,
                                        physical_quantity: physicalQty,
                                        discrepancy_quantity: physicalQty - systemQty,
                                    });
                                } else {
                                    updateAuditItem(index, 'physical_quantity', physicalQty);
                                }
                            }}
                            placeholder="Count result"
                            className={cn(
                                '[appearance:textfield] pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                                errors[`${itemIdentifier}.physical_quantity` as keyof typeof errors] ? 'border-red-500 ring-red-100' : '',
                            )}
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                            {selectedItemUnits[isAddingNew ? data.stock_audit_details.length : index] || ''}
                        </div>
                    </div>
                    {errors[`${itemIdentifier}.physical_quantity` as keyof typeof errors] && (
                        <p className="mt-1 text-xs text-red-500">{errors[`${itemIdentifier}.physical_quantity` as keyof typeof errors]}</p>
                    )}
                </div>
                <div className="relative grid min-w-[140px] flex-1 gap-2">
                    <Label htmlFor={`discrepancy_quantity_${index}`}>Discrepancy</Label>
                    <div className="relative">
                        <Input
                            id={`discrepancy_quantity_${index}`}
                            type="number"
                            value={
                                currentItemData.discrepancy_quantity === 0
                                    ? 0
                                    : currentItemData.discrepancy_quantity % 1 === 0
                                      ? Number(currentItemData.discrepancy_quantity)
                                      : Number(currentItemData.discrepancy_quantity.toFixed(2))
                            }
                            readOnly
                            className={cn(
                                'bg-gray-100 pr-10',
                                currentItemData.discrepancy_quantity < 0
                                    ? 'text-red-600'
                                    : currentItemData.discrepancy_quantity > 0
                                      ? 'text-green-600'
                                      : '',
                            )}
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                            {selectedItemUnits[isAddingNew ? data.stock_audit_details.length : index] || ''}
                        </div>
                    </div>
                </div>
                <div className="relative grid min-w-[200px] flex-1 gap-2">
                    <Label htmlFor={`reason_${index}`}>Reason</Label>
                    <Input
                        id={`reason_${index}`}
                        type="text"
                        value={currentItemData.reason}
                        onChange={(e) => {
                            if (isAddingNew) {
                                setData('new_item', {
                                    ...data.new_item,
                                    reason: e.target.value,
                                });
                            } else {
                                updateAuditItem(index, 'reason', e.target.value);
                            }
                        }}
                        placeholder="Explain discrepancy"
                        className={cn(errors[`${itemIdentifier}.reason` as keyof typeof errors] ? 'border-red-500 ring-red-100' : '')}
                    />
                </div>
                <div className="flex items-end gap-2 pb-[2px]">
                    <Button type="button" variant="default" size="icon" onClick={saveAuditItem} className="h-9 w-9 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 text-white" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderAuditItemList = (auditItem: StockAuditDetail, index: number) => {
        const itemName = selectedItemNames[index] || 'Loading...';
        const itemUnit = selectedItemUnits[index] || '';

        return (
            <div
                key={auditItem.id || `item-${index}-${auditItem.item_id}`}
                className="flex items-center justify-between border-b border-gray-100 py-3"
            >
                <div className="flex-1">
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <p className="font-medium text-gray-900">{itemName}</p>
                        <span>
                            System: {formatDecimal(auditItem.system_quantity)} {itemUnit}
                        </span>
                        <span>
                            Physical: {formatDecimal(auditItem.physical_quantity)} {itemUnit}
                        </span>
                        <span
                            className={`${
                                auditItem.discrepancy_quantity < 0 ? 'text-red-600' : auditItem.discrepancy_quantity > 0 ? 'text-green-600' : ''
                            }`}
                        >
                            Discrepancy: {formatDecimal(auditItem.discrepancy_quantity)} {itemUnit}
                        </span>
                        {auditItem.reason && <span>Reason: {auditItem.reason}</span>}
                    </div>
                </div>
                <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => setEditingIndex(index)} className="h-9 w-9">
                        <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAuditItem(index)} className="h-9 w-9">
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Stock Audit" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Edit Stock Audit" description="Modify existing stock audit details." />
                    <div className="flex gap-3">
                        <Link href={route('stock.audit.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:sticky lg:top-6 lg:col-span-1 lg:self-start">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Audit Information</h2>
                                    <div className="space-y-4">
                                        <div className="py-2">
                                            <div className="border-b border-gray-100 pb-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="px-3 py-1.5 text-sm font-medium">{data.code}</span>
                                                    <input type="hidden" name="code" value={data.code} />
                                                </div>
                                            </div>
                                            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="source">
                                                Audit Source <span className="text-red-500">*</span>
                                            </Label>
                                            <Combobox
                                                value={
                                                    data.source_able_id && data.source_able_type
                                                        ? `${data.source_able_type}-${data.source_able_id}`
                                                        : ''
                                                }
                                                onValueChange={(value) => {
                                                    const [type, id] = value.split('-');
                                                    setData((prev) => ({
                                                        ...prev,
                                                        source_able_type: type,
                                                        source_able_id: id,
                                                        stock_audit_details: [],
                                                    }));
                                                    setSelectedItemNames({});
                                                    setSelectedItemUnits({});
                                                    setItems([]);
                                                    setShouldFetchItems(true);
                                                }}
                                                options={
                                                    !auth?.user?.branch_id
                                                        ? [
                                                              ...warehouses.map((warehouse) => ({
                                                                  value: `warehouse-${warehouse.id}`,
                                                                  label: warehouse.name,
                                                              })),
                                                              ...branches.map((branch) => ({
                                                                  value: `branch-${branch.id}`,
                                                                  label: branch.name,
                                                              })),
                                                          ]
                                                        : branches
                                                              .filter(
                                                                  (branch) =>
                                                                      branch.id === auth.user.branch_id || branch.id === Number(initialSourceId),
                                                              )
                                                              .map((branch) => ({
                                                                  value: `branch-${branch.id}`,
                                                                  label: branch.name,
                                                              }))
                                                }
                                                placeholder="Select audit source"
                                                searchPlaceholder="Search sources..."
                                                initialDisplayCount={5}
                                                disabled={true}
                                                className={errors.source_able_id || errors.source_able_type ? 'border-red-500' : ''}
                                            />
                                            {(errors.source_able_id || errors.source_able_type) && (
                                                <p className="text-sm text-red-500">{errors.source_able_id || errors.source_able_type}</p>
                                            )}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="date">
                                                Audit Date <span className="text-red-500">*</span>
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="date"
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal',
                                                            !data.date && 'text-muted-foreground',
                                                            errors.date && 'border-red-500 ring-red-100',
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {data.date ? formatDate(data.date) : <span>Select date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={data.date ? new Date(data.date) : undefined}
                                                        onSelect={(date) => date && setData('date', formatDateToYmd(date))}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-gray-900">Audit Items</h2>
                                        <div className="flex items-center">
                                            <span className="mr-2 text-sm text-gray-500">{data.stock_audit_details.length} items</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="max-h-[calc(70vh-260px)] overflow-y-auto pr-2 pl-1">
                                            {addingItem && renderAuditItemForm(null, -1, true)}
                                            {data.stock_audit_details.map((auditItem, index) => (
                                                <div key={auditItem.id || `item-${index}-${auditItem.item_id}`}>
                                                    {editingIndex === index
                                                        ? renderAuditItemForm(auditItem, index)
                                                        : renderAuditItemList(auditItem, index)}
                                                </div>
                                            ))}
                                        </div>

                                        {data.stock_audit_details.length === 0 && !addingItem && (
                                            <div className="flex items-center justify-center py-8 text-center text-gray-500">
                                                <p>No items added yet. Click the button below to add items to audit.</p>
                                            </div>
                                        )}

                                        {!addingItem && editingIndex === null && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addAuditItem}
                                                className="mt-2"
                                                disabled={!data.source_able_id || items.length === 0}
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add Item
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t pt-4 pb-2">
                        <Button variant="outline" type="button" onClick={() => router.visit(route('stock.audit.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || data.stock_audit_details.length === 0 || !data.date} className="px-8">
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
