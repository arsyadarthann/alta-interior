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
import { cn, formatDate, formatDateToYmd } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarIcon, CheckCircle, Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stock',
        href: '#',
    },
    {
        title: 'Adjustment',
        href: route('stock.adjustment.index'),
    },
    {
        title: 'Create',
        href: route('stock.adjustment.create'),
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

export default function Create({ branches = [], warehouses = [] }: { branches?: Branch[]; warehouses?: Warehouse[] }) {
    const { showErrorToast } = useToastNotification();
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItemNames, setSelectedItemNames] = useState<Record<number, string>>({});
    const [selectedItemUnits, setSelectedItemUnits] = useState<Record<number, string>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [addingItem, setAddingItem] = useState<boolean>(false);
    const { auth } = usePage().props as unknown as { auth: { user: { branch_id: number } } };
    const [initialized, setInitialized] = useState(false);

    const isFetchingItems = useRef(false);
    const isFetchingCode = useRef(false);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        date: '',
        source_able_type: '',
        source_able_id: '',
        stock_adjustment_details: [] as {
            item_id: number;
            type: string;
            before_adjustment_quantity: number;
            adjustment_quantity: number;
            after_adjustment_quantity: number;
            reason: string;
        }[],
        new_item: {
            item_id: 0,
            type: '',
            before_adjustment_quantity: 0,
            adjustment_quantity: 0,
            after_adjustment_quantity: 0,
            reason: '',
        },
    });

    useEffect(() => {
        if (!initialized) {
            if (auth?.user?.branch_id) {
                const userBranchId = auth.user.branch_id.toString();
                setData('source_able_type', 'branch');
                setData('source_able_id', userBranchId);
            }
            setInitialized(true);
        }
    }, [initialized, auth?.user?.branch_id, setData]);

    const fetchItems = useCallback(
        (sourceType: string, sourceId: string) => {
            // Guard against multiple concurrent fetches
            if (isFetchingItems.current) return;

            isFetchingItems.current = true;
            const routeName = sourceType === 'branch' ? 'item.getItemByBranch' : 'item.getItemByWarehouse';

            fetch(route(routeName, sourceId), {
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
                    let itemsData = [];

                    if (Array.isArray(responseData)) {
                        itemsData = responseData;
                    } else if (responseData && responseData.items && Array.isArray(responseData.items)) {
                        itemsData = responseData.items;
                    } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
                        itemsData = responseData.data;
                    } else {
                        itemsData = [];
                    }

                    setItems(itemsData);
                    setData('stock_adjustment_details', []);
                    setSelectedItemNames({});
                    setSelectedItemUnits({});
                })
                .catch((error) => {
                    showErrorToast([error.message]);
                })
                .finally(() => {
                    isFetchingItems.current = false;
                });
        },
        [setItems, setData, setSelectedItemNames, setSelectedItemUnits, showErrorToast],
    );

    const fetchAdjustmentCode = useCallback(
        (sourceType: string, sourceId: string) => {
            if (isFetchingCode.current) return;

            isFetchingCode.current = true;
            fetch(
                route('stock.adjustment.getCode', {
                    source_able_type: sourceType,
                    source_able_id: sourceId,
                }),
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            )
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then((responseData) => {
                    if (responseData && responseData.code) {
                        setData('code', responseData.code);
                    }
                })
                .catch(() => {
                    showErrorToast(['Failed to get adjustment code']);
                })
                .finally(() => {
                    isFetchingCode.current = false;
                });
        },
        [setData, showErrorToast],
    );

    // Modified useEffect to prevent infinite loops
    useEffect(() => {
        if (initialized && data.source_able_type && data.source_able_id) {
            fetchItems(data.source_able_type, data.source_able_id);
            fetchAdjustmentCode(data.source_able_type, data.source_able_id);
        }
        // Important: only run this effect when either initialized changes OR source changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialized, data.source_able_type + data.source_able_id]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post(route('stock.adjustment.store'), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    const addAdjustmentItem = () => {
        setAddingItem(true);
        setData('new_item', {
            item_id: 0,
            type: '',
            before_adjustment_quantity: 0,
            adjustment_quantity: 0,
            after_adjustment_quantity: 0,
            reason: '',
        });
    };

    const saveAdjustmentItem = () => {
        if (editingIndex !== null) {
            setEditingIndex(null);
        } else {
            setAddingItem(false);
            if (data.new_item.item_id !== 0) {
                setData('stock_adjustment_details', [...data.stock_adjustment_details, data.new_item]);
                setData('new_item', {
                    item_id: 0,
                    type: 'balanced',
                    before_adjustment_quantity: 0,
                    adjustment_quantity: 0,
                    after_adjustment_quantity: 0,
                    reason: '',
                });
            } else {
                showErrorToast(['Please select an item']);
            }
        }
    };

    const removeAdjustmentItem = (index: number) => {
        const updatedItems = [...data.stock_adjustment_details];

        const newSelectedItemNames = { ...selectedItemNames };
        const newSelectedItemUnits = { ...selectedItemUnits };
        delete newSelectedItemNames[index];
        delete newSelectedItemUnits[index];

        updatedItems.splice(index, 1);
        setData('stock_adjustment_details', updatedItems);

        const updatedSelectedItemNames: Record<number, string> = {};
        const updatedSelectedItemUnits: Record<number, string> = {};

        Object.keys(newSelectedItemNames).forEach((key) => {
            const keyNum = parseInt(key, 10);
            if (keyNum > index) {
                updatedSelectedItemNames[keyNum - 1] = newSelectedItemNames[keyNum];
                updatedSelectedItemUnits[keyNum - 1] = newSelectedItemUnits[keyNum];
            } else {
                updatedSelectedItemNames[keyNum] = newSelectedItemNames[keyNum];
                updatedSelectedItemUnits[keyNum] = newSelectedItemUnits[keyNum];
            }
        });

        setSelectedItemNames(updatedSelectedItemNames);
        setSelectedItemUnits(updatedSelectedItemUnits);
    };

    const updateAdjustmentItem = (
        index: number,
        field: 'item_id' | 'type' | 'before_adjustment_quantity' | 'adjustment_quantity' | 'after_adjustment_quantity' | 'reason',
        value: string | number,
    ) => {
        const updatedItems = [...data.stock_adjustment_details];

        if (field === 'item_id') {
            const itemId = Number(value);
            const selectedItem = items.find((item) => item.id === itemId);

            if (selectedItem) {
                const newSelectedItemNames = { ...selectedItemNames };
                newSelectedItemNames[index] = `${selectedItem.name} (${selectedItem.code})`;
                setSelectedItemNames(newSelectedItemNames);

                const newSelectedItemUnits = { ...selectedItemUnits };
                newSelectedItemUnits[index] = selectedItem.item_unit?.abbreviation || '';
                setSelectedItemUnits(newSelectedItemUnits);

                const itemStock = selectedItem.stock ?? 0;
                updatedItems[index] = {
                    ...updatedItems[index],
                    item_id: itemId,
                    type: 'balanced',
                    before_adjustment_quantity: itemStock,
                    adjustment_quantity: 0 - itemStock,
                    after_adjustment_quantity: 0,
                    reason: '',
                };
            }
        } else if (field === 'after_adjustment_quantity') {
            let afterAdjustmentQuantity = Number(value);
            if (afterAdjustmentQuantity < 0) {
                afterAdjustmentQuantity = 0;
            }

            const beforeAdjustmentQuantity = updatedItems[index].before_adjustment_quantity;
            const adjustmentQuantity = afterAdjustmentQuantity - beforeAdjustmentQuantity;
            let type = 'balanced';

            if (adjustmentQuantity > 0) {
                type = 'increased';
            } else if (adjustmentQuantity < 0) {
                type = 'decreased';
            }

            updatedItems[index] = {
                ...updatedItems[index],
                after_adjustment_quantity: afterAdjustmentQuantity,
                adjustment_quantity: adjustmentQuantity,
                type: type,
            };
        } else if (field === 'before_adjustment_quantity') {
            let beforeAdjustmentQuantity = Number(value);
            if (beforeAdjustmentQuantity < 0) {
                beforeAdjustmentQuantity = 0;
            }

            const afterAdjustmentQuantity = updatedItems[index].after_adjustment_quantity;
            updatedItems[index] = {
                ...updatedItems[index],
                before_adjustment_quantity: beforeAdjustmentQuantity,
                adjustment_quantity: afterAdjustmentQuantity - beforeAdjustmentQuantity,
            };
        } else {
            updatedItems[index] = {
                ...updatedItems[index],
                [field]: field === 'reason' ? String(value) : Number(value),
            };
        }

        setData('stock_adjustment_details', updatedItems);
    };

    const getAvailableItems = (currentIndex: number) => {
        return items.filter((item) => {
            return !data.stock_adjustment_details.some((adjustmentItem, i) => i !== currentIndex && adjustmentItem.item_id === item.id);
        });
    };

    const renderAdjustmentItemForm = (
        adjustmentItem: {
            item_id: number;
            type: string;
            before_adjustment_quantity: number;
            adjustment_quantity: number;
            after_adjustment_quantity: number;
            reason: string;
        } | null = null,
        index: number = -1,
        isAddingNew: boolean = false,
    ) => {
        const item = adjustmentItem || data.new_item;
        const selectedItemId = isAddingNew ? data.new_item.item_id : item.item_id;

        return (
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md border bg-gray-50 p-4">
                <div className="relative grid min-w-[200px] flex-1 gap-2">
                    <Label htmlFor={`item_id_${index}`}>
                        Item <span className="text-red-500">*</span>
                    </Label>
                    <Combobox
                        value={selectedItemId ? String(selectedItemId) : ''}
                        onValueChange={(value) => {
                            if (isAddingNew) {
                                const itemId = Number(value);
                                const selectedItem = items.find((item) => item.id === itemId);

                                if (selectedItem) {
                                    const itemStock = selectedItem.stock ?? 0;
                                    const adjustmentQuantity = 0 - itemStock;
                                    const type = adjustmentQuantity < 0 ? 'decreased' : adjustmentQuantity > 0 ? 'increased' : 'balanced';

                                    const tempItem = {
                                        item_id: itemId,
                                        type: type,
                                        before_adjustment_quantity: itemStock,
                                        adjustment_quantity: adjustmentQuantity,
                                        after_adjustment_quantity: 0,
                                        reason: '',
                                    };

                                    const newSelectedItemNames = { ...selectedItemNames };
                                    newSelectedItemNames[data.stock_adjustment_details.length] = `${selectedItem.name} (${selectedItem.code})`;
                                    setSelectedItemNames(newSelectedItemNames);

                                    const newSelectedItemUnits = { ...selectedItemUnits };
                                    newSelectedItemUnits[data.stock_adjustment_details.length] = selectedItem.item_unit?.abbreviation || '';
                                    setSelectedItemUnits(newSelectedItemUnits);

                                    setData('new_item', tempItem);
                                }
                            } else {
                                updateAdjustmentItem(index, 'item_id', value);
                            }
                        }}
                        options={getAvailableItems(isAddingNew ? -1 : index).map((item) => ({
                            value: String(item.id),
                            label: `${item.name} (${item.code})`,
                        }))}
                        placeholder="Select an item"
                        searchPlaceholder="Search items..."
                        initialDisplayCount={5}
                        className={
                            isAddingNew && errors[`new_item.item_id` as keyof typeof errors]
                                ? 'border-red-500 ring-red-100'
                                : !isAddingNew && errors[`stock_adjustment_details.${index}.item_id` as keyof typeof errors]
                                  ? 'border-red-500 ring-red-100'
                                  : ''
                        }
                    />
                </div>
                <div className="relative grid min-w-[140px] flex-1 gap-2">
                    <Label htmlFor={`before_adjustment_quantity_${index}`}>Before</Label>
                    <div className="relative">
                        <Input
                            id={`before_adjustment_quantity_${index}`}
                            type="number"
                            value={
                                item.before_adjustment_quantity === 0
                                    ? 0
                                    : item.before_adjustment_quantity % 1 === 0
                                      ? Math.abs(Number(item.before_adjustment_quantity))
                                      : Number(item.before_adjustment_quantity.toFixed(2))
                            }
                            readOnly
                            className="bg-gray-50 pr-10"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                            {isAddingNew ? selectedItemUnits[data.stock_adjustment_details.length] || '' : selectedItemUnits[index] || ''}
                        </div>
                    </div>
                </div>
                <div className="relative grid min-w-[140px] flex-1 gap-2">
                    <Label htmlFor={`after_adjustment_quantity_${index}`}>
                        After <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id={`after_adjustment_quantity_${index}`}
                            type="number"
                            min="0"
                            value={item.after_adjustment_quantity === 0 ? '' : item.after_adjustment_quantity}
                            onChange={(e) => {
                                if (isAddingNew) {
                                    const afterAdjustmentQuantity = Number(e.target.value);
                                    const beforeAdjustmentQuantity = data.new_item?.before_adjustment_quantity || 0;
                                    const adjustmentQuantity = afterAdjustmentQuantity - beforeAdjustmentQuantity;
                                    let type = 'balanced';

                                    if (adjustmentQuantity > 0) {
                                        type = 'increased';
                                    } else if (adjustmentQuantity < 0) {
                                        type = 'decreased';
                                    }

                                    setData('new_item', {
                                        ...data.new_item,
                                        after_adjustment_quantity: afterAdjustmentQuantity,
                                        adjustment_quantity: adjustmentQuantity,
                                        type: type,
                                    });
                                } else {
                                    updateAdjustmentItem(index, 'after_adjustment_quantity', e.target.value);
                                }
                            }}
                            placeholder="Count result"
                            className={`[appearance:textfield] pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                                isAddingNew && errors[`new_item.after_adjustment_quantity` as keyof typeof errors]
                                    ? 'border-red-500 ring-red-100'
                                    : !isAddingNew && errors[`stock_adjustment_details.${index}.after_adjustment_quantity` as keyof typeof errors]
                                      ? 'border-red-500 ring-red-100'
                                      : ''
                            }`}
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                            {isAddingNew ? selectedItemUnits[data.stock_adjustment_details.length] || '' : selectedItemUnits[index] || ''}
                        </div>
                    </div>
                    {!isAddingNew && errors[`stock_adjustment_details.${index}.after_adjustment_quantity` as keyof typeof errors] && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors[`stock_adjustment_details.${index}.after_adjustment_quantity` as keyof typeof errors]}
                        </p>
                    )}
                </div>
                <div className="relative grid min-w-[140px] flex-1 gap-2">
                    <Label htmlFor={`adjustment_quantity_${index}`}>Adjustment</Label>
                    <div className="relative">
                        <Input
                            id={`adjustment_quantity_${index}`}
                            type="number"
                            value={
                                item.adjustment_quantity === 0
                                    ? 0
                                    : item.adjustment_quantity < 0
                                      ? Math.abs(Number(item.adjustment_quantity.toFixed(2)))
                                      : Number(item.adjustment_quantity.toFixed(2))
                            }
                            readOnly
                            className={`bg-gray-50 pr-10 ${
                                item.adjustment_quantity < 0 ? 'text-red-600' : item.adjustment_quantity > 0 ? 'text-green-600' : ''
                            }`}
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                            {isAddingNew ? selectedItemUnits[data.stock_adjustment_details.length] || '' : selectedItemUnits[index] || ''}
                        </div>
                    </div>
                </div>
                <div className="relative grid min-w-[200px] flex-1 gap-2">
                    <Label htmlFor={`reason_${index}`}>Reason</Label>
                    <Input
                        id={`reason_${index}`}
                        type="text"
                        value={item.reason}
                        onChange={(e) => {
                            if (isAddingNew) {
                                setData('new_item', {
                                    ...data.new_item,
                                    reason: e.target.value,
                                });
                            } else {
                                updateAdjustmentItem(index, 'reason', e.target.value);
                            }
                        }}
                        placeholder="Explain adjustment reason"
                        className={`${
                            isAddingNew && errors['new_item.reason' as keyof typeof errors]
                                ? 'border-red-500 ring-red-100'
                                : !isAddingNew && errors[`stock_adjustment_details.${index}.reason` as keyof typeof errors]
                                  ? 'border-red-500 ring-red-100'
                                  : ''
                        }`}
                    />
                </div>
                <div className="flex items-end gap-2 pb-[2px]">
                    <Button
                        type="button"
                        variant="default"
                        size="icon"
                        onClick={saveAdjustmentItem}
                        className="h-9 w-9 bg-green-600 hover:bg-green-700"
                    >
                        <CheckCircle className="h-4 w-4 text-white" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderAdjustmentItemList = (
        adjustmentItem: {
            item_id: number;
            type: string;
            before_adjustment_quantity: number;
            adjustment_quantity: number;
            after_adjustment_quantity: number;
            reason: string;
        },
        index: number,
    ) => {
        const selectedItem = items.find((item) => item.id === adjustmentItem.item_id);
        const itemName = selectedItemNames[index] || (selectedItem ? `${selectedItem.name} (${selectedItem.code})` : '');
        const itemUnit = selectedItemUnits[index] || selectedItem?.item_unit?.abbreviation || '';

        let typeColor = 'bg-gray-100 text-gray-800';
        let typeIcon = '';

        if (adjustmentItem.type === 'increased') {
            typeColor = 'bg-green-100 text-green-800';
            typeIcon = '↑';
        } else if (adjustmentItem.type === 'decreased') {
            typeColor = 'bg-red-100 text-red-800';
            typeIcon = '↓';
        }

        return (
            <div key={index} className="flex items-center justify-between border-b border-gray-100 py-3">
                <div className="flex-1">
                    <div className="mt-1 flex gap-4 text-sm text-gray-500">
                        <p className="font-medium text-gray-900">{itemName}</p>
                        <span>
                            Before:{' '}
                            {adjustmentItem.before_adjustment_quantity === 0
                                ? 0
                                : adjustmentItem.before_adjustment_quantity % 1 === 0
                                  ? Math.abs(Number(adjustmentItem.before_adjustment_quantity))
                                  : Number(adjustmentItem.before_adjustment_quantity.toFixed(2))}{' '}
                            {itemUnit}
                        </span>
                        <span>
                            After: {adjustmentItem.after_adjustment_quantity} {itemUnit}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColor}`}>
                            {typeIcon} {adjustmentItem.type.charAt(0).toUpperCase() + adjustmentItem.type.slice(1)}
                        </span>
                        <span
                            className={`${
                                adjustmentItem.adjustment_quantity < 0
                                    ? 'text-red-600'
                                    : adjustmentItem.adjustment_quantity > 0
                                      ? 'text-green-600'
                                      : ''
                            }`}
                        >
                            {adjustmentItem.adjustment_quantity === 0
                                ? 0
                                : adjustmentItem.adjustment_quantity % 1 === 0
                                  ? Math.abs(Number(adjustmentItem.adjustment_quantity))
                                  : Number(adjustmentItem.adjustment_quantity.toFixed(2))}{' '}
                            {itemUnit}
                        </span>
                        {adjustmentItem.reason && <span>Reason: {adjustmentItem.reason}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => setEditingIndex(index)} className="h-9 w-9">
                        <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAdjustmentItem(index)} className="h-9 w-9">
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Stock Adjustment" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Stock Adjustment" description="Create a new stock adjustment" />
                    <div className="flex gap-3">
                        <Link href={route('stock.adjustment.index')}>
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
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Adjustment Information</h2>
                                    <div className="space-y-4">
                                        <div className="py-2">
                                            <div className="border-b border-gray-100 pb-2">
                                                {data.code ? (
                                                    <div className="flex items-center justify-between">
                                                        <span className="px-3 py-1.5 text-sm font-medium">
                                                            {data.code}
                                                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                                                Generated
                                                            </span>
                                                        </span>
                                                        <input type="hidden" name="code" value={data.code} />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-block h-2 w-2 rounded-full bg-yellow-400"></span>
                                                        <span className="text-sm text-gray-600">Code will be generated after selecting a source</span>
                                                    </div>
                                                )}
                                            </div>
                                            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="source">
                                                Adjustment Source <span className="text-red-500">*</span>
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
                                                        stock_adjustment_details: [],
                                                    }));
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
                                                              .filter((branch) => branch.id === auth.user.branch_id)
                                                              .map((branch) => ({
                                                                  value: `branch-${branch.id}`,
                                                                  label: branch.name,
                                                              }))
                                                }
                                                placeholder="Select adjustment source"
                                                searchPlaceholder="Search sources..."
                                                disabled={!!auth?.user?.branch_id}
                                                className={errors.source_able_id || errors.source_able_type ? 'border-red-500' : ''}
                                            />
                                            {(errors.source_able_id || errors.source_able_type) && (
                                                <p className="text-sm text-red-500">{errors.source_able_id || errors.source_able_type}</p>
                                            )}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="date">
                                                Adjustment Date <span className="text-red-500">*</span>
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
                                        <h2 className="text-base font-semibold text-gray-900">Adjustment Items</h2>
                                        <div className="flex items-center">
                                            <span className="mr-2 text-sm text-gray-500">{data.stock_adjustment_details.length} items</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="max-h-[calc(70vh-260px)] overflow-y-auto pr-2 pl-1">
                                            {addingItem && renderAdjustmentItemForm(null, -1, true)}

                                            {data.stock_adjustment_details.map((adjustmentItem, index) => (
                                                <div key={index}>
                                                    {editingIndex === index
                                                        ? renderAdjustmentItemForm(adjustmentItem, index)
                                                        : renderAdjustmentItemList(adjustmentItem, index)}
                                                </div>
                                            ))}
                                        </div>

                                        {data.stock_adjustment_details.length === 0 && !addingItem && (
                                            <div className="flex items-center justify-center py-8 text-center text-gray-500">
                                                <p>No items added yet. Click the button below to add items to adjustment.</p>
                                            </div>
                                        )}

                                        {!addingItem && !editingIndex && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addAdjustmentItem}
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

                    <div className="mt-6 flex justify-end gap-3 py-4">
                        <Button variant="outline" type="button" onClick={() => router.visit(route('stock.adjustment.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || data.stock_adjustment_details.length === 0} className="px-8">
                            {processing ? 'Creating...' : 'Create Adjustment'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
