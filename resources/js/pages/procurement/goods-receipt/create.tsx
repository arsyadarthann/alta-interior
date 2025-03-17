import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
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
    unit_price: string | number;
    total_price: string | number;
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
    const [unreceivedDetails, setUnreceivedDetails] = useState<UnreceivedPurchaseOrderDetail[]>([]);
    const [groupedPurchaseOrders, setGroupedPurchaseOrders] = useState<GroupedPurchaseOrder[]>([]);
    const [selectedPO, setSelectedPO] = useState<string>('');
    const [receiptQuantities, setReceiptQuantities] = useState<Record<number, string>>({});

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

    // Format date strings safely
    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }

            return format(date, 'dd MMM yyyy');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
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

        // Initialize empty receipt quantities for this PO's items
        if (poId) {
            const po = groupedPurchaseOrders.find((p) => p.id.toString() === poId);
            if (po) {
                const newQuantities = { ...receiptQuantities };
                po.details.forEach((detail) => {
                    // Initialize with empty string (not pre-filled)
                    newQuantities[detail.purchase_order_detail_id] = '';
                });
                setReceiptQuantities(newQuantities);
            }
        }
    };

    const handleReceiptQuantityChange = (poDetailId: number, value: string) => {
        // Allow empty string for blank input
        if (value === '') {
            setReceiptQuantities({
                ...receiptQuantities,
                [poDetailId]: value,
            });
            return;
        }

        // Otherwise validate as number
        const quantity = Number(value);
        if (isNaN(quantity) || quantity < 0) return;

        // Update the receipt quantities
        setReceiptQuantities({
            ...receiptQuantities,
            [poDetailId]: value,
        });
    };

    const addItemToReceipt = (detail: UnreceivedPurchaseOrderDetail) => {
        const poId = detail.purchase_order_id;
        const poDetailId = detail.purchase_order_detail_id;
        const quantityStr = receiptQuantities[poDetailId] || '';

        // Skip if quantity is empty or 0
        if (quantityStr === '' || Number(quantityStr) <= 0) {
            showErrorToast(['Please enter a valid quantity']);
            return;
        }

        const quantity = Number(quantityStr);

        // Check if we already have this PO in our form
        let poIndex = data.goods_receipt_purchase_order.findIndex((po) => po.purchase_order_id === poId);

        // If not, add it
        if (poIndex === -1) {
            const newPO = {
                purchase_order_id: poId,
                purchase_order_code: detail.purchase_order_code,
                goods_receipt_details: [],
            };

            setData('goods_receipt_purchase_order', [...data.goods_receipt_purchase_order, newPO]);

            poIndex = data.goods_receipt_purchase_order.length;
        }

        // Check if we already have this detail
        const formPO = data.goods_receipt_purchase_order[poIndex];
        const detailIndex = formPO?.goods_receipt_details.findIndex((d) => d.purchase_order_detail_id === poDetailId);

        if (detailIndex !== -1 && detailIndex !== undefined) {
            // Update existing detail
            const updatedPOs = [...data.goods_receipt_purchase_order];
            const updatedPO = { ...updatedPOs[poIndex] };
            const updatedDetails = [...updatedPO.goods_receipt_details];

            updatedDetails[detailIndex] = {
                ...updatedDetails[detailIndex],
                received_quantity: Math.min(quantity, Number(detail.remaining_quantity)),
            };

            updatedPO.goods_receipt_details = updatedDetails;
            updatedPOs[poIndex] = updatedPO;

            setData('goods_receipt_purchase_order', updatedPOs);
        } else {
            // Add new detail
            const newDetail = {
                purchase_order_detail_id: poDetailId,
                item_name: `${detail.item_name} (${detail.item_code})`,
                item_code: detail.item_code,
                ordered_quantity: Number(detail.ordered_quantity),
                remaining_quantity: Number(detail.remaining_quantity),
                received_quantity: Math.min(quantity, Number(detail.remaining_quantity)),
                item_unit: detail.item_abbreviation,
            };

            const updatedPOs = [...data.goods_receipt_purchase_order];
            const updatedPO = { ...updatedPOs[poIndex] };

            updatedPO.goods_receipt_details = [...updatedPO.goods_receipt_details, newDetail];

            updatedPOs[poIndex] = updatedPO;

            setData('goods_receipt_purchase_order', updatedPOs);
        }
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

    // Get the currently selected purchase order
    const currentPO = selectedPO ? groupedPurchaseOrders.find((po) => po.id.toString() === selectedPO) : null;

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

    // Check if an item is already in the receipt
    const isItemInReceipt = (poDetailId: number) => {
        return data.goods_receipt_purchase_order.some((po) =>
            po.goods_receipt_details.some((detail) => detail.purchase_order_detail_id === poDetailId),
        );
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
                                            <Select value={data.supplier_id} onValueChange={handleSupplierChange}>
                                                <SelectTrigger className={errors.supplier_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select supplier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {suppliers.map((supplier) => (
                                                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                            {supplier.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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
                                                        <Select value={selectedPO} onValueChange={handleSelectedPOChange}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select purchase order" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {groupedPurchaseOrders.map((po) => (
                                                                    <SelectItem key={po.id} value={po.id.toString()}>
                                                                        {po.code} ({po.details.length} items)
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Items from Selected PO */}
                                                    {currentPO && (
                                                        <div className="rounded-md border p-4">
                                                            <h3 className="mb-2 font-medium">Items from PO: {currentPO.code}</h3>

                                                            <div className="max-h-[300px] overflow-y-auto">
                                                                <table className="w-full border-collapse text-sm">
                                                                    <thead>
                                                                        <tr className="border-b">
                                                                            <th className="px-2 py-2 text-left">Item</th>
                                                                            <th className="px-2 py-2 text-center">Ordered</th>
                                                                            <th className="px-2 py-2 text-center">Remaining</th>
                                                                            <th className="px-2 py-2 text-center">Quantity</th>
                                                                            <th className="px-2 py-2 text-center">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {currentPO.details.map((detail) => {
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
                                                                                                    )
                                                                                                }
                                                                                                placeholder="Enter qty"
                                                                                                className="w-24 [appearance:textfield] text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                                            />
                                                                                            {/*<span className="ml-2 text-sm text-gray-500">*/}
                                                                                            {/*    {detail.item_abbreviation}*/}
                                                                                            {/*</span>*/}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        <Button
                                                                                            type="button"
                                                                                            size="sm"
                                                                                            variant={isAdded ? 'outline' : 'default'}
                                                                                            className={
                                                                                                isAdded ? 'border-green-500 text-green-600' : ''
                                                                                            }
                                                                                            onClick={() => {
                                                                                                if (isAdded) {
                                                                                                    removeItemFromReceipt(
                                                                                                        detail.purchase_order_detail_id,
                                                                                                    );
                                                                                                } else {
                                                                                                    addItemToReceipt(detail);
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            {isAdded ? (
                                                                                                'Remove'
                                                                                            ) : (
                                                                                                <>
                                                                                                    <Plus className="mr-1 h-4 w-4" />
                                                                                                    Add
                                                                                                </>
                                                                                            )}
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
