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
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Procurement',
        href: '#',
    },
    {
        title: 'Goods Receipt',
        href: route('procurement.receipt.index'),
    },
    {
        title: 'Create',
        href: route('procurement.receipt.create'),
    },
];

type Supplier = {
    id: number;
    name: string;
};

// Type definition that matches the exact structure from the API
type UnreceivedPurchaseOrderDetail = {
    purchase_order_detail_id: number;
    purchase_order_id: number;
    purchase_order_code: string;
    item_id: number;
    item_name: string;
    item_code: string;
    item_abbreviation: string;
    ordered_quantity: string | number;
    received_quantity: string | number;
    remaining_quantity: string | number;
};

// For grouped purchase orders
type GroupedPurchaseOrder = {
    id: number;
    code: string;
    details: UnreceivedPurchaseOrderDetail[];
};

interface Props {
    suppliers?: Supplier[];
}

export default function Create({ suppliers = [] }: Props) {
    const { showErrorToast } = useToastNotification();
    const [loading, setLoading] = useState(false);
    const [, setUnreceivedDetails] = useState<UnreceivedPurchaseOrderDetail[]>([]);
    const [groupedPurchaseOrders, setGroupedPurchaseOrders] = useState<GroupedPurchaseOrder[]>([]);
    const [selectedPO, setSelectedPO] = useState<string>('');
    const [receiptQuantities, setReceiptQuantities] = useState<Record<number, string>>({});
    const [receiptPrices, setReceiptPrices] = useState<Record<number, string>>({});
    const [receiptTotals, setReceiptTotals] = useState<Record<number, string>>({});

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        date: new Date(),
        supplier_id: '',
        received_by: '',
        goods_receipt_purchase_order: [] as {
            purchase_order_id: number;
            purchase_order_code: string;
            goods_receipt_details: {
                purchase_order_detail_id: number;
                item_name: string;
                item_code: string;
                ordered_quantity: number;
                remaining_quantity: number;
                received_quantity: number;
                price_per_unit: number;
                total_price: number;
                item_unit: string;
            }[];
        }[],
    });

    // Format number with optional decimals
    const formatDecimal = (value: string | number): string => {
        if (value === null || value === undefined) return '0';

        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numValue)) return '0';

        // Check if the value is a whole number
        if (Number.isInteger(numValue)) {
            return numValue.toString();
        }

        // Otherwise, display with up to 2 decimal places
        return numValue.toFixed(2).replace(/\.?0+$/, '');
    };

    const calculateTotal = (quantity: string, price: string) => {
        const qty = parseFloat(quantity || '0');
        const prc = parseFloat(price || '0');

        if (isNaN(qty) || isNaN(prc)) return '0';

        return (qty * prc).toString();
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Filter out details with zero received quantity before submission
        const filteredPOs = data.goods_receipt_purchase_order
            .map((po) => ({
                ...po,
                goods_receipt_details: po.goods_receipt_details.filter((detail) => detail.received_quantity > 0),
            }))
            .filter((po) => po.goods_receipt_details.length > 0);

        // Create a new form data object with the filtered POs
        const submitData = {
            ...data,
            goods_receipt_purchase_order: filteredPOs,
        };

        post(route('procurement.receipt.store', submitData), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    const fetchUnreceivedPurchaseOrders = useCallback(
        async (supplierId: string) => {
            if (!supplierId) return;

            setLoading(true);
            try {
                const response = await fetch(
                    route('procurement.receipt.getUnreceivedPurchaseOrderDetails', {
                        supplier_id: supplierId,
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
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const responseData = await response.json();
                let data = responseData;

                // Handle case where data might be wrapped in a data property
                if (responseData && responseData.data && Array.isArray(responseData.data)) {
                    data = responseData.data;
                }

                if (Array.isArray(data)) {
                    // Store the original unreceived details
                    setUnreceivedDetails(data);

                    // Group items by purchase order
                    const groupedByPO: Record<number, GroupedPurchaseOrder> = {};

                    data.forEach((item: UnreceivedPurchaseOrderDetail) => {
                        const poId = item.purchase_order_id;

                        if (!groupedByPO[poId]) {
                            groupedByPO[poId] = {
                                id: poId,
                                code: item.purchase_order_code,
                                details: [],
                            };
                        }

                        groupedByPO[poId].details.push(item);
                    });

                    // Convert to array
                    const purchaseOrders = Object.values(groupedByPO);
                    setGroupedPurchaseOrders(purchaseOrders);

                    // Reset the selection state
                    setSelectedPO('');
                    setReceiptQuantities({});
                    setReceiptPrices({});
                    setReceiptTotals({});

                    // Reset the goods receipt purchase orders
                    setData('goods_receipt_purchase_order', []);
                } else {
                    console.error('Unexpected response format:', data);
                    showErrorToast(['Invalid response format']);
                }
            } catch (error) {
                console.error('Error fetching unreceived purchase orders:', error);
                showErrorToast([(error as Error).message]);
            } finally {
                setLoading(false);
            }
        },
        [setData, showErrorToast],
    );

    const handleSupplierChange = (supplierId: string) => {
        setData('supplier_id', supplierId);
        fetchUnreceivedPurchaseOrders(supplierId);
    };

    const handleSelectedPOChange = (poId: string) => {
        setSelectedPO(poId);

        // Initialize empty receipt quantities and prices for this PO's items
        if (poId) {
            const po = groupedPurchaseOrders.find((p) => p.id.toString() === poId);
            if (po) {
                const newQuantities = { ...receiptQuantities };
                const newPrices = { ...receiptPrices };
                const newTotals = { ...receiptTotals };

                po.details.forEach((detail) => {
                    // Initialize with empty strings (not pre-filled)
                    newQuantities[detail.purchase_order_detail_id] = '';
                    newPrices[detail.purchase_order_detail_id] = '';
                    newTotals[detail.purchase_order_detail_id] = '';
                });

                setReceiptQuantities(newQuantities);
                setReceiptPrices(newPrices);
                setReceiptTotals(newTotals);
            }
        }
    };

    const handleReceiptQuantityChange = (poDetailId: number, value: string, maxQuantity: number) => {
        // Allow empty string for blank input
        if (value === '') {
            setReceiptQuantities({
                ...receiptQuantities,
                [poDetailId]: value,
            });
            // Update total when quantity changes
            const updatedTotal = calculateTotal(value, receiptPrices[poDetailId] || '0');
            setReceiptTotals({
                ...receiptTotals,
                [poDetailId]: updatedTotal,
            });
            return;
        }

        // Otherwise validate as number
        let quantity = Number(value);
        if (isNaN(quantity) || quantity < 0) return;

        // Enforce maximum quantity (remaining quantity)
        if (quantity > maxQuantity) {
            quantity = maxQuantity;
            value = quantity.toString();
        }

        // Update the receipt quantities
        setReceiptQuantities({
            ...receiptQuantities,
            [poDetailId]: value,
        });

        // Update total when quantity changes
        const updatedTotal = calculateTotal(value, receiptPrices[poDetailId] || '0');
        setReceiptTotals({
            ...receiptTotals,
            [poDetailId]: updatedTotal,
        });
    };

    const handleReceiptPriceChange = (poDetailId: number, value: string) => {
        // Allow empty string for blank input
        if (value === '') {
            setReceiptPrices({
                ...receiptPrices,
                [poDetailId]: value,
            });
            // Update total when price changes
            const updatedTotal = calculateTotal(receiptQuantities[poDetailId] || '0', value);
            setReceiptTotals({
                ...receiptTotals,
                [poDetailId]: updatedTotal,
            });
            return;
        }

        // Otherwise validate as number
        const price = Number(value);
        if (isNaN(price) || price < 0) return;

        // Update the receipt prices
        setReceiptPrices({
            ...receiptPrices,
            [poDetailId]: value,
        });

        // Update total when price changes
        const updatedTotal = calculateTotal(receiptQuantities[poDetailId] || '0', value);
        setReceiptTotals({
            ...receiptTotals,
            [poDetailId]: updatedTotal,
        });
    };

    const addItemToReceipt = (detail: UnreceivedPurchaseOrderDetail) => {
        const poId = detail.purchase_order_id;
        const poDetailId = detail.purchase_order_detail_id;
        const quantityStr = receiptQuantities[poDetailId] || '';
        const priceStr = receiptPrices[poDetailId] || '';

        // Skip if quantity is empty or 0
        if (quantityStr === '' || Number(quantityStr) <= 0) {
            showErrorToast(['Please enter a valid quantity']);
            return;
        }

        // Skip if price is empty or 0
        if (priceStr === '' || Number(priceStr) <= 0) {
            showErrorToast(['Please enter a valid price']);
            return;
        }

        const quantity = Number(quantityStr);
        const price = Number(priceStr);
        const total = quantity * price;

        // Make a deep copy of the current POs
        const updatedPOs = [...data.goods_receipt_purchase_order];

        // Check if we already have this PO in our form
        let poIndex = updatedPOs.findIndex((po) => po.purchase_order_id === poId);

        // If not, add it
        if (poIndex === -1) {
            // Create the new PO object with empty details array
            const newPO = {
                purchase_order_id: poId,
                purchase_order_code: detail.purchase_order_code,
                goods_receipt_details: [],
            };

            // Add it to our array
            updatedPOs.push(newPO);
            poIndex = updatedPOs.length - 1;
        }

        // Now we can safely access the PO
        const updatedPO = updatedPOs[poIndex];

        // Create the new detail
        const newDetail = {
            purchase_order_detail_id: poDetailId,
            item_name: `${detail.item_name} (${detail.item_code})`,
            item_code: detail.item_code,
            ordered_quantity: Number(detail.ordered_quantity),
            remaining_quantity: Number(detail.remaining_quantity),
            received_quantity: Math.min(quantity, Number(detail.remaining_quantity)),
            price_per_unit: price,
            total_price: total,
            item_unit: detail.item_abbreviation,
        };

        // Check if this detail already exists
        const detailIndex = updatedPO.goods_receipt_details.findIndex((d) => d.purchase_order_detail_id === poDetailId);

        if (detailIndex !== -1) {
            // Update existing detail
            updatedPO.goods_receipt_details[detailIndex] = {
                ...updatedPO.goods_receipt_details[detailIndex],
                received_quantity: Math.min(quantity, Number(detail.remaining_quantity)),
                price_per_unit: price,
                total_price: total,
            };
        } else {
            // Add new detail
            updatedPO.goods_receipt_details.push(newDetail);
        }

        // Update the state with all changes at once
        setData('goods_receipt_purchase_order', updatedPOs);

        // Force a re-render by updating the selected PO
        setSelectedPO(selectedPO);
    };

    const removeItemFromReceipt = (poDetailId: number) => {
        // Create a copy of the current receipt data
        const updatedPOs = data.goods_receipt_purchase_order
            .map((po) => ({
                ...po,
                goods_receipt_details: po.goods_receipt_details.filter((detail) => detail.purchase_order_detail_id !== poDetailId),
            }))
            .filter((po) => po.goods_receipt_details.length > 0);

        setData('goods_receipt_purchase_order', updatedPOs);
    };

    // Get the currently selected purchase order with filtered items
    const isItemInReceipt = (poDetailId: number): boolean => {
        return data.goods_receipt_purchase_order.some((po) =>
            po.goods_receipt_details.some((detail) => detail.purchase_order_detail_id === poDetailId),
        );
    };

    // Get the currently selected purchase order with filtered items
    const getCurrentPOWithFilteredItems = () => {
        if (!selectedPO) return null;

        const po = groupedPurchaseOrders.find((p) => p.id.toString() === selectedPO);
        if (!po) return null;

        // Create a copy with filtered details
        return {
            ...po,
            details: po.details.filter((detail) => !isItemInReceipt(detail.purchase_order_detail_id)),
        };
    };

    // Get the currently selected purchase order with filtered items
    const filteredCurrentPO = getCurrentPOWithFilteredItems();

    // Get items that are in the receipt already
    const getReceiptItems = () => {
        // Flatten all goods receipt details across all POs
        return data.goods_receipt_purchase_order.flatMap((po) =>
            po.goods_receipt_details.map((detail) => ({
                ...detail,
                purchase_order_code: po.purchase_order_code,
            })),
        );
    };

    // Format currency for display
    const formatCurrency = (value: number | string): string => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return 'Rp 0';

        const rounded = Math.round(numValue * 100) / 100;
        const parts = rounded.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        if (parts.length > 1 && parts[1] !== '00' && parseInt(parts[1]) !== 0) {
            return 'Rp ' + parts[0] + ',' + (parts[1].length === 1 ? parts[1] + '0' : parts[1]);
        }

        return 'Rp ' + parts[0];
    };

    // Calculate if the form can be submitted
    const hasItemsToReceive = data.goods_receipt_purchase_order.some((po) => po.goods_receipt_details.some((detail) => detail.received_quantity > 0));

    const canSubmit = data.code && data.supplier_id && data.received_by && hasItemsToReceive;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Goods Receipt" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Goods Receipt" description="Record received items from purchase orders." />
                    <div className="flex gap-3">
                        <Link href={route('procurement.receipt.index')}>
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
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Goods Receipt Information</h2>
                                    <div className="space-y-4">
                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="code">
                                                Receipt Code <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="code"
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value)}
                                                placeholder="Enter receipt code from supplier"
                                                className={errors.code ? 'border-red-500 ring-red-100' : ''}
                                            />
                                            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="supplier_id">
                                                Supplier <span className="text-red-500">*</span>
                                            </Label>
                                            <Combobox
                                                value={data.supplier_id ? data.supplier_id.toString() : ''}
                                                onValueChange={handleSupplierChange}
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
                                                Receipt Date <span className="text-red-500">*</span>
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
                                            <Label htmlFor="received_by">
                                                Received By <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="received_by"
                                                value={data.received_by}
                                                onChange={(e) => setData('received_by', e.target.value)}
                                                placeholder="Enter name of receiver"
                                                className={errors.received_by ? 'border-red-500 ring-red-100' : ''}
                                            />
                                            {errors.received_by && <p className="mt-1 text-xs text-red-500">{errors.received_by}</p>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    <div className="mb-4">
                                        <h2 className="text-base font-semibold text-gray-900">Items Selection</h2>
                                        <p className="text-sm text-gray-500">Select items to include in this receipt</p>
                                    </div>

                                    {/* Item Selection Section */}
                                    {data.supplier_id && (
                                        <div className="mb-6 space-y-4">
                                            {loading ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                                    <span className="ml-2 text-gray-500">Loading purchase orders...</span>
                                                </div>
                                            ) : groupedPurchaseOrders.length === 0 ? (
                                                <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center text-gray-500">
                                                    No pending purchase orders found for this supplier.
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Purchase Order Selection Dropdown */}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="purchase_order">Purchase Order</Label>
                                                        <Combobox
                                                            value={selectedPO ? selectedPO.toString() : ''}
                                                            onValueChange={handleSelectedPOChange}
                                                            options={groupedPurchaseOrders.map((po) => ({
                                                                value: po.id.toString(),
                                                                label: `${po.code} (${po.details.length} items)`,
                                                            }))}
                                                            placeholder="Select purchase order"
                                                            searchPlaceholder="Search purchase orders..."
                                                            initialDisplayCount={5}
                                                        />
                                                    </div>

                                                    {/* Items from Selected PO */}
                                                    {filteredCurrentPO && (
                                                        <div className="rounded-md border p-4">
                                                            <h3 className="mb-2 font-medium">Items from PO: {filteredCurrentPO.code}</h3>

                                                            <div className="max-h-[300px] overflow-y-auto">
                                                                <table className="w-full border-collapse text-sm">
                                                                    <thead>
                                                                        <tr className="border-b">
                                                                            <th className="px-2 py-2 text-left">Item</th>
                                                                            <th className="px-2 py-2 text-center">Ordered</th>
                                                                            <th className="px-2 py-2 text-center">Remaining</th>
                                                                            <th className="px-2 py-2 text-center">Quantity</th>
                                                                            <th className="px-2 py-2 text-center">Price</th>
                                                                            <th className="px-2 py-2 text-center">Total</th>
                                                                            <th className="px-2 py-2 text-center">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {filteredCurrentPO.details.map((detail) => {
                                                                            const isAdded = isItemInReceipt(detail.purchase_order_detail_id);
                                                                            return (
                                                                                <tr
                                                                                    key={detail.purchase_order_detail_id}
                                                                                    className={`border-b ${isAdded ? 'bg-green-50' : ''}`}
                                                                                >
                                                                                    <td className="px-2 py-2">
                                                                                        {detail.item_name} ({detail.item_code})
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        {formatDecimal(detail.ordered_quantity)}{' '}
                                                                                        {detail.item_abbreviation}
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        {formatDecimal(detail.remaining_quantity)}{' '}
                                                                                        {detail.item_abbreviation}
                                                                                    </td>
                                                                                    <td className="px-2 py-2">
                                                                                        <div className="flex items-center justify-center">
                                                                                            <Input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                max={Number(detail.remaining_quantity)}
                                                                                                value={
                                                                                                    receiptQuantities[
                                                                                                        detail.purchase_order_detail_id
                                                                                                    ] || ''
                                                                                                }
                                                                                                onChange={(e) =>
                                                                                                    handleReceiptQuantityChange(
                                                                                                        detail.purchase_order_detail_id,
                                                                                                        e.target.value,
                                                                                                        Number(detail.remaining_quantity),
                                                                                                    )
                                                                                                }
                                                                                                placeholder="Enter qty"
                                                                                                className="w-20 [appearance:textfield] text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                                            />
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-2 py-2">
                                                                                        <div className="flex items-center justify-center">
                                                                                            <Input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                step="1"
                                                                                                value={
                                                                                                    receiptPrices[detail.purchase_order_detail_id] ||
                                                                                                    ''
                                                                                                }
                                                                                                onChange={(e) =>
                                                                                                    handleReceiptPriceChange(
                                                                                                        detail.purchase_order_detail_id,
                                                                                                        e.target.value,
                                                                                                    )
                                                                                                }
                                                                                                placeholder="Enter price"
                                                                                                className="w-24 [appearance:textfield] text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                                            />
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-right">
                                                                                        {formatCurrency(
                                                                                            receiptTotals[detail.purchase_order_detail_id] || '0',
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        <Button
                                                                                            type="button"
                                                                                            size="sm"
                                                                                            variant="default"
                                                                                            onClick={() => addItemToReceipt(detail)}
                                                                                        >
                                                                                            <>
                                                                                                <Plus className="mr-1 h-4 w-4" />
                                                                                                Add
                                                                                            </>
                                                                                        </Button>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Items to be Received Summary */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Items to be Received</h3>

                                        {getReceiptItems().length === 0 ? (
                                            <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                                                No items added yet. Use the selection panel above to add items.
                                            </div>
                                        ) : (
                                            <div className="max-h-[300px] overflow-y-auto rounded-md border p-4">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr className="border-b">
                                                            <th className="px-2 py-2 text-left">Item</th>
                                                            <th className="px-2 py-2 text-left">PO</th>
                                                            <th className="px-2 py-2 text-center">Quantity</th>
                                                            <th className="px-2 py-2 text-right">Price</th>
                                                            <th className="px-2 py-2 text-right">Total</th>
                                                            <th className="px-2 py-2 text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {getReceiptItems().map((item) => (
                                                            <tr key={item.purchase_order_detail_id} className="border-b">
                                                                <td className="px-2 py-2">{item.item_name}</td>
                                                                <td className="px-2 py-2">{item.purchase_order_code}</td>
                                                                <td className="px-2 py-2 text-center">
                                                                    {formatDecimal(item.received_quantity)} {item.item_unit}
                                                                </td>
                                                                <td className="px-2 py-2 text-right">{formatCurrency(item.price_per_unit)}</td>
                                                                <td className="px-2 py-2 text-right">{formatCurrency(item.total_price)}</td>
                                                                <td className="px-2 py-2 text-center">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeItemFromReceipt(item.purchase_order_detail_id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="sticky bottom-0 mt-6 border-t bg-white pt-4 pb-2">
                        <div className="flex items-center justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => router.visit(route('procurement.receipt.index'))}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || !canSubmit} className="px-8">
                                {processing ? 'Processing...' : 'Create Receipt'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
