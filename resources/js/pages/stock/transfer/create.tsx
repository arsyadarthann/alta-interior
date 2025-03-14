import React, { useState, useEffect, useCallback } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import Heading from "@/components/heading";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ArrowLeft, CalendarIcon, Edit, CheckCircle } from "lucide-react";
import { useToastNotification } from "@/hooks/use-toast-notification";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
        href: route('stock.transfer.create')
    }
];

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

type ItemStockDetail = {
    from_branch_before_quantity: number;
    from_branch_after_quantity: number;
    to_branch_before_quantity: number;
    to_branch_after_quantity: number;
}

export default function Create({ branches = [] }: { branches?: Branch[] }) {
    const { showErrorToast } = useToastNotification();
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItemNames, setSelectedItemNames] = useState<Record<number, string>>({});
    const [selectedItemUnits, setSelectedItemUnits] = useState<Record<number, string>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [addingItem, setAddingItem] = useState<boolean>(false);
    const [initialized, setInitialized] = useState(false);
    const [itemStockDetails, setItemStockDetails] = useState<Record<number, ItemStockDetail>>({});

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        date: new Date(),
        from_branch_id: '',
        to_branch_id: '',
        stock_transfer_details: [] as {
            item_id: number;
            quantity: number;
            from_branch_before_quantity: number;
            from_branch_after_quantity: number;
            to_branch_before_quantity: number;
            to_branch_after_quantity: number;
        }[],
        new_item: {
            item_id: 0,
            quantity: 0
        },
    });

    const fetchTransferCode = useCallback(() => {
        fetch(route('stock.transfer.getCode'), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(responseData => {
                if (responseData && responseData.code) {
                    setData('code', responseData.code);
                } else {
                    console.error('Unexpected response format:', responseData);
                    throw new Error('Invalid response format: Code not found in response');
                }
            })
            .catch(error => {
                console.error('Error fetching transfer code:', error);
                showErrorToast([`Failed to get transfer code: ${error.message}`]);
            });
    }, [setData, showErrorToast]);

    useEffect(() => {
        fetchTransferCode();
        setInitialized(true);
    }, []);

    const fetchItems = useCallback((branchId: string) => {
        fetch(route('item.getItemByBranch', branchId), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(responseData => {
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
            .catch(error => {
                console.error('Error fetching items:', error);
                showErrorToast([error.message]);
            });
    }, [setItems, setData, setSelectedItemNames, setSelectedItemUnits, showErrorToast]);

    const fetchDestinationItemStock = useCallback(async (branchId: string, itemId: number) => {
        if (!branchId || !itemId) return 0;

        try {
            const response = await fetch(route('item.getItemStockByBranch', {
                branch_id: branchId,
                item_id: itemId
            }), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

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

    const updateStockCalculation = useCallback(async (itemId: number, quantity: number, index: number) => {
        const selectedItem = items.find(item => item.id === itemId);
        if (!selectedItem || !data.to_branch_id) return;

        const fromBranchBefore = selectedItem.stock || 0;
        const fromBranchAfter = fromBranchBefore - quantity;

        const toBranchBefore = await fetchDestinationItemStock(data.to_branch_id, itemId);
        const toBranchAfter = Number(toBranchBefore) + Number(quantity);

        setItemStockDetails(prev => ({
            ...prev,
            [index]: {
                from_branch_before_quantity: fromBranchBefore,
                from_branch_after_quantity: fromBranchAfter,
                to_branch_before_quantity: toBranchBefore,
                to_branch_after_quantity: toBranchAfter
            }
        }));

        const updatedTransferDetails = [...data.stock_transfer_details];
        if (index < updatedTransferDetails.length) {
            updatedTransferDetails[index] = {
                ...updatedTransferDetails[index],
                from_branch_before_quantity: fromBranchBefore,
                from_branch_after_quantity: fromBranchAfter,
                to_branch_before_quantity: toBranchBefore,
                to_branch_after_quantity: toBranchAfter
            };
            setData('stock_transfer_details', updatedTransferDetails);
        }
    }, [items, data.to_branch_id, fetchDestinationItemStock, setData, data.stock_transfer_details]);

    const handleFromBranchChange = (value: string) => {
        setData(prev => ({
            ...prev,
            from_branch_id: value,
            stock_transfer_details: []
        }));

        if (value) {
            fetchItems(value);
        } else {
            setItems([]);
        }
    };

    const handleToBranchChange = (value: string) => {
        setData(prev => ({
            ...prev,
            to_branch_id: value
        }));

        if (value && data.stock_transfer_details.length > 0) {
            data.stock_transfer_details.forEach((item, index) => {
                updateStockCalculation(item.item_id, item.quantity, index);
            });
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post(route('stock.transfer.store'), {
            preserveScroll: true,
            onError: showErrorToast
        });
    };

    const addTransferItem = () => {
        setAddingItem(true);
        setData('new_item', {
            item_id: 0,
            quantity: 0
        });
    };

    const saveTransferItem = async () => {
        if (editingIndex !== null) {
            setEditingIndex(null);
        } else {
            setAddingItem(false);
            if (data.new_item.item_id !== 0) {
                const newIndex = data.stock_transfer_details.length;

                const selectedItem = items.find(itm => itm.id === data.new_item.item_id);
                const fromBranchBefore = selectedItem?.stock || 0;
                const fromBranchAfter = fromBranchBefore - data.new_item.quantity;
                const toBranchBefore = await fetchDestinationItemStock(data.to_branch_id, data.new_item.item_id);
                const toBranchAfter = Number(toBranchBefore) + Number(data.new_item.quantity);

                const newTransferItem = {
                    ...data.new_item,
                    from_branch_before_quantity: fromBranchBefore,
                    from_branch_after_quantity: fromBranchAfter,
                    to_branch_before_quantity: toBranchBefore,
                    to_branch_after_quantity: toBranchAfter
                };

                setData('stock_transfer_details', [
                    ...data.stock_transfer_details,
                    newTransferItem
                ]);

                await updateStockCalculation(data.new_item.item_id, data.new_item.quantity, newIndex);

                setData('new_item', {
                    item_id: 0,
                    quantity: 0
                });
            } else {
                showErrorToast(["Please select an item"]);
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

        Object.keys(newSelectedItemNames).forEach(key => {
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

    const updateTransferItem = async (
        index: number,
        field: 'item_id' | 'quantity',
        value: string | number
    ) => {
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

                const fromBranchBefore = selectedItem.stock || 0;
                const quantity = updatedItems[index].quantity || 0;
                const fromBranchAfter = fromBranchBefore - quantity;
                const toBranchBefore = await fetchDestinationItemStock(data.to_branch_id, itemId);
                const toBranchAfter = Number(toBranchBefore) + Number(quantity);

                updatedItems[index] = {
                    ...updatedItems[index],
                    item_id: itemId,
                    from_branch_before_quantity: fromBranchBefore,
                    from_branch_after_quantity: fromBranchAfter,
                    to_branch_before_quantity: toBranchBefore,
                    to_branch_after_quantity: toBranchAfter
                };

                setData('stock_transfer_details', updatedItems);

                await updateStockCalculation(itemId, quantity, index);
            }
        } else if (field === 'quantity') {
            let qty = Number(value);
            if (qty < 0) qty = 0;

            const selectedItem = items.find(item => item.id === updatedItems[index].item_id);
            if (selectedItem) {
                const fromBranchBefore = selectedItem.stock || 0;
                const fromBranchAfter = fromBranchBefore - qty;
                const toBranchBefore = await fetchDestinationItemStock(data.to_branch_id, selectedItem.id);
                const toBranchAfter = Number(toBranchBefore) + Number(qty);

                updatedItems[index] = {
                    ...updatedItems[index],
                    quantity: qty,
                    from_branch_before_quantity: fromBranchBefore,
                    from_branch_after_quantity: fromBranchAfter,
                    to_branch_before_quantity: toBranchBefore,
                    to_branch_after_quantity: toBranchAfter
                };

                setData('stock_transfer_details', updatedItems);

                await updateStockCalculation(selectedItem.id, qty, index);
            }
        }
    };

    const getAvailableItems = (currentIndex: number) => {
        return items.filter(item => {
            return item.stock && item.stock > 0 && !data.stock_transfer_details.some(
                (transferItem, i) => i !== currentIndex && transferItem.item_id === item.id
            );
        });
    };

    const formatQuantity = (value: number | undefined | null) => {
        const numValue = Number(value);

        if (isNaN(numValue)) return '0';

        if (Number.isInteger(numValue) || (numValue % 1 === 0)) {
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
        isAddingNew: boolean = false
    ) => {
        const item = transferItem || data.new_item;
        const selectedItemId = isAddingNew ? data.new_item.item_id : item.item_id;
        const selectedItem = items.find(itm => itm.id === selectedItemId);
        const maxQuantity = selectedItem?.stock || 0;

        return (
            <div className="border bg-gray-50 rounded-md p-4 mb-4">
                <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-[300px] relative grid gap-2">
                        <Label htmlFor={`item_id_${index}`}>
                            Item <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={selectedItemId ? String(selectedItemId) : ""}
                            onValueChange={(value) => {
                                if (isAddingNew) {
                                    const itemId = Number(value);
                                    const selectedItem = items.find(itm => itm.id === itemId);

                                    if (selectedItem) {
                                        const tempItem = {
                                            item_id: itemId,
                                            quantity: 0
                                        };

                                        const newSelectedItemNames = { ...selectedItemNames };
                                        newSelectedItemNames[data.stock_transfer_details.length] =
                                            `${selectedItem.name} (${selectedItem.code})`;
                                        setSelectedItemNames(newSelectedItemNames);

                                        const newSelectedItemUnits = { ...selectedItemUnits };
                                        newSelectedItemUnits[data.stock_transfer_details.length] =
                                            selectedItem.item_unit?.abbreviation || '';
                                        setSelectedItemUnits(newSelectedItemUnits);

                                        setData('new_item', tempItem);
                                    }
                                } else {
                                    updateTransferItem(index, 'item_id', value);
                                }
                            }}
                        >
                            <SelectTrigger
                                id={`item_id_${index}`}
                                className={`w-full ${
                                    isAddingNew && errors[`new_item.item_id` as keyof typeof errors] ? "border-red-500 ring-red-100" :
                                        !isAddingNew && errors[`stock_transfer_details.${index}.item_id` as keyof typeof errors] ?
                                            "border-red-500 ring-red-100" : ""
                                }`}
                            >
                                <SelectValue placeholder="Select an item" />
                            </SelectTrigger>
                            <SelectContent>
                                {getAvailableItems(isAddingNew ? -1 : index).map((itm) => (
                                    <SelectItem key={itm.id} value={String(itm.id)}>
                                        {itm.name} ({itm.code}) -
                                        Stock: {itm.stock % 1 === 0 ? Math.floor(itm.stock) : itm.stock.toFixed(2)} {itm.item_unit?.abbreviation || ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[200px] relative grid gap-2">
                        <Label htmlFor={`quantity_${index}`}>
                            Quantity <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id={`quantity_${index}`}
                                type="number"
                                min="0"
                                max={maxQuantity}
                                value={item.quantity === 0 ? "" : item.quantity}
                                onChange={(e) => {
                                    let qty = Number(e.target.value);
                                    if (qty < 0) qty = 0;

                                    if (isAddingNew) {
                                        setData('new_item', {
                                            ...data.new_item,
                                            quantity: qty > maxQuantity ? maxQuantity : qty
                                        });
                                    } else {
                                        const itemMaxQty = items.find(itm => itm.id === item.item_id)?.stock || 0;
                                        updateTransferItem(index, 'quantity', qty > itemMaxQty ? itemMaxQty : qty);
                                    }
                                }}
                                placeholder="Enter quantity"
                                className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pr-10 ${
                                    isAddingNew && errors[`new_item.quantity` as keyof typeof errors] ? "border-red-500 ring-red-100" :
                                        !isAddingNew && errors[`stock_transfer_details.${index}.quantity` as keyof typeof errors] ?
                                            "border-red-500 ring-red-100" : ""
                                }`}
                            />
                            <div
                                className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500 text-sm">
                                {isAddingNew ? selectedItemUnits[data.stock_transfer_details.length] || '' : selectedItemUnits[index] || ''}
                            </div>
                        </div>
                        {!isAddingNew && errors[`stock_transfer_details.${index}.quantity` as keyof typeof errors] && (
                            <p className="text-xs text-red-500 mt-1">
                                {errors[`stock_transfer_details.${index}.quantity` as keyof typeof errors]}
                            </p>
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

    const renderTransferItemList = (transferItem: {
        item_id: number;
        quantity: number;
    }, index: number) => {
        const selectedItem = items.find((itm) => itm.id === transferItem.item_id);
        const itemName = selectedItemNames[index] ||
            (selectedItem ? `${selectedItem.name} (${selectedItem.code})` : "Unknown Item");
        const itemUnit = selectedItemUnits[index] ||
            (selectedItem?.item_unit?.abbreviation || '');

        const stockDetail = itemStockDetails[index];
        const fromBranch = branches.find(b => b.id.toString() === data.from_branch_id)?.name || "Source";
        const toBranch = branches.find(b => b.id.toString() === data.to_branch_id)?.name || "Destination";

        return (
            <div key={index} className="border-b border-gray-100 py-3">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <p className="font-medium text-gray-900">
                            {itemName}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                            <span>Quantity: {formatQuantity(transferItem.quantity)} {itemUnit}</span>

                            {stockDetail && (
                                <>
                                    <span className="text-gray-600">
                                        From: {fromBranch} ({formatQuantity(stockDetail.from_branch_before_quantity)}
                                        → <span className={stockDetail.from_branch_after_quantity < 0 ? "text-red-600" : "text-amber-600"}>
                                            {formatQuantity(stockDetail.from_branch_after_quantity)}
                                        </span>)
                                    </span>
                                    <span className="text-gray-600">
                                        To: {toBranch} ({formatQuantity(stockDetail.to_branch_before_quantity)}
                                        → <span className="text-green-600">
                                            {formatQuantity(stockDetail.to_branch_after_quantity)}
                                        </span>)
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingIndex(index)}
                            className="h-9 w-9"
                        >
                            <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTransferItem(index)}
                            className="h-9 w-9"
                        >
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
            <div className="bg-white rounded-lg px-8 py-6">
                <div className="flex justify-between items-center mb-6">
                    <Heading
                        title="Create Stock Transfer"
                        description="Transfer stock items between branches."
                    />
                    <div className="flex gap-3">
                        <Link href={route('stock.transfer.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
                            <Card className="border-0 shadow-sm h-full">
                                <div className="p-6">
                                    <h2 className="text-base font-semibold text-gray-900 mb-4">Transfer Information</h2>
                                    <div className="space-y-4">
                                        <div className="py-2">
                                            <div className="pb-2 border-b border-gray-100">
                                                {data.code ? (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium px-3 py-1.5">
                                                            {data.code}
                                                            <span
                                                                className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium ml-2">
                                                                Generated
                                                            </span>
                                                        </span>
                                                        <input type="hidden" name="code" value={data.code} />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="inline-block w-2 h-2 bg-yellow-400 rounded-full"></span>
                                                        <span className="text-sm text-gray-600">
                                                            Loading transfer code...
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {errors.code && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.code}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="from_branch_id">From Branch <span
                                                className="text-red-500">*</span></Label>
                                            <Select
                                                value={data.from_branch_id}
                                                onValueChange={handleFromBranchChange}
                                            >
                                                <SelectTrigger
                                                    className={errors.from_branch_id ? "border-red-500" : ""}>
                                                    <SelectValue placeholder="Select source branch" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {branches.map((branch) => (
                                                        <SelectItem key={branch.id} value={branch.id.toString()}>
                                                            {branch.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.from_branch_id &&
                                                <p className="text-red-500 text-sm">{errors.from_branch_id}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="to_branch_id">To Branch <span
                                                className="text-red-500">*</span></Label>
                                            <Select
                                                value={data.to_branch_id}
                                                onValueChange={handleToBranchChange}
                                            >
                                                <SelectTrigger className={errors.to_branch_id ? "border-red-500" : ""}>
                                                    <SelectValue placeholder="Select destination branch" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {branches
                                                        .filter(branch => branch.id.toString() !== data.from_branch_id)
                                                        .map((branch) => (
                                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                                {branch.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.to_branch_id &&
                                                <p className="text-red-500 text-sm">{errors.to_branch_id}</p>}
                                        </div>

                                        <div className="space-y-2 relative grid gap-2">
                                            <Label htmlFor="date">
                                                Transfer Date <span className="text-red-500">*</span>
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="date"
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !data.date && "text-muted-foreground",
                                                            errors.date && "border-red-500 ring-red-100"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {data.date ? format(data.date, "PPP") :
                                                            <span>Select date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={data.date}
                                                        onSelect={(date) => date && setData('date', date)}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {errors.date && (
                                                <p className="text-xs text-red-500 mt-1">{errors.date}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="border-0 shadow-sm h-full">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-base font-semibold text-gray-900">Transfer Items</h2>
                                        <div className="flex items-center">
                                            <span className="text-sm text-gray-500 mr-2">
                                                {data.stock_transfer_details.length} items
                                            </span>
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
                                            <div
                                                className="flex items-center justify-center py-8 text-center text-gray-500">
                                                <p>No items added yet. Click the button below to add items to
                                                    transfer.</p>
                                            </div>
                                        )}

                                        {!addingItem && editingIndex === null && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addTransferItem}
                                                className="mt-2"
                                                disabled={!data.from_branch_id || items.length === 0}
                                            >
                                                <PlusCircle className="h-4 w-4 mr-2" />
                                                Add Item
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-6">
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => router.visit(route('stock.transfer.index'))}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || data.stock_transfer_details.length === 0 || !data.from_branch_id || !data.to_branch_id}
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
