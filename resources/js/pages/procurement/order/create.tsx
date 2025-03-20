import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, CheckCircle, Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Procurement',
        href: '#',
    },
    {
        title: 'Purchase Order',
        href: route('procurement.order.index'),
    },
    {
        title: 'Create',
        href: route('procurement.order.create'),
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

type Supplier = {
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
};

type TaxRate = {
    id: number;
    rate: number;
};

interface Props {
    suppliers?: Supplier[];
    taxRates?: TaxRate[];
}

export default function Create({ suppliers = [], taxRates = [] }: Props) {
    const { showErrorToast } = useToastNotification();
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItemNames, setSelectedItemNames] = useState<Record<number, string>>({});
    const [selectedItemUnits, setSelectedItemUnits] = useState<Record<number, string>>({});
    const [selectedItemPrices, setSelectedItemPrices] = useState<Record<number, number>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [addingItem, setAddingItem] = useState<boolean>(false);
    const [, setInitialized] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        date: new Date(),
        supplier_id: '',
        expected_delivery_date: new Date(),
        total_amount: 0,
        tax_rate_id: null,
        tax_amount: 0,
        grand_total: 0,
        purchase_order_details: [] as {
            item_id: number;
            quantity: number | string;
            unit_price: number;
            total_price: number;
        }[],
        new_item: {
            item_id: 0,
            quantity: '',
            unit_price: 0,
            total_price: 0,
        },
    });

    const formatCurrency = (value: number): string => {
        const rounded = Math.round(value * 100) / 100;

        const parts = rounded.toString().split('.');

        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        if (parts.length > 1 && parts[1] !== '00' && parseInt(parts[1]) !== 0) {
            return 'Rp ' + parts[0] + ',' + (parts[1].length === 1 ? parts[1] + '0' : parts[1]);
        }

        return 'Rp ' + parts[0];
    };

    const formatTaxRate = (value: number): string => {
        const rounded = Math.round(value * 100) / 100;

        const parts = rounded.toString().split('.');

        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        if (parts.length > 1 && parts[1] !== '00' && parseInt(parts[1]) !== 0) {
            return parts[0] + ',' + (parts[1].length === 1 ? parts[1] + '0' : parts[1]);
        }

        return parts[0];
    };

    useEffect(() => {
        const calculateTotals = () => {
            const totalAmount = data.purchase_order_details.reduce((sum, item) => sum + Number(item.total_price || 0), 0);

            let taxAmount = 0;
            if (data.tax_rate_id) {
                const selectedTaxRate = taxRates.find((tax) => tax.id.toString() === data.tax_rate_id);
                if (selectedTaxRate) {
                    taxAmount = totalAmount * (selectedTaxRate.rate / 100);
                }
            }

            const grandTotal = totalAmount + taxAmount;

            if (data.total_amount !== totalAmount || data.tax_amount !== taxAmount || data.grand_total !== grandTotal) {
                setData((prevData) => ({
                    ...prevData,
                    total_amount: totalAmount,
                    tax_amount: taxAmount,
                    grand_total: grandTotal,
                }));
            }
        };

        calculateTotals();
    }, [data.purchase_order_details, data.tax_rate_id, taxRates, setData]);

    const fetchPurchaseOrderCode = useCallback(() => {
        fetch(route('procurement.order.getCode'), {
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
                console.error('Error fetching purchase order code:', error);
                showErrorToast([`Failed to get purchase order code: ${error.message}`]);
            });
    }, [setData, showErrorToast]);

    useEffect(() => {
        fetchPurchaseOrderCode();
        setInitialized(true);
    }, []);

    const fetchItems = useCallback(() => {
        fetch(route('item.getItems'), {
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
            })
            .catch((error) => {
                console.error('Error fetching items:', error);
                showErrorToast([error.message]);
            });
    }, []);

    useEffect(() => {
        if (items.length === 0) {
            fetchItems();
        }
    }, [fetchItems, items.length]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post(route('procurement.order.store'), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    const addPurchaseOrderItem = () => {
        setAddingItem(true);
        setData('new_item', {
            item_id: 0,
            quantity: '',
            unit_price: 0,
            total_price: 0,
        });
    };

    const savePurchaseOrderItem = () => {
        if (editingIndex !== null) {
            setEditingIndex(null);
        } else {
            setAddingItem(false);
            if (data.new_item.item_id !== 0) {
                const newOrderItem = {
                    ...data.new_item,
                };

                setData('purchase_order_details', [...data.purchase_order_details, newOrderItem]);

                setData('new_item', {
                    item_id: 0,
                    quantity: '',
                    unit_price: 0,
                    total_price: 0,
                });
            } else {
                showErrorToast(['Please select an item']);
            }
        }
    };

    const removePurchaseOrderItem = (index: number) => {
        const updatedItems = [...data.purchase_order_details];

        const newSelectedItemNames = { ...selectedItemNames };
        const newSelectedItemUnits = { ...selectedItemUnits };
        const newSelectedItemPrices = { ...selectedItemPrices };

        delete newSelectedItemNames[index];
        delete newSelectedItemUnits[index];
        delete newSelectedItemPrices[index];

        updatedItems.splice(index, 1);
        setData('purchase_order_details', updatedItems);

        const updatedSelectedItemNames: Record<number, string> = {};
        const updatedSelectedItemUnits: Record<number, string> = {};
        const updatedSelectedItemPrices: Record<number, number> = {};

        Object.keys(newSelectedItemNames).forEach((key) => {
            const keyNum = parseInt(key, 10);
            if (keyNum > index) {
                updatedSelectedItemNames[keyNum - 1] = newSelectedItemNames[keyNum];
                updatedSelectedItemUnits[keyNum - 1] = newSelectedItemUnits[keyNum];
                updatedSelectedItemPrices[keyNum - 1] = newSelectedItemPrices[keyNum];
            } else {
                updatedSelectedItemNames[keyNum] = newSelectedItemNames[keyNum];
                updatedSelectedItemUnits[keyNum] = newSelectedItemUnits[keyNum];
                updatedSelectedItemPrices[keyNum] = newSelectedItemPrices[keyNum];
            }
        });

        setSelectedItemNames(updatedSelectedItemNames);
        setSelectedItemUnits(updatedSelectedItemUnits);
        setSelectedItemPrices(updatedSelectedItemPrices);
    };

    const updatePurchaseOrderItem = (index: number, field: 'item_id' | 'quantity' | 'unit_price', value: string | number) => {
        const updatedItems = [...data.purchase_order_details];

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

                const newSelectedItemPrices = { ...selectedItemPrices };
                setSelectedItemPrices(newSelectedItemPrices);

                updatedItems[index] = {
                    ...updatedItems[index],
                    item_id: itemId,
                    unit_price: '',
                    total_price: 0,
                };

                setData('purchase_order_details', updatedItems);
            }
        } else if (field === 'quantity') {
            let qty = value === '' ? '' : Number(value);

            if (typeof qty === 'number' && qty < 1) qty = 1;

            const unitPrice = updatedItems[index].unit_price || 0;
            const totalPrice = typeof qty === 'number' ? unitPrice * qty : 0;

            updatedItems[index] = {
                ...updatedItems[index],
                quantity: qty,
                total_price: totalPrice,
            };

            setData('purchase_order_details', updatedItems);
        } else if (field === 'unit_price') {
            const unitPrice = value === '' ? '' : Number(value);
            const quantity = Number(updatedItems[index].quantity || 0);
            const totalPrice = unitPrice === '' ? 0 : unitPrice * quantity;

            updatedItems[index] = {
                ...updatedItems[index],
                unit_price: unitPrice,
                total_price: totalPrice,
            };

            setData('purchase_order_details', updatedItems);
        }
    };

    const getAvailableItems = (currentIndex: number) => {
        return items.filter((item) => {
            return !data.purchase_order_details.some((orderItem, i) => i !== currentIndex && orderItem.item_id === item.id);
        });
    };

    const renderPurchaseOrderItemForm = (
        orderItem: {
            item_id: number;
            quantity: number | string;
            unit_price: number;
            total_price: number;
        } | null = null,
        index: number = -1,
        isAddingNew: boolean = false,
    ) => {
        const item = orderItem || data.new_item;
        const selectedItemId = isAddingNew ? data.new_item.item_id : item.item_id;

        return (
            <div className="mb-4 rounded-md border bg-gray-50 p-4">
                <div className="flex flex-wrap items-start gap-3">
                    <div className="relative grid min-w-[250px] flex-1 gap-2">
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
                                            quantity: data.new_item.quantity,
                                            unit_price: '',
                                            total_price: 0,
                                        };

                                        const newSelectedItemNames = { ...selectedItemNames };
                                        newSelectedItemNames[data.purchase_order_details.length] = `${selectedItem.name} (${selectedItem.code})`;
                                        setSelectedItemNames(newSelectedItemNames);

                                        const newSelectedItemUnits = { ...selectedItemUnits };
                                        newSelectedItemUnits[data.purchase_order_details.length] = selectedItem.item_unit?.abbreviation || '';
                                        setSelectedItemUnits(newSelectedItemUnits);

                                        const newSelectedItemPrices = { ...selectedItemPrices };
                                        setSelectedItemPrices(newSelectedItemPrices);

                                        setData('new_item', tempItem);
                                    }
                                } else {
                                    updatePurchaseOrderItem(index, 'item_id', value);
                                }
                            }}
                            options={getAvailableItems(isAddingNew ? -1 : index).map((itm) => ({
                                value: String(itm.id),
                                label: `${itm.name} (${itm.code})`,
                            }))}
                            placeholder="Select an item"
                            searchPlaceholder="Search items..."
                            initialDisplayCount={5}
                            className={
                                isAddingNew && errors[`new_item.item_id` as keyof typeof errors]
                                    ? 'border-red-500 ring-red-100'
                                    : !isAddingNew && errors[`purchase_order_details.${index}.item_id` as keyof typeof errors]
                                      ? 'border-red-500 ring-red-100'
                                      : ''
                            }
                        />
                    </div>
                    <div className="relative grid min-w-[150px] flex-1 gap-2">
                        <Label htmlFor={`quantity_${index}`}>
                            Quantity <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id={`quantity_${index}`}
                                type="number"
                                min="1"
                                value={item.quantity === '' ? '' : item.quantity}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    let qty = value === '' ? '' : Number(value);

                                    if (qty !== '' && typeof qty === 'number' && qty < 1) qty = 1;

                                    if (isAddingNew) {
                                        const unitPrice = data.new_item.unit_price || 0;
                                        const totalPrice = typeof qty === 'number' ? unitPrice * qty : 0;

                                        setData('new_item', {
                                            ...data.new_item,
                                            quantity: qty,
                                            total_price: totalPrice,
                                        });
                                    } else {
                                        updatePurchaseOrderItem(index, 'quantity', qty);
                                    }
                                }}
                                placeholder="Enter quantity"
                                className={`[appearance:textfield] pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                                    isAddingNew && errors[`new_item.quantity` as keyof typeof errors]
                                        ? 'border-red-500 ring-red-100'
                                        : !isAddingNew && errors[`purchase_order_details.${index}.quantity` as keyof typeof errors]
                                          ? 'border-red-500 ring-red-100'
                                          : ''
                                }`}
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                                {isAddingNew ? selectedItemUnits[data.purchase_order_details.length] || '' : selectedItemUnits[index] || ''}
                            </div>
                        </div>
                        {!isAddingNew && errors[`purchase_order_details.${index}.quantity` as keyof typeof errors] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`purchase_order_details.${index}.quantity` as keyof typeof errors]}</p>
                        )}
                    </div>
                    <div className="relative grid min-w-[150px] flex-1 gap-2">
                        <Label htmlFor={`unit_price_${index}`}>
                            Unit Price <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`unit_price_${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price === 0 || item.unit_price === '' ? '' : item.unit_price}
                            onChange={(e) => {
                                const value = e.target.value;
                                const unitPrice = value === '' ? '' : Number(value);

                                if (isAddingNew) {
                                    const quantity = Number(data.new_item.quantity || 0);
                                    const totalPrice = unitPrice === '' ? 0 : unitPrice * quantity;

                                    setData('new_item', {
                                        ...data.new_item,
                                        unit_price: unitPrice,
                                        total_price: totalPrice,
                                    });
                                } else {
                                    updatePurchaseOrderItem(index, 'unit_price', unitPrice);
                                }
                            }}
                            placeholder="Enter unit price"
                            className={`[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                                isAddingNew && errors[`new_item.unit_price` as keyof typeof errors]
                                    ? 'border-red-500 ring-red-100'
                                    : !isAddingNew && errors[`purchase_order_details.${index}.unit_price` as keyof typeof errors]
                                      ? 'border-red-500 ring-red-100'
                                      : ''
                            }`}
                        />
                        {!isAddingNew && errors[`purchase_order_details.${index}.unit_price` as keyof typeof errors] && (
                            <p className="mt-1 text-xs text-red-500">{errors[`purchase_order_details.${index}.unit_price` as keyof typeof errors]}</p>
                        )}
                    </div>
                    <div className="relative grid min-w-[150px] flex-1 gap-2">
                        <Label htmlFor={`total_price_${index}`}>Total Price</Label>
                        <Input id={`total_price_${index}`} type="number" value={Number(item.total_price || 0)} disabled className="bg-gray-100" />
                    </div>
                    <div className="flex-none self-end pb-[2px]">
                        <Button
                            type="button"
                            variant="default"
                            size="icon"
                            onClick={savePurchaseOrderItem}
                            className="h-9 w-9 bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="h-4 w-4 text-white" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPurchaseOrderItemList = (
        orderItem: {
            item_id: number;
            quantity: number | string;
            unit_price: number;
            total_price: number;
        },
        index: number,
    ) => {
        const selectedItem = items.find((itm) => itm.id === orderItem.item_id);
        const itemName = selectedItemNames[index] || (selectedItem ? `${selectedItem.name} (${selectedItem.code})` : 'Unknown Item');
        const itemUnit = selectedItemUnits[index] || selectedItem?.item_unit?.abbreviation || '';

        return (
            <div key={index} className="border-b border-gray-100 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <p className="font-medium text-gray-900">{itemName}</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-600">
                                Quantity: {orderItem.quantity} {itemUnit}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm text-gray-800">
                                Unit Price: {formatCurrency(Number(orderItem.unit_price))}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-800">
                                Total: {formatCurrency(Number(orderItem.total_price))}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="icon" onClick={() => setEditingIndex(index)} className="h-9 w-9">
                            <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePurchaseOrderItem(index)} className="h-9 w-9">
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Purchase Order" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Purchase Order" description="Create a new purchase order to request items from suppliers." />
                    <div className="flex gap-3">
                        <Link href={route('procurement.order.index')}>
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
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Purchase Order Information</h2>
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
                                                        <span className="text-sm text-gray-600">Loading purchase order code...</span>
                                                    </div>
                                                )}
                                            </div>
                                            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="supplier_id">
                                                Supplier <span className="text-red-500">*</span>
                                            </Label>
                                            <Combobox
                                                value={data.supplier_id ? data.supplier_id.toString() : ''}
                                                onValueChange={(value) => setData('supplier_id', value)}
                                                options={suppliers.map((supplier) => ({
                                                    value: supplier.id.toString(),
                                                    label: supplier.name,
                                                }))}
                                                placeholder="Select supplier"
                                                searchPlaceholder="Search suppliers..."
                                                initialDisplayCount={5}
                                                className={errors.supplier_id ? 'border-red-500' : ''}
                                            />
                                            {errors.supplier_id && <p className="text-sm text-red-500">{errors.supplier_id}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="date">
                                                Order Date <span className="text-red-500">*</span>
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
                                                        {data.date ? format(data.date, 'PPP') : <span>Select date</span>}
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
                                            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="expected_delivery_date">
                                                Expected Delivery Date <span className="text-red-500">*</span>
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="expected_delivery_date"
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal',
                                                            !data.expected_delivery_date && 'text-muted-foreground',
                                                            errors.expected_delivery_date && 'border-red-500 ring-red-100',
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {data.expected_delivery_date ? (
                                                            format(data.expected_delivery_date, 'PPP')
                                                        ) : (
                                                            <span>Select date</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={data.expected_delivery_date}
                                                        onSelect={(date) => date && setData('expected_delivery_date', date)}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {errors.expected_delivery_date && (
                                                <p className="mt-1 text-xs text-red-500">{errors.expected_delivery_date}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="tax_rate_id">Tax Rate</Label>
                                            <Select
                                                value={data.tax_rate_id === null || data.tax_rate_id === '' ? '0' : data.tax_rate_id}
                                                onValueChange={(value) => {
                                                    if (value === '0') {
                                                        setData('tax_rate_id', null);
                                                    } else {
                                                        setData('tax_rate_id', value);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className={errors.tax_rate_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select tax rate (optional)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">No Tax</SelectItem>
                                                    {taxRates.map((taxRate) => (
                                                        <SelectItem key={taxRate.id} value={taxRate.id.toString()}>
                                                            {formatTaxRate(taxRate.rate)}%
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.tax_rate_id && <p className="text-sm text-red-500">{errors.tax_rate_id}</p>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-gray-900">Order Items</h2>
                                        <div className="flex items-center">
                                            <span className="mr-2 text-sm text-gray-500">{data.purchase_order_details.length} items</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="max-h-[calc(70vh-260px)] overflow-y-auto pr-2 pl-1">
                                            {addingItem && renderPurchaseOrderItemForm(null, -1, true)}

                                            {data.purchase_order_details.map((orderItem, index) => (
                                                <div key={index}>
                                                    {editingIndex === index
                                                        ? renderPurchaseOrderItemForm(orderItem, index)
                                                        : renderPurchaseOrderItemList(orderItem, index)}
                                                </div>
                                            ))}
                                        </div>

                                        {data.purchase_order_details.length === 0 && !addingItem && (
                                            <div className="flex items-center justify-center py-8 text-center text-gray-500">
                                                <p>No items added yet. Click the button below to add items to order.</p>
                                            </div>
                                        )}

                                        {!addingItem && editingIndex === null && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addPurchaseOrderItem}
                                                className="mt-2"
                                                disabled={items.length === 0}
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add Item
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {data.purchase_order_details.length > 0 && (
                                    <div className="border-t p-6">
                                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Order Summary</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Subtotal</span>
                                                <span className="text-sm font-medium">{formatCurrency(data.total_amount)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Tax</span>
                                                <span className="text-sm font-medium">{formatCurrency(data.tax_amount)}</span>
                                            </div>
                                            <div className="mt-2 flex justify-between border-t pt-2">
                                                <span className="font-medium">Grand Total</span>
                                                <span className="font-bold text-gray-900">{formatCurrency(data.grand_total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>

                    <div className="sticky bottom-0 mt-6 border-t bg-white pt-4 pb-2">
                        <div className="flex items-center justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => router.visit(route('procurement.order.index'))}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || data.purchase_order_details.length === 0 || !data.supplier_id}
                                className="px-8"
                            >
                                {processing ? 'Processing...' : 'Create Order'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
