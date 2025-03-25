import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { cn, formatDecimal } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, Trash2, TruckIcon } from 'lucide-react';
import React, { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: '#',
    },
    {
        title: 'Waybills',
        href: route('sales.waybill.index'),
    },
    {
        title: 'Create',
        href: route('sales.waybill.create'),
    },
];

type SalesOrder = {
    id: number;
    code: string;
    customer: {
        id: number;
        name: string;
    };
    customer_name: string;
    date: string;
};

type SalesOrderDetail = {
    sales_order_detail_id: number;
    item_id: number;
    item_name: string;
    item_unit: string;
    ordered_quantity: number;
    shipped_quantity: number;
    pending_quantity: number;
};

interface Props {
    code: string;
    salesOrders: SalesOrder[];
}

export default function Create({ code, salesOrders }: Props) {
    const { showErrorToast } = useToastNotification();
    const [salesOrderDetails, setSalesOrderDetails] = useState<SalesOrderDetail[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        code: code,
        date: new Date(),
        sales_order_id: null as number | null,
        waybill_details: [] as {
            sales_order_detail_id: number;
            quantity: number;
            description: string;
        }[],
    });

    const handleSalesOrderChange = async (salesOrderId: string) => {
        const id = parseInt(salesOrderId, 10);
        setData('sales_order_id', id);

        // Reset waybill details when changing sales order
        setData('waybill_details', []);

        if (id) {
            setIsLoadingDetails(true);
            try {
                const response = await fetch(route('sales.waybill.getSalesOrderData', { sales_order_id: id }), {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch sales order details');
                }

                const data = await response.json();
                setSalesOrderDetails(data);
            } catch (error) {
                showErrorToast(['Failed to fetch sales order details']);
                console.error(error);
            } finally {
                setIsLoadingDetails(false);
            }
        } else {
            setSalesOrderDetails([]);
        }
    };

    // Function to handle adding a detail item to waybill
    const addWaybillDetail = (detail: SalesOrderDetail) => {
        // Check if already added
        const exists = data.waybill_details.some((item) => item.sales_order_detail_id === detail.sales_order_detail_id);

        if (!exists && detail.pending_quantity > 0) {
            setData('waybill_details', [
                ...data.waybill_details,
                {
                    sales_order_detail_id: detail.sales_order_detail_id,
                    quantity: detail.pending_quantity,
                    description: '',
                },
            ]);
        }
    };

    // Function to update quantity
    const updateQuantity = (index: number, quantity: number) => {
        const detail = data.waybill_details[index];
        const salesOrderDetail = salesOrderDetails.find((item) => item.sales_order_detail_id === detail.sales_order_detail_id);

        // Ensure quantity doesn't exceed pending quantity
        if (salesOrderDetail) {
            const maxQuantity = salesOrderDetail.pending_quantity;
            const finalQuantity = Math.min(Math.max(0, quantity), maxQuantity);

            const updatedDetails = [...data.waybill_details];
            updatedDetails[index] = {
                ...detail,
                quantity: finalQuantity,
            };

            setData('waybill_details', updatedDetails);

            if (finalQuantity !== quantity) {
                showErrorToast([`Quantity cannot exceed pending quantity (${maxQuantity})`]);
            }
        }
    };

    // Function to update description
    const updateDescription = (index: number, description: string) => {
        const updatedDetails = [...data.waybill_details];
        updatedDetails[index] = {
            ...updatedDetails[index],
            description,
        };

        setData('waybill_details', updatedDetails);
    };

    // Function to remove a detail item
    const removeWaybillDetail = (index: number) => {
        const updatedDetails = [...data.waybill_details];
        updatedDetails.splice(index, 1);
        setData('waybill_details', updatedDetails);
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post(route('sales.waybill.store'), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    // Get item details for a given sales_order_detail_id
    const getItemDetails = (salesOrderDetailId: number) => {
        return salesOrderDetails.find((detail) => detail.sales_order_detail_id === salesOrderDetailId);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Waybill" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Waybill" description="Create a new waybill for order delivery." />
                    <div className="flex gap-3">
                        <Link href={route('sales.waybill.index')}>
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
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Waybill Information</h2>
                                    <div className="space-y-4">
                                        {/* Waybill Code */}
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
                                                        <span className="text-sm text-gray-600">Code will be generated automatically</span>
                                                    </div>
                                                )}
                                            </div>
                                            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                        </div>

                                        {/* Date Picker */}
                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="date">
                                                Waybill Date <span className="text-red-500">*</span>
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
                                                        {data.date ? format(data.date, 'dd MMM Y') : <span>Select date</span>}
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
                                            <Label htmlFor="sales_order">
                                                Sales Order <span className="text-red-500">*</span>
                                            </Label>
                                            <Combobox
                                                value={data.sales_order_id ? String(data.sales_order_id) : ''}
                                                onValueChange={handleSalesOrderChange}
                                                options={salesOrders.map((order) => ({
                                                    value: String(order.id),
                                                    label: `${order.code} - ${order.customer.name ?? order.customer_name}`,
                                                }))}
                                                placeholder="Select sales order"
                                                searchPlaceholder="Search orders..."
                                                initialDisplayCount={5}
                                                className={errors.sales_order_id ? 'border-red-500 ring-red-100' : ''}
                                            />
                                            {errors.sales_order_id && <p className="mt-1 text-xs text-red-500">{errors.sales_order_id}</p>}
                                        </div>

                                        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Total Items:</span>
                                                <span className="font-medium">{data.waybill_details.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-gray-900">Waybill Items</h2>
                                        <div className="flex items-center">
                                            <span className="mr-2 text-sm text-gray-500">{data.waybill_details.length} items</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Pending Items Section */}
                                        {data.sales_order_id && salesOrderDetails.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="mb-3 text-sm font-medium text-gray-700">Pending Items</h3>
                                                <div className="max-h-[20vh] overflow-y-auto rounded border border-gray-200">
                                                    <div className="min-w-full divide-y divide-gray-200">
                                                        <div className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                                                            <div className="grid grid-cols-5 px-4 py-2">
                                                                <div className="col-span-2">Item</div>
                                                                <div>Ordered</div>
                                                                <div>Pending</div>
                                                                <div>Action</div>
                                                            </div>
                                                        </div>
                                                        <div className="divide-y divide-gray-200 bg-white">
                                                            {isLoadingDetails ? (
                                                                <div className="px-4 py-4 text-center text-sm text-gray-500">Loading items...</div>
                                                            ) : salesOrderDetails.filter((item) => item.pending_quantity > 0).length === 0 ? (
                                                                <div className="px-4 py-4 text-center text-sm text-gray-500">
                                                                    All items from this order have been shipped
                                                                </div>
                                                            ) : (
                                                                salesOrderDetails
                                                                    .filter((item) => item.pending_quantity > 0)
                                                                    .map((detail) => {
                                                                        const isAdded = data.waybill_details.some(
                                                                            (item) => item.sales_order_detail_id === detail.sales_order_detail_id,
                                                                        );
                                                                        return (
                                                                            <div
                                                                                key={detail.sales_order_detail_id}
                                                                                className="grid grid-cols-5 items-center px-4 py-2 text-sm"
                                                                            >
                                                                                <div className="col-span-2">{detail.item_name}</div>
                                                                                <div>
                                                                                    {formatDecimal(detail.ordered_quantity)} {detail.item_unit}
                                                                                </div>
                                                                                <div>
                                                                                    {detail.pending_quantity} {detail.item_unit}
                                                                                </div>
                                                                                <div>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => addWaybillDetail(detail)}
                                                                                        disabled={isAdded}
                                                                                        className={isAdded ? 'text-gray-400' : 'text-blue-600'}
                                                                                    >
                                                                                        {isAdded ? 'Added' : 'Add to Waybill'}
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Added Items Section */}
                                        <div>
                                            <h3 className="mb-3 text-sm font-medium text-gray-700">Items to Ship</h3>
                                            {data.waybill_details.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 py-8">
                                                    <TruckIcon className="mb-2 h-8 w-8 text-gray-400" />
                                                    <p className="text-sm text-gray-500">No items added yet.</p>
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        Select a sales order and add items from the pending list
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {data.waybill_details.map((detail, index) => {
                                                        const itemDetail = getItemDetails(detail.sales_order_detail_id);
                                                        return (
                                                            <div key={index} className="rounded-md border border-gray-200 p-4">
                                                                <div className="mb-2 flex items-center justify-between">
                                                                    <h4 className="font-medium">{itemDetail?.item_name || 'Unknown Item'}</h4>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => removeWaybillDetail(index)}
                                                                        className="h-8 w-8 text-red-500"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>

                                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                    <div>
                                                                        <Label htmlFor={`quantity-${index}`} className="mb-1 block text-xs">
                                                                            Quantity <span className="text-red-500">*</span>
                                                                        </Label>
                                                                        <div className="relative">
                                                                            <Input
                                                                                id={`quantity-${index}`}
                                                                                type="number"
                                                                                min="1"
                                                                                max={itemDetail?.pending_quantity || 1}
                                                                                value={detail.quantity}
                                                                                onChange={(e) => updateQuantity(index, Number(e.target.value))}
                                                                                className={`[appearance:textfield] pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                                                                                    errors[`waybill_details.${index}.quantity` as keyof typeof errors]
                                                                                        ? 'border-red-500 ring-red-100'
                                                                                        : ''
                                                                                }`}
                                                                            />
                                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                                                                                {itemDetail?.item_unit || ''}
                                                                            </div>
                                                                        </div>
                                                                        {errors[`waybill_details.${index}.quantity` as keyof typeof errors] && (
                                                                            <p className="mt-1 text-xs text-red-500">
                                                                                {errors[`waybill_details.${index}.quantity` as keyof typeof errors]}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <Label htmlFor={`description-${index}`} className="mb-1 block text-xs">
                                                                            Description (Optional)
                                                                        </Label>
                                                                        <Textarea
                                                                            id={`description-${index}`}
                                                                            value={detail.description}
                                                                            onChange={(e) => updateDescription(index, e.target.value)}
                                                                            className="min-h-[60px] resize-none"
                                                                            placeholder="Add notes or description..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 py-4">
                        <Button variant="outline" type="button" onClick={() => router.visit(route('sales.waybill.index'))}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || data.waybill_details.length === 0 || !data.code || !data.sales_order_id}
                            className="px-8"
                        >
                            {processing ? 'Creating...' : 'Create Waybill'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
