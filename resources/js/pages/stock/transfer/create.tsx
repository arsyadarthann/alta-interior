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
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CalendarIcon, CheckCircle, Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stock',
        href: '#',
    },
    {
        title: 'Transfer',
        href: route('stock.transfer.index'),
    },
    {
        title: 'Create',
        href: route('stock.transfer.create'),
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

type LocationOption = {
    id: number;
    name: string;
    type: 'branch' | 'warehouse';
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

type ItemStockDetail = {
    source_before_quantity: number;
    source_after_quantity: number;
    destination_before_quantity: number;
    destination_after_quantity: number;
};

export default function Create({ branches = [], warehouses = [] }: { branches?: Branch[]; warehouses?: Warehouse[] }) {
    const { showErrorToast } = useToastNotification();
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItemNames, setSelectedItemNames] = useState<Record<number, string>>({});
    const [selectedItemUnits, setSelectedItemUnits] = useState<Record<number, string>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [addingItem, setAddingItem] = useState<boolean>(false);
    const [, setInitialized] = useState(false);
    const [itemStockDetails, setItemStockDetails] = useState<Record<number, ItemStockDetail>>({});

    // Combine branches and warehouses for selection
    const locationOptions: LocationOption[] = [
        ...branches.map((branch) => ({ id: branch.id, name: branch.name, type: 'branch' as const })),
        ...warehouses.map((warehouse) => ({ id: warehouse.id, name: warehouse.name, type: 'warehouse' as const })),
    ];

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        date: '',
        source_able_id: '',
        source_able_type: '',
        destination_able_id: '',
        destination_able_type: '',
        stock_transfer_details: [] as {
            item_id: number;
            quantity: number;
            source_before_quantity: number;
            source_after_quantity: number;
            destination_before_quantity: number;
            destination_after_quantity: number;
        }[],
        new_item: {
            item_id: 0,
            quantity: 0,
        },
    });

    const fetchTransferCode = useCallback(() => {
        fetch(route('stock.transfer.getCode'), {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Network response error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then((responseData) => {
                if (responseData && responseData.code) {
                    setData('code', responseData.code);
                } else {
                    console.error('Unexpected response format:', responseData);
                    throw new Error('Invalid response format: Code not found in response');
                }
            })
            .catch((error) => {
                console.error('Error fetching transfer code:', error);
                showErrorToast([`Failed to get transfer code: ${error.message}`]);
            });
    }, [setData, showErrorToast]);

    useEffect(() => {
        fetchTransferCode();
        setInitialized(true);
    }, []);

    const fetchItems = useCallback(
        (locationId: string, locationType: string) => {
            let url;
            if (locationType === 'branch') {
                locationType = 'App\\Models\\Branch';
                url = 'item.getItemByBranch';
            } else {
                locationType = 'App\\Models\\Warehouse';
                url = 'item.getItemByWarehouse';
            }
            fetch(route(url, locationId), {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Network response error: ${response.status} ${response.statusText}`);
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
                    setData('stock_transfer_details', []);
                    setSelectedItemNames({});
                    setSelectedItemUnits({});
                    setItemStockDetails({});
                })
                .catch((error) => {
                    console.error('Error fetching items:', error);
                    showErrorToast([error.message]);
                });
        },
        [setItems, setData, setSelectedItemNames, setSelectedItemUnits, showErrorToast],
    );

    const fetchDestinationItemStock = useCallback(async (locationId: string, locationType: string, itemId: number) => {
        if (!locationId || !locationType || !itemId) return 0;

        let url;
        if (locationType === 'branch') {
            url = 'item.getItemStockByBranch';
        } else {
            url = 'item.getItemStockByWarehouse';
        }
        try {
            const response = await fetch(
                route(url, {
                    item_id: itemId,
                    source_able_id: locationId,
                }),
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Network response error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data?.stock || 0;
        } catch (error) {
            console.error('Error fetching destination item stock:', error);
            return 0;
        }
    }, []);

    const updateStockCalculation = useCallback(
        async (itemId: number, quantity: number, index: number) => {
            const selectedItem = items.find((item) => item.id === itemId);
            if (!selectedItem || !data.destination_able_id || !data.destination_able_type) return;

            const sourceBefore = selectedItem.stock || 0;
            const sourceAfter = sourceBefore - quantity;

            const destinationBefore = await fetchDestinationItemStock(data.destination_able_id, data.destination_able_type, itemId);
            const destinationAfter = Number(destinationBefore) + Number(quantity);

            setItemStockDetails((prev) => ({
                ...prev,
                [index]: {
                    source_before_quantity: sourceBefore,
                    source_after_quantity: sourceAfter,
                    destination_before_quantity: destinationBefore,
                    destination_after_quantity: destinationAfter,
                },
            }));

            const updatedTransferDetails = [...data.stock_transfer_details];
            if (index < updatedTransferDetails.length) {
                updatedTransferDetails[index] = {
                    ...updatedTransferDetails[index],
                    source_before_quantity: sourceBefore,
                    source_after_quantity: sourceAfter,
                    destination_before_quantity: destinationBefore,
                    destination_after_quantity: destinationAfter,
                };
                setData('stock_transfer_details', updatedTransferDetails);
            }
        },
        [items, data.destination_able_id, data.destination_able_type, fetchDestinationItemStock, setData, data.stock_transfer_details],
    );

    const formatStockQuantity = (stock: number | string | null | undefined): string => {
        const numStock = Number(stock);

        // Check if it's a valid number
        if (isNaN(numStock)) return '0';

        // If it's a whole number, return without decimals
        if (Number.isInteger(numStock) || numStock % 1 === 0) {
            return Math.floor(numStock).toString();
        }

        // If it has decimals, return with 2 decimal places
        return numStock.toFixed(2);
    };

    const handleSourceLocationChange = (value: string) => {
        // Skip processing for the placeholder value
        if (value === 'placeholder') return;

        const [type, id] = value.split(':');

        setData((prev) => ({
            ...prev,
            source_able_id: id,
            source_able_type: type,
            stock_transfer_details: [],
        }));

        if (id && type) {
            fetchItems(id, type);
        } else {
            setItems([]);
        }
    };

    const handleDestinationLocationChange = (value: string) => {
        // Skip processing for the placeholder value
        if (value === 'placeholder') return;

        const [type, id] = value.split(':');

        setData((prev) => ({
            ...prev,
            destination_able_id: id,
            destination_able_type: type,
        }));

        if (id && type && data.stock_transfer_details.length > 0) {
            data.stock_transfer_details.forEach((item, index) => {
                updateStockCalculation(item.item_id, item.quantity, index);
            });
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post(route('stock.transfer.store'), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    const addTransferItem = () => {
        setAddingItem(true);
        setData('new_item', {
            item_id: 0,
            quantity: 0,
        });
    };

    const saveTransferItem = async () => {
        if (editingIndex !== null) {
            setEditingIndex(null);
        } else {
            setAddingItem(false);
            if (data.new_item.item_id !== 0) {
                const newIndex = data.stock_transfer_details.length;

                const selectedItem = items.find((itm) => itm.id === data.new_item.item_id);
                const sourceBefore = selectedItem?.stock || 0;
                const sourceAfter = sourceBefore - data.new_item.quantity;
                const destinationBefore = await fetchDestinationItemStock(
                    data.destination_able_id,
                    data.destination_able_type,
                    data.new_item.item_id,
                );
                const destinationAfter = Number(destinationBefore) + Number(data.new_item.quantity);

                const newTransferItem = {
                    ...data.new_item,
                    source_before_quantity: sourceBefore,
                    source_after_quantity: sourceAfter,
                    destination_before_quantity: destinationBefore,
                    destination_after_quantity: destinationAfter,
                };

                setData('stock_transfer_details', [...data.stock_transfer_details, newTransferItem]);

                await updateStockCalculation(data.new_item.item_id, data.new_item.quantity, newIndex);

                setData('new_item', {
                    item_id: 0,
                    quantity: 0,
                });
            } else {
                showErrorToast(['Please select an item']);
            }
        }
    };

    const removeTransferItem = (index: number) => {
        const updatedItems = [...data.stock_transfer_details];

        const newSelectedItemNames = { ...selectedItemNames };
        const newSelectedItemUnits = { ...selectedItemUnits };
        const newItemStockDetails = { ...itemStockDetails };

        delete newSelectedItemNames[index];
        delete newSelectedItemUnits[index];
        delete newItemStockDetails[index];

        updatedItems.splice(index, 1);
        setData('stock_transfer_details', updatedItems);

        const updatedSelectedItemNames: Record<number, string> = {};
        const updatedSelectedItemUnits: Record<number, string> = {};
        const updatedItemStockDetails: Record<number, ItemStockDetail> = {};

        Object.keys(newSelectedItemNames).forEach((key) => {
            const keyNum = parseInt(key, 10);
            if (keyNum > index) {
                updatedSelectedItemNames[keyNum - 1] = newSelectedItemNames[keyNum];
                updatedSelectedItemUnits[keyNum - 1] = newSelectedItemUnits[keyNum];
                if (newItemStockDetails[keyNum]) {
                    updatedItemStockDetails[keyNum - 1] = newItemStockDetails[keyNum];
                }
            } else {
                updatedSelectedItemNames[keyNum] = newSelectedItemNames[keyNum];
                updatedSelectedItemUnits[keyNum] = newSelectedItemUnits[keyNum];
                if (newItemStockDetails[keyNum]) {
                    updatedItemStockDetails[keyNum] = newItemStockDetails[keyNum];
                }
            }
        });

        setSelectedItemNames(updatedSelectedItemNames);
        setSelectedItemUnits(updatedSelectedItemUnits);
        setItemStockDetails(updatedItemStockDetails);
    };

    const updateTransferItem = async (index: number, field: 'item_id' | 'quantity', value: string | number) => {
        const updatedItems = [...data.stock_transfer_details];

        if (field === 'item_id') {
            const itemId = Number(value);
            const selectedItem = items.find((itm) => itm.id === itemId);

            if (selectedItem) {
                const newSelectedItemNames = { ...selectedItemNames };
                newSelectedItemNames[index] = `${selectedItem.name} (${selectedItem.code})`;
                setSelectedItemNames(newSelectedItemNames);

                const newSelectedItemUnits = { ...selectedItemUnits };
                newSelectedItemUnits[index] = selectedItem.item_unit?.abbreviation || '';
                setSelectedItemUnits(newSelectedItemUnits);

                const sourceBefore = selectedItem.stock || 0;
                const quantity = updatedItems[index].quantity || 0;
                const sourceAfter = sourceBefore - quantity;
                const destinationBefore = await fetchDestinationItemStock(data.destination_able_id, data.destination_able_type, itemId);
                const destinationAfter = Number(destinationBefore) + Number(quantity);

                updatedItems[index] = {
                    ...updatedItems[index],
                    item_id: itemId,
                    source_before_quantity: sourceBefore,
                    source_after_quantity: sourceAfter,
                    destination_before_quantity: destinationBefore,
                    destination_after_quantity: destinationAfter,
                };

                setData('stock_transfer_details', updatedItems);

                await updateStockCalculation(itemId, quantity, index);
            }
        } else if (field === 'quantity') {
            let qty = Number(value);
            if (qty < 0) qty = 0;

            const selectedItem = items.find((item) => item.id === updatedItems[index].item_id);
            if (selectedItem) {
                const sourceBefore = selectedItem.stock || 0;
                const sourceAfter = sourceBefore - qty;
                const destinationBefore = await fetchDestinationItemStock(data.destination_able_id, data.destination_able_type, selectedItem.id);
                const destinationAfter = Number(destinationBefore) + Number(qty);

                updatedItems[index] = {
                    ...updatedItems[index],
                    quantity: qty,
                    source_before_quantity: sourceBefore,
                    source_after_quantity: sourceAfter,
                    destination_before_quantity: destinationBefore,
                    destination_after_quantity: destinationAfter,
                };

                setData('stock_transfer_details', updatedItems);

                await updateStockCalculation(selectedItem.id, qty, index);
            }
        }
    };

    const getAvailableItems = (currentIndex: number) => {
        return items.filter((item) => {
            const stockValue = Number(item.stock);
            return (
                !isNaN(stockValue) &&
                stockValue > 0 &&
                !data.stock_transfer_details.some((transferItem, i) => i !== currentIndex && transferItem.item_id === item.id)
            );
        });
    };

    const formatQuantity = (value: number | undefined | null) => {
        const numValue = Number(value);

        if (isNaN(numValue)) return '0';

        if (Number.isInteger(numValue) || numValue % 1 === 0) {
            return Math.floor(numValue).toString();
        }

        return numValue.toFixed(2);
    };

    const renderTransferItemForm = (
        transferItem: {
            item_id: number;
            quantity: number;
        } | null = null,
        index: number = -1,
        isAddingNew: boolean = false,
    ) => {
        const item = transferItem || data.new_item;
        const selectedItemId = isAddingNew ? data.new_item.item_id : item.item_id;
        const selectedItem = items.find((itm) => itm.id === selectedItemId);
        const maxQuantity = selectedItem?.stock || 0;

        return (
            <div className="mb-4 rounded-md border bg-gray-50 p-4">
                <div className="flex flex-wrap items-start gap-3">
                    <div className="relative grid min-w-[300px] flex-1 gap-2">
                        <Label htmlFor={`item_id_${index}`}>
                            Item <span className="text-red-500">*</span>
                        </Label>
                        <Combobox
                            value={selectedItemId ? String(selectedItemId) : ''}
                            onValueChange={(value) => {
                                if (isAddingNew) {
                                    const itemId = Number(value);
                                    const selectedItem = items.find((itm) => itm.id === itemId);

                                    if (selectedItem) {
                                        const tempItem = {
                                            item_id: itemId,
                                            quantity: 0,
                                        };

                                        const newSelectedItemNames = { ...selectedItemNames };
                                        newSelectedItemNames[data.stock_transfer_details.length] = `${selectedItem.name} (${selectedItem.code})`;
                                        setSelectedItemNames(newSelectedItemNames);

                                        const newSelectedItemUnits = { ...selectedItemUnits };
                                        newSelectedItemUnits[data.stock_transfer_details.length] = selectedItem.item_unit?.abbreviation || '';
                                        setSelectedItemUnits(newSelectedItemUnits);

                                        setData('new_item', tempItem);
                                    }
                                } else {
                                    updateTransferItem(index, 'item_id', value);
                                }
                            }}
                            options={getAvailableItems(isAddingNew ? -1 : index).map((itm) => ({
                                value: String(itm.id),
                                label: `${itm.name} (${itm.code}) - Stock: ${formatStockQuantity(itm.stock)} ${itm.item_unit?.abbreviation || ''}`,
                            }))}
                            placeholder="Select an item"
                            searchPlaceholder="Search items..."
                            initialDisplayCount={5}
                            className={
                                isAddingNew && errors[`new_item.item_id` as keyof typeof errors]
                                    ? 'border-red-500 ring-red-100'
                                    : !isAddingNew && errors[`stock_transfer_details.${index}.item_id` as keyof typeof errors]
                                      ? 'border-red-500 ring-red-100'
                                      : ''
                            }
                        />
                    </div>
                    <div className="relative grid min-w-[200px] flex-1 gap-2">
                        <Label htmlFor={`quantity_${index}`}>
                            Quantity <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id={`quantity_${index}`}
                                type="number"
                                min="0"
                                max={maxQuantity}
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => {
                                    let qty = Number(e.target.value);
                                    if (qty < 0) qty = 0;

                                    if (isAddingNew) {
                                        setData('new_item', {
                                            ...data.new_item,
                                            quantity: qty > maxQuantity ? maxQuantity : qty,
                                        });
                                    } else {
                                        const itemMaxQty = items.find((itm) => itm.id === item.item_id)?.stock || 0;
                                        updateTransferItem(index, 'quantity', qty > itemMaxQty ? itemMaxQty : qty);
                                    }
                                }}
                                placeholder="Enter quantity"
                                className={`[appearance:textfield] pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                                    isAddingNew && errors[`new_item.quantity` as keyof typeof errors]
                                        ? 'border-red-500 ring-red-100'
                                        : !isAddingNew && errors[`stock_transfer_details.${index}.quantity` as keyof typeof errors]
                                          ? 'border-red-500 ring-red-100'
                                          : ''
                                }`}
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                                {isAddingNew ? selectedItemUnits[data.stock_transfer_details.length] || '' : selectedItemUnits[index] || ''}
                            </div>
                        </div>
                        {!isAddingNew && errors[`stock_transfer_details.${index}.quantity` as keyof typeof errors] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`stock_transfer_details.${index}.quantity` as keyof typeof errors]}</p>
                        )}
                    </div>
                    <div className="flex-none self-end pb-[2px]">
                        <Button
                            type="button"
                            variant="default"
                            size="icon"
                            onClick={saveTransferItem}
                            className="h-9 w-9 bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="h-4 w-4 text-white" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const renderTransferItemList = (
        transferItem: {
            item_id: number;
            quantity: number;
        },
        index: number,
    ) => {
        const selectedItem = items.find((itm) => itm.id === transferItem.item_id);
        const itemName = selectedItemNames[index] || (selectedItem ? `${selectedItem.name} (${selectedItem.code})` : 'Unknown Item');
        const itemUnit = selectedItemUnits[index] || selectedItem?.item_unit?.abbreviation || '';

        const stockDetail = itemStockDetails[index];

        // Get source and destination location names
        const sourceLocation =
            locationOptions.find((loc) => loc.id.toString() === data.source_able_id && loc.type === data.source_able_type)?.name || 'Source';

        const destinationLocation =
            locationOptions.find((loc) => loc.id.toString() === data.destination_able_id && loc.type === data.destination_able_type)?.name ||
            'Destination';

        return (
            <div key={index} className="border-b border-gray-100 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="font-medium text-gray-900">{itemName}</p>
                        <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
                            <span>
                                Quantity: {formatQuantity(transferItem.quantity)} {itemUnit}
                            </span>

                            {stockDetail && (
                                <>
                                    <span className="text-gray-600">
                                        From: {sourceLocation} ({formatQuantity(stockDetail.source_before_quantity)}→{' '}
                                        <span className={stockDetail.source_after_quantity < 0 ? 'text-red-600' : 'text-amber-600'}>
                                            {formatQuantity(stockDetail.source_after_quantity)}
                                        </span>
                                        )
                                    </span>
                                    <span className="text-gray-600">
                                        To: {destinationLocation} ({formatQuantity(stockDetail.destination_before_quantity)}→{' '}
                                        <span className="text-green-600">{formatQuantity(stockDetail.destination_after_quantity)}</span>)
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="icon" onClick={() => setEditingIndex(index)} className="h-9 w-9">
                            <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTransferItem(index)} className="h-9 w-9">
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Stock Transfer" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Stock Transfer" description="Transfer stock items between branches and warehouses." />
                    <div className="flex gap-3">
                        <Link href={route('stock.transfer.index')}>
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
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Transfer Information</h2>
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
                                                        <span className="text-sm text-gray-600">Loading transfer code...</span>
                                                    </div>
                                                )}
                                            </div>
                                            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="source_location">
                                                From Location <span className="text-red-500">*</span>
                                            </Label>
                                            <Combobox
                                                value={
                                                    data.source_able_id && data.source_able_type
                                                        ? `${data.source_able_type}:${data.source_able_id}`
                                                        : ''
                                                }
                                                onValueChange={handleSourceLocationChange}
                                                options={[
                                                    ...warehouses.map((warehouse) => ({
                                                        value: `warehouse:${warehouse.id}`,
                                                        label: warehouse.name,
                                                    })),
                                                    ...branches.map((branch) => ({
                                                        value: `branch:${branch.id}`,
                                                        label: branch.name,
                                                    })),
                                                ]}
                                                placeholder="Select source location"
                                                searchPlaceholder="Search locations..."
                                                initialDisplayCount={5}
                                                className={errors.source_able_id || errors.source_able_type ? 'border-red-500' : ''}
                                            />
                                            {(errors.source_able_id || errors.source_able_type) && (
                                                <p className="text-sm text-red-500">{errors.source_able_id || errors.source_able_type}</p>
                                            )}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="destination_location">
                                                To Location <span className="text-red-500">*</span>
                                            </Label>
                                            <Combobox
                                                value={
                                                    data.destination_able_id && data.destination_able_type
                                                        ? `${data.destination_able_type}:${data.destination_able_id}`
                                                        : ''
                                                }
                                                onValueChange={handleDestinationLocationChange}
                                                options={[
                                                    ...branches
                                                        .filter(
                                                            (branch) =>
                                                                !(data.source_able_type === 'branch' && branch.id.toString() === data.source_able_id),
                                                        )
                                                        .map((branch) => ({
                                                            value: `branch:${branch.id}`,
                                                            label: branch.name,
                                                        })),
                                                    ...warehouses
                                                        .filter(
                                                            (warehouse) =>
                                                                !(
                                                                    data.source_able_type === 'warehouse' &&
                                                                    warehouse.id.toString() === data.source_able_id
                                                                ),
                                                        )
                                                        .map((warehouse) => ({
                                                            value: `warehouse:${warehouse.id}`,
                                                            label: warehouse.name,
                                                        })),
                                                ]}
                                                placeholder="Select destination location"
                                                searchPlaceholder="Search locations..."
                                                initialDisplayCount={5}
                                                className={errors.destination_able_id || errors.destination_able_type ? 'border-red-500' : ''}
                                            />
                                            {(errors.destination_able_id || errors.destination_able_type) && (
                                                <p className="text-sm text-red-500">{errors.destination_able_id || errors.destination_able_type}</p>
                                            )}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="date">
                                                Transfer Date <span className="text-red-500">*</span>
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
                                        <h2 className="text-base font-semibold text-gray-900">Transfer Items</h2>
                                        <div className="flex items-center">
                                            <span className="mr-2 text-sm text-gray-500">{data.stock_transfer_details.length} items</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="max-h-[calc(70vh-260px)] overflow-y-auto pr-2 pl-1">
                                            {/* Render form when adding new item */}
                                            {addingItem && renderTransferItemForm(null, -1, true)}

                                            {/* Render list or edit form for each item */}
                                            {data.stock_transfer_details.map((transferItem, index) => (
                                                <div key={index}>
                                                    {editingIndex === index
                                                        ? renderTransferItemForm(transferItem, index)
                                                        : renderTransferItemList(transferItem, index)}
                                                </div>
                                            ))}
                                        </div>

                                        {data.stock_transfer_details.length === 0 && !addingItem && (
                                            <div className="flex items-center justify-center py-8 text-center text-gray-500">
                                                <p>No items added yet. Click the button below to add items to transfer.</p>
                                            </div>
                                        )}

                                        {!addingItem && editingIndex === null && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addTransferItem}
                                                className="mt-2"
                                                disabled={!data.source_able_id || !data.source_able_type || items.length === 0}
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

                    <div className="sticky bottom-0 mt-6 border-t bg-white pt-4 pb-2">
                        <div className="flex items-center justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => router.visit(route('stock.transfer.index'))}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    processing ||
                                    data.stock_transfer_details.length === 0 ||
                                    !data.source_able_id ||
                                    !data.source_able_type ||
                                    !data.destination_able_id ||
                                    !data.destination_able_type
                                }
                                className="px-8"
                            >
                                {processing ? 'Processing...' : 'Create Transfer'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
