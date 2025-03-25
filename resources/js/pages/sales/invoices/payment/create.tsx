import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, ChevronDown, ChevronRight, Loader2, Package } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: '#',
    },
    {
        title: 'Payments',
        href: route('sales.payment.index'),
    },
    {
        title: 'Create',
        href: route('sales.payment.create'),
    },
];

type Customer = {
    id: number;
    name: string;
    contact_name: string;
    phone: string;
    email: string;
    address: string;
};

type Item = {
    id: number;
    name: string;
    code: string;
    item_category_id: number;
    item_unit_id: number;
    price: string;
    item_unit: {
        id: number;
        name: string;
        abbreviation: string;
    };
};

type WaybillDetail = {
    id: number;
    waybill_id: number;
    sales_order_detail_id: number;
    quantity: string;
    description: string | null;
    sales_order_detail: {
        id: number;
        sales_order_id: number;
        item_id: number;
        item_source_able_id: number;
        quantity: string;
        unit_price: string;
        total_price: string;
        item_source_able_type: string;
        item_source_able: {
            id: number;
            name: string;
            description: string | null;
            is_active: boolean;
        };
        item: Item;
    };
};

type Waybill = {
    id: number;
    code: string;
    date: string;
    user_id: number;
    branch_id: number;
    sales_order_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    sales_order: {
        id: number;
        code: string;
        date: string;
        total_amount: string;
        tax_rate_id: number;
        tax_amount: string;
        grand_total: string;
    };
    waybill_details: WaybillDetail[];
};

type SalesInvoiceDetail = {
    id: number;
    sales_invoice_id: number;
    waybill_id: number;
    created_at: string;
    updated_at: string;
    waybill: Waybill;
};

type SalesInvoice = {
    id: number;
    code: string;
    date: string;
    due_date: string;
    user_id: number;
    branch_id: number;
    customer_id: number;
    customer_name: string | null;
    total_amount: string;
    discount_type: string;
    discount_percentage: string;
    discount_amount: string;
    tax_rate_id: number;
    tax_amount: string;
    grand_total: string;
    paid_status: 'unpaid' | 'partially_paid' | 'paid';
    paid_amount: string;
    remaining_amount: string;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
    };
    branch: {
        id: number;
        name: string;
    };
    customer: Customer;
    tax_rate?: {
        id: number;
        rate: string;
    };
    sales_invoice_details?: SalesInvoiceDetail[];
};

type PaymentMethod = {
    id: number;
    name: string;
    charge_percentage: string;
    created_at: string;
    updated_at: string;
    deleted_at: null | string;
};

interface Props {
    code: string;
    salesInvoices: SalesInvoice[];
    paymentMethods: PaymentMethod[];
}

export default function Create({ code, salesInvoices, paymentMethods }: Props) {
    const { showErrorToast } = useToastNotification();
    const [loading, setLoading] = useState(false);
    const [invoiceDetails, setInvoiceDetails] = useState<SalesInvoice | null>(null);
    const [expandedWaybills, setExpandedWaybills] = useState<Record<number, boolean>>({});
    const [amountError, setAmountError] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        code: code || '',
        date: new Date(),
        sales_invoice_id: '',
        payment_method_id: '',
        amount: '',
        note: '',
    });

    useEffect(() => {
        if (invoiceDetails && data.amount) {
            const paymentAmount = parseFloat(data.amount);
            const remainingAmount = parseFloat(invoiceDetails.remaining_amount);

            if (paymentAmount > remainingAmount) {
                setAmountError(`Amount cannot exceed the remaining balance of ${formatCurrency(remainingAmount)}`);
            } else {
                setAmountError(null);
            }
        }
    }, [data.amount, invoiceDetails]);

    const formatDecimal = (value: string | number): string => {
        if (value === null || value === undefined) return '0';

        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numValue)) return '0';

        if (Number.isInteger(numValue)) {
            return numValue.toString();
        }

        return numValue.toFixed(2).replace(/\.?0+$/, '');
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (amountError) {
            showErrorToast([amountError]);
            return;
        }

        post(route('sales.payment.store'), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    const fetchInvoiceDetails = useCallback(
        async (invoiceId: string) => {
            if (!invoiceId) {
                setInvoiceDetails(null);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(
                    route('sales.payment.getSalesInvoiceData', {
                        sales_invoice_id: invoiceId,
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
                    setInvoiceDetails(responseData.data);

                    if (responseData.data.sales_invoice_details) {
                        const initialExpandState = {};
                        responseData.data.sales_invoice_details.forEach((detail, index) => {
                            initialExpandState[detail.id] = index === 0;
                        });
                        setExpandedWaybills(initialExpandState);
                    }
                } else {
                    console.error('Unexpected response format:', responseData);
                    showErrorToast(['Invalid response format']);
                }
            } catch (error) {
                console.error('Error fetching invoice details:', error);
                showErrorToast([(error as Error).message]);
            } finally {
                setLoading(false);
            }
        },
        [setData, showErrorToast],
    );

    const handleInvoiceChange = (invoiceId: string) => {
        setData('sales_invoice_id', invoiceId);
        setData('amount', '');
        fetchInvoiceDetails(invoiceId);
    };

    const toggleWaybillExpand = (detailId: number) => {
        setExpandedWaybills((prev) => ({
            ...prev,
            [detailId]: !prev[detailId],
        }));
    };

    const canSubmit = data.code && data.date && data.sales_invoice_id && data.payment_method_id && parseFloat(data.amount) > 0 && !amountError;

    const getInvoiceStatus = (invoice: SalesInvoice | null) => {
        if (!invoice) return null;

        const paidAmount = parseFloat(invoice.paid_amount);
        const grandTotal = parseFloat(invoice.grand_total);

        let statusText = '';
        let statusClass = '';

        if (paidAmount === 0) {
            statusText = 'Unpaid';
            statusClass = 'bg-red-100 text-red-800';
        } else if (paidAmount < grandTotal) {
            statusText = 'Partially Paid';
            statusClass = 'bg-yellow-100 text-yellow-800';
        } else {
            statusText = 'Paid';
            statusClass = 'bg-green-100 text-green-800';
        }

        return <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass}`}>{statusText}</span>;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, 'dd MMM yyyy');
    };

    const calculateWaybillTotal = (waybill: Waybill): number => {
        if (!waybill.waybill_details) return 0;

        return waybill.waybill_details.reduce((total, detail) => {
            const quantity = parseFloat(detail.quantity);
            const unitPrice = parseFloat(detail.sales_order_detail.unit_price);
            return total + quantity * unitPrice;
        }, 0);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Payment" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Payment" description="Create a new payment for a sales invoice." />
                    <div className="flex gap-3">
                        <Link href={route('sales.payment.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-12">
                        <Card className="h-full border-0 shadow-sm lg:col-span-4">
                            <div className="p-6">
                                <div className="mb-4 flex items-center text-base font-semibold text-gray-900">
                                    <h2>Payment Information</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative grid gap-2 space-y-2">
                                        <Label htmlFor="code">
                                            Payment Code <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                            placeholder="Enter payment code"
                                            className={errors.code ? 'border-red-500 ring-red-100' : ''}
                                        />
                                        {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
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

                                    <div className="space-y-2">
                                        <Label htmlFor="sales_invoice_id">
                                            Sales Invoice <span className="text-red-500">*</span>
                                        </Label>
                                        <Combobox
                                            value={data.sales_invoice_id ? data.sales_invoice_id.toString() : ''}
                                            onValueChange={handleInvoiceChange}
                                            options={salesInvoices.map((invoice) => ({
                                                value: invoice.id.toString(),
                                                label: `${invoice.code} - ${invoice.customer.name} (${formatCurrency(parseFloat(invoice.remaining_amount))})`,
                                            }))}
                                            placeholder="Select invoice"
                                            searchPlaceholder="Search invoices..."
                                            initialDisplayCount={5}
                                            className={errors.sales_invoice_id ? 'border-red-500' : ''}
                                        />
                                        {errors.sales_invoice_id && <p className="text-sm text-red-500">{errors.sales_invoice_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="payment_method_id">
                                            Payment Method <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={data.payment_method_id} onValueChange={(value) => setData('payment_method_id', value)}>
                                            <SelectTrigger className={errors.payment_method_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select payment method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paymentMethods.map((method) => (
                                                    <SelectItem key={method.id} value={method.id.toString()}>
                                                        {method.name}
                                                        {parseFloat(method.charge_percentage) > 0 &&
                                                            ` (${formatDecimal(method.charge_percentage)}% charge)`}
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
                                            className={errors.amount || amountError ? 'border-red-500 ring-red-100' : ''}
                                            min="0"
                                            step="0.01"
                                            max={invoiceDetails ? invoiceDetails.remaining_amount : undefined}
                                        />
                                        {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
                                        {amountError && <p className="mt-1 text-xs text-red-500">{amountError}</p>}
                                    </div>

                                    <div className="relative grid gap-2 space-y-2">
                                        <Label htmlFor="note">Note</Label>
                                        <Textarea
                                            id="note"
                                            value={data.note}
                                            onChange={(e) => setData('note', e.target.value)}
                                            placeholder="Enter optional notes"
                                            className={errors.note ? 'border-red-500 ring-red-100' : ''}
                                            rows={3}
                                        />
                                        {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note}</p>}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="h-full border-0 shadow-sm lg:col-span-8">
                            <div className="p-6">
                                <div className="mb-4 flex items-center text-base font-semibold text-gray-900">
                                    <h2>Invoice Details</h2>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                        <span className="ml-2 text-gray-500">Loading...</span>
                                    </div>
                                ) : !data.sales_invoice_id ? (
                                    <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                                        Select an invoice to view details
                                    </div>
                                ) : !invoiceDetails ? (
                                    <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                                        No invoice details found
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border bg-gray-50 p-4">
                                            <div className="flex flex-col">
                                                <h3 className="text-xl font-medium">{invoiceDetails.code}</h3>
                                                <p className="text-sm text-gray-500">OFFICIAL INVOICE DOCUMENT</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div>{getInvoiceStatus(invoiceDetails)}</div>
                                                <div className="mt-1 text-sm text-gray-500">{formatDate(invoiceDetails.date)}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="rounded-md border p-4">
                                                <h3 className="mb-2 font-medium">Invoice Details</h3>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Invoice Date:</span>
                                                        <span>{formatDate(invoiceDetails.date)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Due Date:</span>
                                                        <span>{formatDate(invoiceDetails.due_date)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Created By:</span>
                                                        <span>{invoiceDetails.user.name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-md border p-4">
                                                <h3 className="mb-2 font-medium">Bill To</h3>
                                                <div className="text-sm">
                                                    <p className="font-medium">{invoiceDetails.customer.name}</p>
                                                    <p>{invoiceDetails.customer.address ?? 'No address'}</p>
                                                    <p>Phone: {invoiceDetails.customer.phone ?? '-'}</p>
                                                    <p>Contact: {invoiceDetails.customer.contact_name ?? '-'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {invoiceDetails.sales_invoice_details && invoiceDetails.sales_invoice_details.length > 0 ? (
                                            <div className="space-y-4">
                                                <h3 className="border-b pb-2 font-medium">Waybill Details</h3>

                                                {invoiceDetails.sales_invoice_details.map((detail) => (
                                                    <div key={detail.id} className="rounded-md border">
                                                        <div
                                                            className="flex cursor-pointer items-center justify-between bg-gray-50 p-3 hover:bg-gray-100"
                                                            onClick={() => toggleWaybillExpand(detail.id)}
                                                        >
                                                            <div className="flex items-center">
                                                                <Package className="mr-2 h-4 w-4 text-gray-500" />
                                                                <div>
                                                                    <span className="font-medium">{detail.waybill?.code || 'N/A'}</span>
                                                                    <span className="ml-2 text-sm text-gray-500">
                                                                        ({detail.waybill?.date ? formatDate(detail.waybill.date) : 'N/A'})
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="mr-3 text-sm font-medium">
                                                                    {detail.waybill ? formatCurrency(calculateWaybillTotal(detail.waybill)) : 'N/A'}
                                                                </span>
                                                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                                                                    {detail.waybill?.status || 'N/A'}
                                                                </span>
                                                                {expandedWaybills[detail.id] ? (
                                                                    <ChevronDown className="ml-2 h-5 w-5" />
                                                                ) : (
                                                                    <ChevronRight className="ml-2 h-5 w-5" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {expandedWaybills[detail.id] && (
                                                            <div className="border-t p-3">
                                                                <div className="mb-3 text-sm">
                                                                    <div className="mb-2 flex items-center">
                                                                        <span className="mr-1 font-medium">Sales Order:</span>
                                                                        <span>{detail.waybill?.sales_order?.code || 'N/A'}</span>
                                                                    </div>
                                                                    <div className="mb-2">
                                                                        <span className="font-medium">Items:</span>
                                                                    </div>
                                                                </div>

                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="border-b text-left">
                                                                                <th className="pr-2 pb-2">Item</th>
                                                                                <th className="px-2 pb-2 text-center">Quantity</th>
                                                                                <th className="px-2 pb-2 text-right">Unit Price</th>
                                                                                <th className="pb-2 pl-2 text-right">Total</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {detail.waybill?.waybill_details?.map((item) => {
                                                                                const quantity = parseFloat(item.quantity);
                                                                                const unitPrice = parseFloat(item.sales_order_detail.unit_price);
                                                                                const total = quantity * unitPrice;

                                                                                return (
                                                                                    <tr key={item.id} className="border-b last:border-0">
                                                                                        <td className="py-2 pr-2">
                                                                                            <div>
                                                                                                <span className="font-medium">
                                                                                                    {item.sales_order_detail.item.name}
                                                                                                </span>
                                                                                                <span className="ml-1 text-xs text-gray-500">
                                                                                                    ({item.sales_order_detail.item.code})
                                                                                                </span>
                                                                                            </div>
                                                                                            {item.description && (
                                                                                                <div className="mt-1 text-xs text-gray-500">
                                                                                                    Note: {item.description}
                                                                                                </div>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-2 py-2 text-center">
                                                                                            {formatDecimal(quantity)}{' '}
                                                                                            {item.sales_order_detail.item.item_unit.abbreviation}
                                                                                        </td>
                                                                                        <td className="px-2 py-2 text-right">
                                                                                            {formatCurrency(unitPrice)}
                                                                                        </td>
                                                                                        <td className="py-2 pl-2 text-right">
                                                                                            {formatCurrency(total)}
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                        <tfoot>
                                                                            <tr className="bg-gray-50 font-medium">
                                                                                <td colSpan={3} className="py-2 text-right">
                                                                                    Waybill Total:
                                                                                </td>
                                                                                <td className="py-2 pl-2 text-right">
                                                                                    {detail.waybill
                                                                                        ? formatCurrency(calculateWaybillTotal(detail.waybill))
                                                                                        : 'N/A'}
                                                                                </td>
                                                                            </tr>
                                                                        </tfoot>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center text-gray-500">
                                                No waybills found for this invoice
                                            </div>
                                        )}

                                        <div className="rounded-md border p-4">
                                            <h3 className="mb-3 font-medium">Payment Summary</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Invoice Total:</span>
                                                    <span className="font-medium">{formatCurrency(parseFloat(invoiceDetails.grand_total))}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Already Paid:</span>
                                                    <span className="font-medium">{formatCurrency(parseFloat(invoiceDetails.paid_amount))}</span>
                                                </div>
                                                <div className="flex justify-between border-t pt-2">
                                                    <span className="font-medium">Remaining Balance:</span>
                                                    <span className="font-medium">{formatCurrency(parseFloat(invoiceDetails.remaining_amount))}</span>
                                                </div>
                                                {data.amount && (
                                                    <>
                                                        <div className="flex justify-between border-t pt-2">
                                                            <span className="font-medium">Current Payment:</span>
                                                            <span className="font-medium">{formatCurrency(parseFloat(data.amount))}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t pt-2">
                                                            <span className="font-medium">Balance After Payment:</span>
                                                            <span className="font-medium">
                                                                {formatCurrency(
                                                                    Math.max(
                                                                        0,
                                                                        parseFloat(invoiceDetails.remaining_amount) - parseFloat(data.amount),
                                                                    ),
                                                                )}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="sticky bottom-0 mt-6 border-t bg-white pt-4 pb-2">
                        <div className="flex items-center justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => router.visit(route('sales.payment.index'))}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || !canSubmit} className="px-8">
                                {processing ? 'Processing...' : 'Create Payment'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
