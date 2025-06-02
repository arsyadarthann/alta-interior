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
import { cn, formatCurrency, formatDecimal } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, CreditCard, FileText, Loader2, Receipt } from 'lucide-react';
import React, { useCallback, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Procurement',
        href: '#',
    },
    {
        title: 'Invoice Payment',
        href: route('procurement.payment.index'),
    },
    {
        title: 'Create',
        href: route('procurement.payment.create'),
    },
];

type Supplier = {
    id: number;
    name: string;
};

type ItemUnit = {
    id: number;
    name: string;
    abbreviation: string;
    created_at: string;
    updated_at: string;
    deleted_at: null | string;
};

type ItemWholesaleUnit = {
    id: number;
    name: string;
    abbreviation: string;
    created_at: string;
    updated_at: string;
    deleted_at: null | string;
};

type Item = {
    id: number;
    name: string;
    code: string;
    item_category_id: number;
    item_unit_id: number;
    price: string;
    created_at: string;
    updated_at: string;
    deleted_at: null | string;
    item_unit: ItemUnit;
    item_wholesale_unit?: ItemWholesaleUnit;
    wholesale_unit_conversion?: string;
};

type PurchaseOrderDetail = {
    id: number;
    purchase_order_id: number;
    item_id: number;
    quantity: string;
    unit_price: string;
    total_price: string;
    created_at: string;
    updated_at: string;
    item: Item;
    purchase_order?: {
        id: number;
        code: string;
    };
};

type GoodsReceiptDetail = {
    id: number;
    goods_receipt_purchase_order_id: number;
    purchase_order_detail_id: number;
    received_quantity: string | number;
    price_per_unit: string | number;
    total_price: string | number;
    tax_amount: string | number;
    total_amount: string | number;
    cogs: string | number;
    purchase_order_detail: PurchaseOrderDetail;
    laravel_through_key?: number;
};

type GoodsReceipt = {
    id: number;
    code: string;
    date: string;
    supplier_id: number;
    received_by: string;
    total_amount: string;
    tax_amount: string;
    grand_total: string;
    status: string;
    created_at: string;
    updated_at: string;
    goods_receipt_details: GoodsReceiptDetail[];
    pivot?: {
        purchase_invoice_id: number;
        goods_receipt_id: number;
        created_at: string;
        updated_at: string;
    };
};

type PurchaseInvoice = {
    id: number;
    code: string;
    date: string;
    due_date: string;
    supplier_id: number;
    total_amount: string | number;
    tax_rate_id: number | null;
    tax_amount: string | number;
    grand_total: string | number;
    status: string;
    remaining_amount: string | number;
    goods_receipts?: GoodsReceipt[];
};

type PaymentMethod = {
    id: number;
    name: string;
};

interface Props {
    code?: string;
    suppliers?: Supplier[];
    paymentMethods?: PaymentMethod[];
}

export default function Create({ code = '', suppliers = [], paymentMethods = [] }: Props) {
    const { showErrorToast } = useToastNotification();
    const [loading, setLoading] = useState(false);
    const [notPaidInvoices, setNotPaidInvoices] = useState<PurchaseInvoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
    const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');

    const { data, setData, post, processing, errors } = useForm({
        code: code,
        date: new Date(),
        purchase_invoice_id: '',
        payment_method_id: '',
        amount: '',
        supplier_id: undefined,
    });

    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
        return format(date, 'dd MMM yyyy');
    };

    // Add function for displaying quantity with wholesale calculation
    const displayQuantityWithWholesale = (detail: GoodsReceiptDetail) => {
        const item = detail.purchase_order_detail.item;

        if (item.item_wholesale_unit && item.wholesale_unit_conversion) {
            const quantity = parseFloat(detail.received_quantity as string);
            const wholesaleUnit = item.item_wholesale_unit.abbreviation;

            return (
                <>
                    {formatDecimal(quantity)} {wholesaleUnit}
                </>
            );
        }

        return (
            <>
                {formatDecimal(detail.received_quantity)} {item.item_unit.abbreviation}
            </>
        );
    };

    const handleSupplierChange = (supplierId: string) => {
        setData((prevData) => ({
            ...prevData,
            supplier_id: supplierId,
            purchase_invoice_id: '',
        }));
        setSelectedInvoice(null);
        fetchNotPaidInvoices(supplierId);
    };

    const fetchNotPaidInvoices = useCallback(
        async (supplierId: string) => {
            if (!supplierId) return;

            setLoading(true);
            try {
                const response = await fetch(
                    route('procurement.payment.getNotPaidInvoice', {
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

                if (responseData && responseData.data && Array.isArray(responseData.data)) {
                    data = responseData.data;
                }

                if (Array.isArray(data)) {
                    setNotPaidInvoices(data);
                } else {
                    console.error('Unexpected response format:', data);
                    showErrorToast(['Invalid response format']);
                }
            } catch (error) {
                console.error('Error fetching non-paid invoices:', error);
                showErrorToast([(error as Error).message]);
            } finally {
                setLoading(false);
            }
        },
        [showErrorToast],
    );

    const fetchPurchaseInvoiceData = useCallback(
        async (invoiceId: string) => {
            if (!invoiceId) return;

            setLoading(true);
            try {
                const response = await fetch(
                    route('procurement.payment.getPurchaseInvoiceData', {
                        purchase_invoice_id: invoiceId,
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

                if (responseData && responseData.data) {
                    setSelectedInvoice(responseData.data);
                    // Default to summary tab when an invoice is selected
                    setActiveTab('summary');
                } else {
                    console.error('Unexpected response format:', responseData);
                    showErrorToast(['Invalid response format']);
                }
            } catch (error) {
                console.error('Error fetching invoices details:', error);
                showErrorToast([(error as Error).message]);
            } finally {
                setLoading(false);
            }
        },
        [showErrorToast, setData],
    );

    const handlePurchaseInvoiceChange = (invoiceId: string) => {
        setData('purchase_invoice_id', invoiceId);
        fetchPurchaseInvoiceData(invoiceId);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('procurement.payment.store'), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    // Calculate total items in all receipts
    const getTotalItems = () => {
        if (!selectedInvoice || !selectedInvoice.goods_receipts) return 0;

        return selectedInvoice.goods_receipts.reduce((total, receipt) => {
            return total + (receipt.goods_receipt_details ? receipt.goods_receipt_details.length : 0);
        }, 0);
    };

    // Group items by receipt for better organization
    const getGroupedItems = () => {
        if (!selectedInvoice || !selectedInvoice.goods_receipts) return [];

        return selectedInvoice.goods_receipts.map((receipt) => {
            const totalReceiptAmount = receipt.goods_receipt_details.reduce((sum, detail) => sum + parseFloat(detail.total_price.toString()), 0);

            return {
                receipt,
                totalAmount: totalReceiptAmount,
                details: receipt.goods_receipt_details,
            };
        });
    };

    const canSubmit =
        data.code &&
        data.date &&
        data.purchase_invoice_id &&
        data.payment_method_id &&
        data.amount &&
        parseFloat(data.amount) > 0 &&
        selectedInvoice &&
        parseFloat(data.amount) <= parseFloat(selectedInvoice.remaining_amount.toString());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Invoice Payment" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Invoice Payment" description="Process a payment for an existing supplier invoice." />
                    <div className="flex gap-3">
                        <Link href={route('procurement.payment.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-1">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Payment Information</h2>
                                    <div className="space-y-4">
                                        <div className="py-2">
                                            <div className="relative grid gap-2 space-y-2">
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
                                                            <span className="text-sm text-gray-600">Loading payment code...</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                            </div>
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="date">
                                                Payment Date <span className="text-red-500">*</span>
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
                                                <PopoverContent className="w-auto p-0" align="start">
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
                                            <Label htmlFor="supplier_id">
                                                Supplier <span className="text-red-500">*</span>
                                            </Label>
                                            <Combobox
                                                value={data.supplier_id ? data.supplier_id : ''}
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
                                            {loading && data.supplier_id && <p className="text-sm text-blue-600">Loading unpaid invoices...</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="purchase_invoice_id">
                                                Invoice <span className="text-red-500">*</span>
                                            </Label>
                                            <Combobox
                                                value={data.purchase_invoice_id ? data.purchase_invoice_id.toString() : ''}
                                                onValueChange={handlePurchaseInvoiceChange}
                                                options={notPaidInvoices.map((invoice) => ({
                                                    value: invoice.id.toString(),
                                                    label: `${invoice.code} - ${formatCurrency(invoice.remaining_amount)}`,
                                                }))}
                                                placeholder={loading ? 'Loading...' : 'Select invoices'}
                                                searchPlaceholder="Search invoices..."
                                                initialDisplayCount={5}
                                                disabled={loading || notPaidInvoices.length === 0}
                                                className={errors.purchase_invoice_id ? 'border-red-500' : ''}
                                            />
                                            {errors.purchase_invoice_id && <p className="text-sm text-red-500">{errors.purchase_invoice_id}</p>}
                                            {data.supplier_id && !loading && notPaidInvoices.length === 0 && (
                                                <p className="text-sm text-amber-600">No unpaid invoices found for this supplier.</p>
                                            )}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="payment_method_id">
                                                Payment Method <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.payment_method_id || undefined}
                                                onValueChange={(value) => setData('payment_method_id', value)}
                                            >
                                                <SelectTrigger className={errors.payment_method_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select payment method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {paymentMethods.map((method) => (
                                                        <SelectItem key={method.id} value={method.id.toString()}>
                                                            {method.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.payment_method_id && <p className="text-sm text-red-500">{errors.payment_method_id}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="amount">
                                                Payment Amount <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                                placeholder="Enter payment amount"
                                                step="0.01"
                                                min="0"
                                                max={selectedInvoice?.remaining_amount.toString()}
                                                disabled={!selectedInvoice}
                                                className={errors.amount ? 'border-red-500 ring-red-100' : ''}
                                            />
                                            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
                                            {selectedInvoice && parseFloat(data.amount) > parseFloat(selectedInvoice.remaining_amount.toString()) && (
                                                <p className="mt-1 text-xs text-red-500">
                                                    Amount cannot exceed the remaining balance of {formatCurrency(selectedInvoice.remaining_amount)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                            <span className="ml-2 text-gray-500">Loading invoice details...</span>
                                        </div>
                                    ) : !selectedInvoice ? (
                                        <div className="flex flex-col items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-12 text-center text-gray-500">
                                            <Receipt className="mb-4 h-12 w-12 text-gray-300" />
                                            <h3 className="text-lg font-medium text-gray-700">No Invoice Selected</h3>
                                            <p className="mt-2 text-gray-500">Select a supplier and invoice to view details and process payment</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                <div className="rounded-lg border border-l-4 border-l-blue-500 bg-white p-4 shadow-sm">
                                                    <h3 className="mb-2 text-xs font-medium text-gray-500 uppercase">Invoice Code</h3>
                                                    <p className="flex items-center text-lg font-semibold text-gray-800">
                                                        <FileText className="mr-2 h-5 w-5 text-blue-500" />
                                                        {selectedInvoice.code}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">Invoice Date: {formatDate(selectedInvoice.date)}</p>
                                                </div>
                                                <div className="rounded-lg border border-l-4 border-l-amber-500 bg-white p-4 shadow-sm">
                                                    <h3 className="mb-2 text-xs font-medium text-gray-500 uppercase">Due Date</h3>
                                                    <p className="text-lg font-semibold text-gray-800">{formatDate(selectedInvoice.due_date)}</p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Status:{' '}
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                selectedInvoice.status === 'paid'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : selectedInvoice.status === 'partially_paid'
                                                                      ? 'bg-amber-100 text-amber-800'
                                                                      : 'bg-blue-100 text-blue-800'
                                                            }`}
                                                        >
                                                            {selectedInvoice.status === 'paid'
                                                                ? 'Paid'
                                                                : selectedInvoice.status === 'partially_paid'
                                                                  ? 'Partially Paid'
                                                                  : 'Unpaid'}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-l-4 border-l-red-500 bg-white p-4 shadow-sm">
                                                    <h3 className="mb-2 text-xs font-medium text-gray-500 uppercase">Remaining</h3>
                                                    <p className="text-lg font-semibold text-red-600">
                                                        {formatCurrency(selectedInvoice.remaining_amount)}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">Total: {formatCurrency(selectedInvoice.grand_total)}</p>
                                                </div>
                                                <div className="rounded-lg border border-l-4 border-l-green-500 bg-white p-4 shadow-sm">
                                                    <h3 className="mb-2 text-xs font-medium text-gray-500 uppercase">Current Payment</h3>
                                                    <p className="flex items-center text-lg font-semibold text-green-600">
                                                        <CreditCard className="mr-2 h-5 w-5 text-green-500" />
                                                        {data.amount ? formatCurrency(data.amount) : 'Rp 0'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-green-600">
                                                        {data.amount &&
                                                        parseFloat(data.amount) >= parseFloat(selectedInvoice.remaining_amount.toString())
                                                            ? 'Fully paid ✓'
                                                            : data.amount && parseFloat(data.amount) > 0
                                                              ? 'Partially paid'
                                                              : 'Not paid yet'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Tab navigation */}
                                            <div className="mb-4 border-b">
                                                <div className="flex space-x-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('summary')}
                                                        className={`-mb-px py-3 text-sm font-medium ${
                                                            activeTab === 'summary'
                                                                ? 'border-b-2 border-blue-500 text-blue-600'
                                                                : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                    >
                                                        Payment Summary
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('details')}
                                                        className={`-mb-px py-3 text-sm font-medium ${
                                                            activeTab === 'details'
                                                                ? 'border-b-2 border-blue-500 text-blue-600'
                                                                : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                    >
                                                        Invoice Items ({getTotalItems()})
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tab content */}
                                            {activeTab === 'summary' ? (
                                                <div className="rounded-lg border bg-white p-6 shadow-sm">
                                                    <h3 className="mb-4 text-base font-medium text-gray-800">Payment Summary</h3>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                                            <span className="text-sm text-gray-600">Subtotal:</span>
                                                            <span className="font-medium">{formatCurrency(selectedInvoice.total_amount)}</span>
                                                        </div>
                                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                                            <span className="text-sm text-gray-600">Tax Amount:</span>
                                                            <span className="font-medium">{formatCurrency(selectedInvoice.tax_amount)}</span>
                                                        </div>
                                                        <div className="flex justify-between bg-gray-50 px-3 py-2">
                                                            <span className="font-medium text-gray-800">Total Amount:</span>
                                                            <span className="font-semibold text-gray-800">
                                                                {formatCurrency(selectedInvoice.grand_total)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Already Paid:</span>
                                                            <span className="font-medium text-green-600">
                                                                {formatCurrency(
                                                                    parseFloat(selectedInvoice.grand_total.toString()) -
                                                                        parseFloat(selectedInvoice.remaining_amount.toString()),
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between bg-blue-50 px-3 py-2">
                                                            <span className="font-medium text-blue-800">Remaining:</span>
                                                            <span className="font-semibold text-blue-800">
                                                                {formatCurrency(selectedInvoice.remaining_amount)}
                                                            </span>
                                                        </div>

                                                        {data.amount && parseFloat(data.amount) > 0 && (
                                                            <>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm text-gray-600">Current Payment:</span>
                                                                    <span className="font-medium text-green-600">{formatCurrency(data.amount)}</span>
                                                                </div>
                                                                <div className="flex justify-between bg-green-50 px-3 py-2">
                                                                    <span className="font-medium text-green-800">New Balance:</span>
                                                                    <span className="font-semibold text-green-800">
                                                                        {formatCurrency(
                                                                            Math.max(
                                                                                0,
                                                                                parseFloat(selectedInvoice.remaining_amount.toString()) -
                                                                                    parseFloat(data.amount),
                                                                            ),
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-4 rounded-md bg-gray-50 p-3 text-center">
                                                                    <span className="text-sm font-medium text-gray-700">New Status: </span>
                                                                    <span
                                                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                                            parseFloat(data.amount) >=
                                                                            parseFloat(selectedInvoice.remaining_amount.toString())
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : 'bg-amber-100 text-amber-800'
                                                                        }`}
                                                                    >
                                                                        {parseFloat(data.amount) >=
                                                                        parseFloat(selectedInvoice.remaining_amount.toString())
                                                                            ? 'Paid'
                                                                            : 'Partially Paid'}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border bg-white shadow-sm">
                                                    {getGroupedItems().map((group, idx) => (
                                                        <div key={idx} className="border-b last:border-b-0">
                                                            <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                                                                <h3 className="text-sm font-medium text-gray-800">
                                                                    <span className="mr-2 rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700">
                                                                        Receipt: {group.receipt.code}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {formatDate(group.receipt.date)} •{' '}
                                                                        {group.receipt.goods_receipt_details.length} items
                                                                    </span>
                                                                </h3>
                                                                <span className="font-medium text-gray-700">{formatCurrency(group.totalAmount)}</span>
                                                            </div>
                                                            <div className="max-h-[220px] overflow-y-auto">
                                                                <table className="w-full border-collapse text-sm">
                                                                    <thead className="sticky top-0 bg-white">
                                                                        <tr className="border-b bg-gray-50">
                                                                            <th className="px-3 py-2 text-left font-medium text-gray-500">Item</th>
                                                                            <th className="px-3 py-2 text-center font-medium text-gray-500">Qty</th>
                                                                            <th className="px-3 py-2 text-right font-medium text-gray-500">Price</th>
                                                                            <th className="px-3 py-2 text-right font-medium text-gray-500">Tax</th>
                                                                            <th className="px-3 py-2 text-right font-medium text-gray-500">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {group.details.map((detail) => (
                                                                            <tr key={detail.id} className="border-b hover:bg-gray-50">
                                                                                <td className="px-3 py-2">
                                                                                    <div className="font-medium">
                                                                                        {detail.purchase_order_detail.item.name}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        {detail.purchase_order_detail.item.code}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    {displayQuantityWithWholesale(detail)}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-right">
                                                                                    {formatCurrency(detail.price_per_unit)}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-right">
                                                                                    {formatCurrency(detail.tax_amount || 0)}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-right font-medium">
                                                                                    {formatCurrency(detail.total_price)}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {getGroupedItems().length === 0 && (
                                                        <div className="p-8 text-center text-gray-500">
                                                            <p>No detailed items available for this invoice</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-6 border-t pt-4 pb-2">
                        <div className="flex items-center justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => router.visit(route('procurement.payment.index'))}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || !canSubmit} className="px-8">
                                {processing ? 'Processing...' : 'Process Payment'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
