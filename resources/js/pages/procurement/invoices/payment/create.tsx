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
import { ArrowLeft, CalendarIcon, Loader2 } from 'lucide-react';
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

type PurchaseInvoice = {
    id: number;
    code: string;
    date: string;
    due_date: string;
    total_amount: number;
    tax_amount: number;
    grand_total: number;
    remaining_amount: number;
    status: string;
    goods_receipts?: GoodsReceipt[];
};

type GoodsReceipt = {
    id: number;
    code: string;
    date: string;
    status: string;
    goods_receipt_details: GoodsReceiptDetail[];
};

type GoodsReceiptDetail = {
    id: number;
    received_quantity: string | number;
    price_per_unit: string | number;
    total_price: string | number;
    purchase_order_detail: {
        item: {
            name: string;
            code: string;
            item_unit: {
                name: string;
                abbreviation: string;
            };
        };
        purchase_order: {
            code: string;
        };
    };
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

    const formatDecimal = (value: string | number): string => {
        if (value === null || value === undefined) return '0';

        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numValue)) return '0';

        if (Number.isInteger(numValue)) {
            return numValue.toString();
        }

        return numValue.toFixed(2).replace(/\.?0+$/, '');
    };

    const formatCurrency = (value: string | number): string => {
        if (value === null || value === undefined) return 'Rp 0';

        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numValue)) return 'Rp 0';

        const formattedValue = numValue.toFixed(2);

        const integerPart = Math.floor(numValue)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        if (formattedValue.endsWith('.00')) {
            return `Rp ${integerPart}`;
        } else {
            const decimalPart = formattedValue.split('.')[1];
            return `Rp ${integerPart},${decimalPart}`;
        }
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

    const canSubmit =
        data.code &&
        data.date &&
        data.purchase_invoice_id &&
        data.payment_method_id &&
        data.amount &&
        parseFloat(data.amount) > 0 &&
        selectedInvoice &&
        parseFloat(data.amount) <= selectedInvoice.remaining_amount;

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
                                                            <span className="text-sm text-gray-600">Loading purchase order code...</span>
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
                                            {selectedInvoice && parseFloat(data.amount) > selectedInvoice.remaining_amount && (
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
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Invoice Details</h2>

                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                            <span className="ml-2 text-gray-500">Loading invoice details...</span>
                                        </div>
                                    ) : !selectedInvoice ? (
                                        <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                                            Select a supplier and invoice to view details
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4 rounded-md border bg-gray-50 p-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Invoice Code</p>
                                                    <p className="font-medium">{selectedInvoice.code}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Invoice Date</p>
                                                    <p>{formatDate(selectedInvoice.date)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Due Date</p>
                                                    <p>{formatDate(selectedInvoice.due_date)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                                    <div
                                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
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
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                                <div className="lg:col-span-2">
                                                    {/* Invoice Items */}
                                                    <div className="h-full rounded-md border">
                                                        <div className="border-b bg-gray-50 px-4 py-2">
                                                            <h3 className="text-sm font-medium text-gray-700">Invoice Items</h3>
                                                        </div>
                                                        <div className="max-h-[220px] overflow-y-auto">
                                                            <table className="w-full border-collapse text-sm">
                                                                <thead className="sticky top-0 bg-white">
                                                                    <tr className="border-b bg-gray-50">
                                                                        <th className="px-3 py-2 text-left font-medium text-gray-500">Item</th>
                                                                        <th className="px-3 py-2 text-center font-medium text-gray-500">Qty</th>
                                                                        <th className="px-3 py-2 text-right font-medium text-gray-500">Price</th>
                                                                        <th className="px-3 py-2 text-right font-medium text-gray-500">Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {selectedInvoice.goods_receipts && selectedInvoice.goods_receipts.length > 0 ? (
                                                                        selectedInvoice.goods_receipts.flatMap((receipt) =>
                                                                            receipt.goods_receipt_details.map((detail) => (
                                                                                <tr key={detail.id} className="border-b hover:bg-gray-50">
                                                                                    <td className="px-3 py-2">
                                                                                        <div className="font-medium">
                                                                                            {detail.purchase_order_detail.item.name}
                                                                                        </div>
                                                                                        <div className="flex gap-2 text-xs text-gray-500">
                                                                                            <span>{detail.purchase_order_detail.item.code}</span>
                                                                                            <span>|</span>
                                                                                            <span>GR: {receipt.code}</span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-center">
                                                                                        {formatDecimal(detail.received_quantity)}{' '}
                                                                                        {detail.purchase_order_detail.item.item_unit.abbreviation}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-right">
                                                                                        {formatCurrency(detail.price_per_unit)}
                                                                                    </td>
                                                                                    <td className="px-3 py-2 text-right">
                                                                                        {formatCurrency(detail.total_price)}
                                                                                    </td>
                                                                                </tr>
                                                                            )),
                                                                        )
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan={4} className="px-3 py-3 text-center text-gray-500">
                                                                                No detailed items available
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="lg:col-span-1">
                                                    <div className="h-full rounded-md border">
                                                        <div className="border-b bg-gray-50 px-4 py-2">
                                                            <h3 className="text-sm font-medium text-gray-700">Payment Summary</h3>
                                                        </div>
                                                        <div className="space-y-2 p-3">
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-600">Total Amount:</span>
                                                                <span className="font-medium">{formatCurrency(selectedInvoice.grand_total)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-600">Already Paid:</span>
                                                                <span className="font-medium">
                                                                    {formatCurrency(selectedInvoice.grand_total - selectedInvoice.remaining_amount)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between border-t pt-2">
                                                                <span className="font-medium">Remaining:</span>
                                                                <span className="font-medium text-blue-600">
                                                                    {formatCurrency(selectedInvoice.remaining_amount)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between border-t pt-2">
                                                                <span className="font-medium">Current Payment:</span>
                                                                <span className="font-medium text-green-600">
                                                                    {data.amount ? formatCurrency(data.amount) : 'Rp 0'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between border-t pt-2">
                                                                <span className="font-medium">New Balance:</span>
                                                                <span className="font-medium">
                                                                    {data.amount && !isNaN(parseFloat(data.amount))
                                                                        ? formatCurrency(
                                                                              Math.max(0, selectedInvoice.remaining_amount - parseFloat(data.amount)),
                                                                          )
                                                                        : formatCurrency(selectedInvoice.remaining_amount)}
                                                                </span>
                                                            </div>
                                                            <div className="border-t pt-2 text-center">
                                                                <span className="text-sm font-medium">New Status: </span>
                                                                <span
                                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                                        data.amount && parseFloat(data.amount) >= selectedInvoice.remaining_amount
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : (data.amount && parseFloat(data.amount) > 0) ||
                                                                                selectedInvoice.status === 'partially_paid'
                                                                              ? 'bg-amber-100 text-amber-800'
                                                                              : 'bg-blue-100 text-blue-800'
                                                                    }`}
                                                                >
                                                                    {data.amount && parseFloat(data.amount) >= selectedInvoice.remaining_amount
                                                                        ? 'Paid'
                                                                        : (data.amount && parseFloat(data.amount) > 0) ||
                                                                            selectedInvoice.status === 'partially_paid'
                                                                          ? 'Partially Paid'
                                                                          : selectedInvoice.status === 'partially_paid'
                                                                            ? 'Partially Paid'
                                                                            : 'Unpaid'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
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
