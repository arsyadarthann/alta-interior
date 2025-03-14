import React, { useState, useEffect } from 'react';
import { Head, router, useForm, Link } from "@inertiajs/react";
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
        title: 'Audit',
        href: route('stock.audit.index'),
    },
    {
        title: 'Edit',
        href: '#'
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

type StockAudit = {
    id: number;
    code: string;
    date: string;
    branch_id: number;
    stock_audit_details: {
        id: number;
        stock_audit_id: number;
        item_id: number;
        system_quantity: number;
        physical_quantity: number;
        discrepancy_quantity: number;
        reason: string;
    }[];
}

type StockAuditDetail = {
    id: number | null;
    item_id: number;
    system_quantity: number;
    physical_quantity: number;
    discrepancy_quantity: number;
    reason: string;
}

type NewItem = {
    item_id: number;
    system_quantity: number;
    physical_quantity: number;
    discrepancy_quantity: number;
    reason: string;
}

type FormData = {
    code: string;
    date: string | Date;
    branch_id: number;
    stock_audit_details: StockAuditDetail[];
    new_item: NewItem;
}

export default function EditStockAudit({ stockAudit, branches = [] }: { stockAudit: StockAudit, branches?: Branch[] }) {
    const { showErrorToast } = useToastNotification();
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItemNames, setSelectedItemNames] = useState<Record<number, string>>({});
    const [selectedItemUnits, setSelectedItemUnits] = useState<Record<number, string>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [addingItem, setAddingItem] = useState<boolean>(false);
    const [deletedDetails, setDeletedDetails] = useState<number[]>([]);

    const { data, setData, put, processing, errors } = useForm<FormData>({
        code: stockAudit.code,
        date: stockAudit.date,  // Send as string directly
        branch_id: stockAudit.branch_id,  // Send as number directly
        stock_audit_details: stockAudit.stock_audit_details.map(detail => ({
            id: detail.id,
            item_id: detail.item_id,
            system_quantity: detail.system_quantity,
            physical_quantity: detail.physical_quantity,
            discrepancy_quantity: detail.discrepancy_quantity,
            reason: detail.reason || ''
        })),
        new_item: {
            item_id: 0,
            system_quantity: 0,
            physical_quantity: 0,
            discrepancy_quantity: 0,
            reason: ''
        }
    });

    useEffect(() => {
        if (data.branch_id) {
            fetch(route('item.getItemByBranch', data.branch_id), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(responseData => {
                    let itemsData: Item[] = [];

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

                    // Initialize the selectedItemNames and selectedItemUnits for existing audit details
                    const initialItemNames: Record<number, string> = {};
                    const initialItemUnits: Record<number, string> = {};
                    data.stock_audit_details.forEach((detail, index) => {
                        const item = itemsData.find(itm => itm.id === detail.item_id);
                        if (item) {
                            initialItemNames[index] = `${item.name} (${item.code})`;
                            initialItemUnits[index] = item.item_unit?.abbreviation || '';
                        }
                    });
                    setSelectedItemNames(initialItemNames);
                    setSelectedItemUnits(initialItemUnits);
                })
                .catch(error => {
                    showErrorToast(error.message);
                });
        } else {
            setItems([]);
        }
    }, [data.branch_id]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Format the date properly if it's a Date object
        const formattedData = {
            ...data,
            date: data.date instanceof Date ? format(data.date, 'yyyy-MM-dd') : data.date,
            branch_id: Number(data.branch_id),
            stock_audit_details: data.stock_audit_details.map(detail => ({
                id: detail.id || null,
                item_id: Number(detail.item_id),
                system_quantity: Number(detail.system_quantity),
                physical_quantity: Number(detail.physical_quantity),
                discrepancy_quantity: Number(detail.discrepancy_quantity),
                reason: detail.reason || ''
            }))
        };

        put(route('stock.audit.update', stockAudit.id), {
            ...formattedData,
            preserveScroll: true,
            onError: (errors: Record<string, string>) => showErrorToast([JSON.stringify(errors)])
        });
    };

    const addAuditItem = () => {
        setAddingItem(true);
        setData('new_item', {
            item_id: 0,
            system_quantity: 0,
            physical_quantity: 0,
            discrepancy_quantity: 0,
            reason: ''
        });
    };

    const saveAuditItem = () => {
        if (editingIndex !== null) {
            setEditingIndex(null);
        } else {
            setAddingItem(false);
            if (data.new_item.item_id !== 0) {
                const selectedItem = items.find(item => item.id === data.new_item.item_id);

                setData('stock_audit_details', [
                    ...data.stock_audit_details,
                    {
                        id: null, // New items have null ID
                        ...data.new_item
                    }
                ]);

                // Store the unit abbreviation for the new item
                if (selectedItem && selectedItem.item_unit) {
                    const newIndex = data.stock_audit_details.length;
                    setSelectedItemUnits({
                        ...selectedItemUnits,
                        [newIndex]: selectedItem.item_unit.abbreviation
                    });
                }

                setData('new_item', {
                    item_id: 0,
                    system_quantity: 0,
                    physical_quantity: 0,
                    discrepancy_quantity: 0,
                    reason: ''
                });
            } else {
                showErrorToast(["Please select an item"]);
            }
        }
    };

    const removeAuditItem = (index: number) => {
        const updatedItems = [...data.stock_audit_details];
        const removedItem = updatedItems[index];

        // If the item has an ID, add it to deletedDetails array
        if (removedItem.id) {
            setDeletedDetails([...deletedDetails, removedItem.id]);
        }

        const newSelectedItemNames = { ...selectedItemNames };
        delete newSelectedItemNames[index];

        updatedItems.splice(index, 1);
        setData('stock_audit_details', updatedItems);

        const updatedSelectedItemNames: Record<number, string> = {};
        Object.keys(newSelectedItemNames).forEach(key => {
            const keyNum = parseInt(key, 10);
            if (keyNum > index) {
                updatedSelectedItemNames[keyNum - 1] = newSelectedItemNames[keyNum];
            } else {
                updatedSelectedItemNames[keyNum] = newSelectedItemNames[keyNum];
            }
        });

        setSelectedItemNames(updatedSelectedItemNames);
    };

    const updateAuditItem = (
        index: number,
        field: 'item_id' | 'system_quantity' | 'physical_quantity' | 'discrepancy_quantity' | 'reason',
        value: string | number
    ) => {
        const updatedItems = [...data.stock_audit_details];

        if (field === 'item_id') {
            const itemId = Number(value);
            const selectedItem = items.find((itm) => itm.id === itemId);

            if (selectedItem) {
                const newSelectedItemNames = {...selectedItemNames};
                newSelectedItemNames[index] = `${selectedItem.name} (${selectedItem.code})`;
                setSelectedItemNames(newSelectedItemNames);

                // Store unit abbreviation when selecting an item
                const newSelectedItemUnits = {...selectedItemUnits};
                newSelectedItemUnits[index] = selectedItem.item_unit?.abbreviation || '';
                setSelectedItemUnits(newSelectedItemUnits);

                const itemStock = selectedItem.stock ?? 0;
                updatedItems[index] = {
                    ...updatedItems[index],
                    item_id: itemId,
                    system_quantity: itemStock,
                    physical_quantity: 0,
                    discrepancy_quantity: 0 - itemStock
                };
            }
        } else if (field === 'physical_quantity') {
            let physicalQty = Number(value);
            if (physicalQty < 0) {
                physicalQty = 0;
            }

            const systemQty = updatedItems[index].system_quantity;
            updatedItems[index] = {
                ...updatedItems[index],
                physical_quantity: physicalQty,
                discrepancy_quantity: physicalQty - systemQty
            };
        } else if (field === 'system_quantity') {
            let systemQty = Number(value);
            if (systemQty < 0) {
                systemQty = 0;
            }

            const physicalQty = updatedItems[index].physical_quantity;
            updatedItems[index] = {
                ...updatedItems[index],
                system_quantity: systemQty,
                discrepancy_quantity: physicalQty - systemQty
            };
        } else {
            updatedItems[index] = {
                ...updatedItems[index],
                [field]: field === 'reason' ? String(value) : Number(value)
            };
        }

        setData('stock_audit_details', updatedItems);
    };

    const getAvailableItems = (currentIndex: number) => {
        return items.filter(item => {
            return !data.stock_audit_details.some(
                (auditItem, i) => i !== currentIndex && auditItem.item_id === item.id
            );
        });
    };

    const renderAuditItemForm = (
        auditItem: StockAuditDetail | null = null,
        index: number = -1,
        isAddingNew: boolean = false
    ) => {
        const item = auditItem || data.new_item;
        const selectedItemId = isAddingNew ? data.new_item.item_id : item.item_id;

        // Get the unit abbreviation for the current item
        let unitAbbreviation = '';
        if (isAddingNew && selectedItemId) {
            const selectedItem = items.find(itm => itm.id === selectedItemId);
            unitAbbreviation = selectedItem?.item_unit?.abbreviation || '';
        } else if (!isAddingNew) {
            unitAbbreviation = selectedItemUnits[index] || '';
        }

        return (
            <div className="flex flex-wrap items-end gap-3 border bg-gray-50 rounded-md p-4 mb-4">
                <div className="flex-1 min-w-[200px] relative grid gap-2">
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
                                        system_quantity: selectedItem.stock ?? 0,
                                        physical_quantity: 0,
                                        discrepancy_quantity: -(selectedItem.stock ?? 0),
                                        reason: ''
                                    };

                                    const newSelectedItemNames = { ...selectedItemNames };
                                    newSelectedItemNames[data.stock_audit_details.length] =
                                        `${selectedItem.name} (${selectedItem.code})`;
                                    setSelectedItemNames(newSelectedItemNames);

                                    setData('new_item', tempItem);
                                }
                            } else {
                                updateAuditItem(index, 'item_id', value);
                            }
                        }}
                    >
                        <SelectTrigger
                            id={`item_id_${index}`}
                            className={`w-full`}
                        >
                            <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                        <SelectContent>
                            {getAvailableItems(isAddingNew ? -1 : index).map((itm) => (
                                <SelectItem key={itm.id} value={String(itm.id)}>
                                    {itm.name} ({itm.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1 min-w-[140px] relative grid gap-2">
                    <Label htmlFor={`system_quantity_${index}`}>
                        System Quantity
                    </Label>
                    <Input
                        id={`system_quantity_${index}`}
                        type="number"
                        value={item.system_quantity === 0 ? 0 :
                            item.system_quantity % 1 === 0 ?
                                Math.round(item.system_quantity) :
                                item.system_quantity.toFixed(2)
                        }
                        readOnly
                        className="bg-gray-50"
                    />
                    <div className="absolute inset-y-10 right-0 flex items-center px-3 pointer-events-none text-gray-500 text-sm">
                        {unitAbbreviation}
                    </div>
                </div>
                <div className="flex-1 min-w-[140px] relative grid gap-2">
                    <Label htmlFor={`physical_quantity_${index}`}>
                        Physical Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`physical_quantity_${index}`}
                        type="number"
                        min="0"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={item.physical_quantity === 0 ? "" : Math.abs(Number(item.physical_quantity !== null && item.physical_quantity !== undefined ?
                            Number(item.physical_quantity).toFixed(2) : 0))}
                        onChange={(e) => {
                            if (isAddingNew) {
                                const physicalQty = Number(e.target.value);
                                const systemQty = data.new_item?.system_quantity || 0;
                                setData('new_item', {
                                    ...data.new_item,
                                    physical_quantity: physicalQty,
                                    discrepancy_quantity: physicalQty - systemQty
                                });
                            } else {
                                updateAuditItem(index, 'physical_quantity', e.target.value);
                            }
                        }}
                        placeholder="Count result"
                    />
                    <div className="absolute inset-y-10 right-0 flex items-center px-3 pointer-events-none text-gray-500 text-sm">
                        {unitAbbreviation}
                    </div>
                    {!isAddingNew && errors[`stock_audit_details.${index}.physical_quantity` as keyof typeof errors] && (
                        <p className="text-xs text-red-500 mt-1">
                            {errors[`stock_audit_details.${index}.physical_quantity` as keyof typeof errors]}
                        </p>
                    )}
                </div>
                <div className="flex-1 min-w-[140px] relative grid gap-2">
                    <Label htmlFor={`discrepancy_quantity_${index}`}>
                        Discrepancy
                    </Label>
                    <Input
                        id={`discrepancy_quantity_${index}`}
                        type="number"
                        value={
                            item.discrepancy_quantity === 0 ? 0 :
                                Math.abs(Number(item.discrepancy_quantity !== null && item.discrepancy_quantity !== undefined ?
                                    Number(item.discrepancy_quantity).toFixed(2) : 0))
                        }
                        readOnly
                        className={`bg-gray-50 ${
                            item.discrepancy_quantity < 0
                                ? 'text-red-600'
                                : item.discrepancy_quantity > 0
                                    ? 'text-green-600'
                                    : ''
                        }`}
                    />
                    <div className="absolute inset-y-10 right-0 flex items-center px-3 pointer-events-none text-gray-500 text-sm">
                        {unitAbbreviation}
                    </div>
                </div>
                <div className="flex-1 min-w-[200px] relative grid gap-2">
                    <Label htmlFor={`reason_${index}`}>
                        Reason
                    </Label>
                    <Input
                        id={`reason_${index}`}
                        type="text"
                        value={item.reason}
                        onChange={(e) => {
                            if (isAddingNew) {
                                setData('new_item', {
                                    ...data.new_item,
                                    reason: e.target.value
                                });
                            } else {
                                updateAuditItem(index, 'reason', e.target.value);
                            }
                        }}
                        placeholder="Explain discrepancy"
                    />
                </div>
                <div className="flex items-end gap-2 pb-[2px]">
                    <Button
                        type="button"
                        variant="default"
                        size="icon"
                        onClick={saveAuditItem}
                        className="h-9 w-9 bg-green-600 hover:bg-green-700"
                    >
                        <CheckCircle className="h-4 w-4 text-white" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderAuditItemList = (auditItem: StockAuditDetail, index: number) => {
        const selectedItem = items.find((itm) => itm.id === auditItem.item_id);
        const itemName = selectedItemNames[index] ||
            (selectedItem ? `${selectedItem.name} (${selectedItem.code})` : "Unknown Item");
        const unitAbbreviation = selectedItemUnits[index] || '';

        return (
            <div key={index} className="flex justify-between items-center border-b border-gray-100 py-3">
                <div className="flex-1">
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        <p className="font-medium text-gray-900">
                            {itemName}
                        </p>
                        <span>System: {auditItem.system_quantity === 0 ? 0 :
                            auditItem.system_quantity % 1 === 0 ?
                                Math.round(auditItem.system_quantity) :
                                auditItem.system_quantity.toFixed(2)
                        } {unitAbbreviation}</span>
                        <span>Physical: {auditItem.physical_quantity === 0 ? 0 :
                            auditItem.physical_quantity % 1 === 0 ?
                                Math.round(auditItem.physical_quantity) :
                                auditItem.physical_quantity.toFixed(2)
                        } {unitAbbreviation}</span>
                        <span
                            className={`${
                                auditItem.discrepancy_quantity < 0
                                    ? 'text-red-600'
                                    : auditItem.discrepancy_quantity > 0
                                        ? 'text-green-600'
                                        : ''
                            }`}
                        >
                        Discrepancy: {auditItem.discrepancy_quantity < 0 ? '-' : '+'}
                            {Math.abs(auditItem.discrepancy_quantity)} {unitAbbreviation}
                    </span>
                        {auditItem.reason && <span>Reason: {auditItem.reason}</span>}
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
                        onClick={() => removeAuditItem(index)}
                        className="h-9 w-9"
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Stock Audit" />
            <div className="bg-white rounded-lg px-8 py-6">
                <div className="flex justify-between items-center mb-6">
                    <Heading
                        title="Edit Stock Audit"
                        description="Modify existing stock audit details."
                    />
                    <div className="flex gap-3">
                        <Link href={route('stock.audit.index')}>
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
                                    <h2 className="text-base font-semibold text-gray-900 mb-4">Audit Information</h2>
                                    <div className="space-y-4">
                                        <div className="py-2">
                                            <div className="pb-2 border-b border-gray-100">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium px-3 py-1.5">
                                                        {data.code}
                                                    </span>
                                                </div>
                                            </div>
                                            {errors.code && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors.code}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2 relative grid gap-2">
                                            <Label htmlFor="branch_id">
                                                Branch <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={String(data.branch_id)}
                                                onValueChange={(value) => setData('branch_id', Number(value))}
                                            >
                                                <SelectTrigger
                                                    id="branch_id"
                                                    className={`${
                                                        errors.branch_id ? "border-red-500 ring-red-100" : ""
                                                    }`}
                                                >
                                                    <SelectValue placeholder="Select branch" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {branches.map((branch) => (
                                                        <SelectItem key={branch.id} value={String(branch.id)}>
                                                            {branch.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.branch_id && (
                                                <p className="text-xs text-red-500 mt-1">{errors.branch_id}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2 relative grid gap-2">
                                            <Label htmlFor="date">
                                                Audit Date <span className="text-red-500">*</span>
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="date"
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !data.date && "text-muted-foreground",
                                                            errors.date ? "border-red-500 ring-red-100" : ""
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {data.date instanceof Date ? format(data.date, "PPP") :
                                                            data.date ? format(new Date(data.date), "PPP") :
                                                                <span>Select date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={data.date instanceof Date ?
                                                            data.date :
                                                            data.date ? new Date(data.date) : undefined}
                                                        onSelect={(date) => date && setData('date', format(date, 'yyyy-MM-dd'))}
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
                                        <h2 className="text-base font-semibold text-gray-900">Audit Items</h2>
                                        <div className="flex items-center">
                                            <span className="text-sm text-gray-500 mr-2">
                                                {data.stock_audit_details.length} items
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="max-h-[calc(70vh-260px)] overflow-y-auto pr-2 pl-1">
                                            {addingItem && renderAuditItemForm(null, -1, true)}

                                            {data.stock_audit_details.map((auditItem, index) => (
                                                <div key={index}>
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
                                                disabled={!data.branch_id || items.length === 0}
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

                    <div className="flex justify-end gap-3 py-4 mt-6">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => router.visit(route('stock.audit.index'))}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || data.stock_audit_details.length === 0}
                            className="px-8"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
