import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency, formatDecimal } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, CheckCircle, PlusCircle, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: '#',
    },
    {
        title: 'Invoices',
        href: route('sales.invoices.index'),
    },
    {
        title: 'Edit',
        href: '#',
    },
];

type Customer = {
    id: number;
    name: string;
    contact_name: string;
    phone: string;
    email: string;
    address: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

type TaxRate = {
    id: number;
    rate: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

type PaymentMethod = {
    id: number;
    name: string;
    charge_percentage: string;
    account_number: string | null;
    account_name: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

type User = {
    id: number;
    name: string;
};

type Branch = {
    id: number;
    name: string;
};

type ItemUnit = {
    id: number;
    name: string;
    abbreviation: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
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
    deleted_at: string | null;
    item_unit: ItemUnit;
};

type ItemSourceable = {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

type SalesOrderDetail = {
    id: number;
    sales_order_id: number;
    item_id: number;
    item_source_able_id: number;
    quantity: string;
    unit_price: string;
    total_price: string;
    created_at: string;
    updated_at: string;
    item_source_able_type: string;
    item_source_able: ItemSourceable;
    item: Item;
};

type WaybillDetail = {
    id: number;
    waybill_id: number;
    sales_order_detail_id: number;
    quantity: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    sales_order_detail: SalesOrderDetail;
};

type SalesOrder = {
    id: number;
    code: string;
    date: string;
    user_id: number;
    branch_id: number;
    customer_id: number;
    customer_name: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    total_amount: string;
    tax_rate_id: number;
    tax_amount: string;
    grand_total: string;
    customer: Customer | null;
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
    user: User;
    branch: Branch;
    sales_order: SalesOrder;
    waybill_details?: WaybillDetail[];
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
    customer_name: string;
    total_amount: string;
    discount_type: 'percentage' | 'amount';
    discount_percentage: string;
    discount_amount: string;
    tax_rate_id: number;
    tax_amount: string;
    grand_total: string;
    paid_status: string;
    paid_amount: string;
    remaining_amount: string;
    payment_method_id: number | null;
    created_at: string;
    updated_at: string;
    user: User;
    branch: Branch;
    customer: Customer;
    tax_rate: TaxRate;
    sales_invoice_details: SalesInvoiceDetail[];
};

type InvoiceWaybillItem = {
    id?: number;
    waybill_id: number;
    total_price: number;
};

export default function Edit({
    salesInvoice,
    waybills = [],
    taxRates = [],
    customers = [],
    paymentMethods = [],
}: {
    salesInvoice: SalesInvoice;
    waybills?: Waybill[];
    taxRates?: TaxRate[];
    customers?: Customer[];
    paymentMethods?: PaymentMethod[];
}) {
    const { showErrorToast } = useToastNotification();
    const [initialized, setInitialized] = useState(false);
    const [selectedWaybills, setSelectedWaybills] = useState<Record<number, Waybill>>({});
    const [availableWaybills, setAvailableWaybills] = useState<Waybill[]>(waybills);
    const [addingWaybill, setAddingWaybill] = useState<boolean>(false);
    const [selectedWaybillId, setSelectedWaybillId] = useState<number | null>(null);
    const [currentWaybillData, setCurrentWaybillData] = useState<Waybill | null>(null);

    // Add refs to track if a fetch is in progress
    const isFetchingWaybillData = useRef(false);

    const { data, setData, put, processing, errors } = useForm({
        code: salesInvoice.code,
        date: new Date(salesInvoice.date),
        due_date: new Date(salesInvoice.due_date),
        customer_id: salesInvoice.customer_id,
        customer_name: salesInvoice.customer_name,
        total_amount: parseFloat(salesInvoice.total_amount),
        discount_type: salesInvoice.discount_type,
        discount_percentage: parseFloat(salesInvoice.discount_percentage),
        discount_amount: parseFloat(salesInvoice.discount_amount),
        tax_rate_id: salesInvoice.tax_rate_id,
        tax_amount: parseFloat(salesInvoice.tax_amount),
        grand_total: parseFloat(salesInvoice.grand_total),
        payment_method_id: salesInvoice.payment_method_id,
        sales_invoice_details: salesInvoice.sales_invoice_details.map((detail) => ({
            id: detail.id,
            waybill_id: detail.waybill_id,
            total_price: calculateWaybillTotalPrice(detail.waybill),
        })),
    });

    useEffect(() => {
        if (!initialized) {
            // Initialize selected waybills from existing invoices data
            const initialSelectedWaybills: Record<number, Waybill> = {};

            salesInvoice.sales_invoice_details.forEach((detail) => {
                if (detail.waybill) {
                    initialSelectedWaybills[detail.waybill_id] = detail.waybill;
                }
            });

            setSelectedWaybills(initialSelectedWaybills);

            // Filter out waybills that are already in the invoices
            const selectedWaybillIds = salesInvoice.sales_invoice_details.map((detail) => detail.waybill_id);
            const filtered = waybills.filter((wb) => !selectedWaybillIds.includes(wb.id));
            setAvailableWaybills(filtered);

            setInitialized(true);
        }
    }, [salesInvoice, waybills]);

    useEffect(() => {
        calculateTotals();
    }, [data.sales_invoice_details, data.tax_rate_id, data.discount_type, data.discount_percentage, data.discount_amount]);

    const fetchWaybillData = useCallback(
        (waybillId: number) => {
            if (isFetchingWaybillData.current) return;

            isFetchingWaybillData.current = true;

            fetch(route('sales.invoices.getWaybillData', { waybill_id: waybillId }), {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then((responseData: Waybill) => {
                    setCurrentWaybillData(responseData);
                })
                .catch((error) => {
                    showErrorToast(['Failed to get waybill data']);
                    console.error(error);
                })
                .finally(() => {
                    isFetchingWaybillData.current = false;
                });
        },
        [showErrorToast],
    );

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate payment method is selected
        if (!data.payment_method_id) {
            showErrorToast(['Please select a payment method']);
            return;
        }

        put(route('sales.invoices.update', salesInvoice.id), {
            preserveScroll: true,
            onError: (errors) => {
                showErrorToast(Object.values(errors).flat());
            },
        });
    };

    const calculateTotals = () => {
        const totalAmount = data.sales_invoice_details.reduce((sum, item) => sum + item.total_price, 0);

        let discountAmount = 0;
        if (data.discount_type === 'percentage' && data.discount_percentage > 0) {
            discountAmount = totalAmount * (data.discount_percentage / 100);
        } else {
            discountAmount = data.discount_amount;
        }

        let taxAmount = 0;
        if (data.tax_rate_id) {
            const selectedTaxRate = taxRates.find((tax) => tax.id === data.tax_rate_id);
            if (selectedTaxRate) {
                taxAmount = (totalAmount - discountAmount) * (parseFloat(selectedTaxRate.rate) / 100);
            }
        }

        const grandTotal = totalAmount - discountAmount + taxAmount;

        setData((prev) => ({
            ...prev,
            total_amount: totalAmount,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            grand_total: grandTotal,
        }));
    };

    const addWaybill = () => {
        setAddingWaybill(true);
        setSelectedWaybillId(null);
        setCurrentWaybillData(null);
    };

    const cancelAddWaybill = () => {
        setAddingWaybill(false);
        setSelectedWaybillId(null);
        setCurrentWaybillData(null);
    };

    const saveWaybill = () => {
        if (!selectedWaybillId || !currentWaybillData) {
            showErrorToast(['Please select a waybill']);
            return;
        }

        // Calculate the total price based on waybill details
        const totalPrice = calculateWaybillTotalPrice(currentWaybillData);

        // Add to sales invoices details
        const newInvoiceDetail: InvoiceWaybillItem = {
            waybill_id: selectedWaybillId,
            total_price: totalPrice,
        };

        setData('sales_invoice_details', [...data.sales_invoice_details, newInvoiceDetail]);

        // Store waybill data for reference
        setSelectedWaybills({
            ...selectedWaybills,
            [selectedWaybillId]: currentWaybillData,
        });

        // Update available waybills
        setAvailableWaybills(availableWaybills.filter((wb) => wb.id !== selectedWaybillId));

        // Reset form state
        setAddingWaybill(false);
        setSelectedWaybillId(null);
        setCurrentWaybillData(null);
    };

    function calculateWaybillTotalPrice(waybill: Waybill): number {
        if (!waybill.waybill_details || waybill.waybill_details.length === 0) {
            return 0;
        }

        return waybill.waybill_details.reduce((sum, detail) => {
            const quantity = parseFloat(detail.quantity);
            const unitPrice = parseFloat(detail.sales_order_detail.unit_price);
            return sum + quantity * unitPrice;
        }, 0);
    }

    const removeWaybill = (index: number) => {
        const waybillToRemove = data.sales_invoice_details[index];
        const waybillId = waybillToRemove.waybill_id;

        // Remove from sales invoices details
        const updatedDetails = [...data.sales_invoice_details];
        updatedDetails.splice(index, 1);
        setData('sales_invoice_details', updatedDetails);

        // Return to available waybills
        if (selectedWaybills[waybillId]) {
            setAvailableWaybills([...availableWaybills, selectedWaybills[waybillId]]);

            // Remove from selected waybills
            const updatedSelectedWaybills = { ...selectedWaybills };
            delete updatedSelectedWaybills[waybillId];
            setSelectedWaybills(updatedSelectedWaybills);
        }
    };

    const handleWaybillSelection = (waybillId: number) => {
        setSelectedWaybillId(waybillId);
        fetchWaybillData(waybillId);
    };

    const handleDiscountTypeChange = (value: string) => {
        setData('discount_type', value as 'percentage' | 'amount');

        // Reset the other discount field
        if (value === 'percentage') {
            setData('discount_amount', 0);
        } else {
            setData('discount_percentage', 0);
        }
    };

    const handleTaxRateChange = (value: string) => {
        if (!value) {
            setData('tax_rate_id', null);
        } else {
            setData('tax_rate_id', parseInt(value, 10));
        }
    };

    const handlePaymentMethodChange = (value: string) => {
        if (!value) {
            setData('payment_method_id', null);
        } else {
            setData('payment_method_id', parseInt(value, 10));
        }
    };

    const renderWaybillDetails = (waybill: Waybill) => {
        if (!waybill.waybill_details || waybill.waybill_details.length === 0) {
            return <div className="text-sm text-gray-500">No details available</div>;
        }

        return (
            <div className="mt-2 space-y-2">
                <div className="text-sm font-medium">Waybill Details:</div>
                <div className="max-h-40 overflow-y-auto rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                    Item
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                    Quantity
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                    Unit
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                    Unit Price
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {waybill.waybill_details.map((detail) => {
                                const quantity = parseFloat(detail.quantity);
                                const unitPrice = parseFloat(detail.sales_order_detail.unit_price);
                                const total = quantity * unitPrice;

                                return (
                                    <tr key={detail.id}>
                                        <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-900">
                                            {detail.sales_order_detail.item.name} ({detail.sales_order_detail.item.code})
                                        </td>
                                        <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-900">{formatDecimal(quantity)}</td>
                                        <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-900">
                                            {detail.sales_order_detail.item.item_unit.abbreviation}
                                        </td>
                                        <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-900">{formatCurrency(unitPrice)}</td>
                                        <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-900">{formatCurrency(total)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderWaybillForm = () => {
        return (
            <div className="mb-4 flex flex-wrap items-start gap-3 rounded-md border bg-gray-50 p-4">
                <div className="w-full space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="relative grid gap-2">
                            <Label htmlFor="waybill">
                                Select Waybill <span className="text-red-500">*</span>
                            </Label>
                            <Combobox
                                value={selectedWaybillId ? String(selectedWaybillId) : ''}
                                onValueChange={(value) => handleWaybillSelection(Number(value))}
                                options={availableWaybills.map((waybill) => ({
                                    value: String(waybill.id),
                                    label: `${waybill.code} (${waybill.sales_order.code})`,
                                }))}
                                placeholder="Select a waybill"
                                searchPlaceholder="Search waybills..."
                                initialDisplayCount={5}
                            />
                        </div>
                    </div>

                    {currentWaybillData && (
                        <div className="rounded-md border bg-white p-3">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium">
                                        Waybill Code: <span className="font-normal">{currentWaybillData.code}</span>
                                    </p>
                                    <p className="text-sm font-medium">
                                        Date: <span className="font-normal">{format(new Date(currentWaybillData.date), 'MMM dd, yyyy')}</span>
                                    </p>
                                    <p className="text-sm font-medium">
                                        Branch: <span className="font-normal">{currentWaybillData.branch?.name}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">
                                        Sales Order: <span className="font-normal">{currentWaybillData.sales_order?.code}</span>
                                    </p>
                                    <p className="text-sm font-medium">
                                        Customer:{' '}
                                        <span className="font-normal">
                                            {currentWaybillData.sales_order?.customer?.name || currentWaybillData.sales_order?.customer_name || 'N/A'}
                                        </span>
                                    </p>
                                    <p className="text-sm font-medium">
                                        Total Amount:{' '}
                                        <span className="font-normal">{formatCurrency(calculateWaybillTotalPrice(currentWaybillData))}</span>
                                    </p>
                                </div>
                            </div>

                            {renderWaybillDetails(currentWaybillData)}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={cancelAddWaybill}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="default"
                            onClick={saveWaybill}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={!selectedWaybillId || !currentWaybillData}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> Add to Invoice
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const renderWaybillList = () => {
        if (data.sales_invoice_details.length === 0) {
            return (
                <div className="py-8 text-center text-gray-500">No waybills added yet. Click the button below to add waybills to the invoice.</div>
            );
        }

        return (
            <div className="space-y-4">
                {data.sales_invoice_details.map((detail, index) => {
                    const waybill = selectedWaybills[detail.waybill_id];
                    // Skip rendering this item if waybill data is missing
                    if (!waybill) return null;

                    return (
                        <div key={index} className="rounded-md border bg-white p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium">{waybill.code}</h3>
                                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-500">
                                        <span>Sales Order: {waybill.sales_order?.code || 'N/A'}</span>
                                        <span>Date: {format(new Date(waybill.date), 'MMM dd, yyyy')}</span>
                                        <span>Amount: {formatCurrency(detail.total_price)}</span>
                                    </div>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeWaybill(index)} className="h-8 w-8">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Sales Invoice" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Edit Sales Invoice" description="Edit an existing sales invoice." />
                    <div className="flex gap-3">
                        <Link href={route('sales.invoices.index')}>
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
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Invoice Information</h2>
                                    <div className="space-y-4">
                                        <div className="py-2">
                                            <div className="border-b border-gray-100 pb-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="px-3 py-1.5 text-sm font-medium">{data.code}</span>
                                                    <input type="hidden" name="code" value={data.code} />
                                                </div>
                                            </div>
                                            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="date">
                                                    Invoice Date <span className="text-red-500">*</span>
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
                                                            {data.date ? format(data.date, 'MMM dd, yyyy') : <span>Select date</span>}
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

                                            <div className="space-y-1">
                                                <Label htmlFor="due_date">
                                                    Due Date <span className="text-red-500">*</span>
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            id="due_date"
                                                            variant="outline"
                                                            className={cn(
                                                                'w-full justify-start text-left font-normal',
                                                                !data.due_date && 'text-muted-foreground',
                                                                errors.due_date && 'border-red-500 ring-red-100',
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {data.due_date ? format(data.due_date, 'MMM dd, yyyy') : <span>Select due date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={data.due_date}
                                                            onSelect={(date) => date && setData('due_date', date)}
                                                            initialFocus
                                                            disabled={(date) => date < new Date(data.date)}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                {errors.due_date && <p className="mt-1 text-xs text-red-500">{errors.due_date}</p>}
                                            </div>
                                        </div>

                                        {/* Read-only customer display */}
                                        <div className="space-y-2">
                                            <Label htmlFor="customer">Customer</Label>
                                            <div className="rounded-md border bg-gray-50 p-2 text-sm text-gray-700">
                                                {data.customer_id
                                                    ? customers.find((c) => c.id === data.customer_id)?.name || data.customer_name
                                                    : data.customer_name || 'No customer'}
                                            </div>
                                            <input type="hidden" name="customer_id" value={data.customer_id || ''} />
                                            <input type="hidden" name="customer_name" value={data.customer_name || ''} />
                                        </div>

                                        {/* Payment Method selection */}
                                        <div className="relative grid gap-2">
                                            <Label htmlFor="payment_method">
                                                Payment Method <span className="text-red-500">*</span>
                                            </Label>
                                            <Combobox
                                                value={data.payment_method_id ? String(data.payment_method_id) : ''}
                                                onValueChange={handlePaymentMethodChange}
                                                options={paymentMethods.map((method) => ({
                                                    value: String(method.id),
                                                    label: method.name + (method.account_number ? ` (${method.account_number})` : ''),
                                                }))}
                                                placeholder="Select payment method"
                                                searchPlaceholder="Search payment methods..."
                                                initialDisplayCount={5}
                                                className={errors.payment_method_id ? 'border-red-500 ring-red-100' : ''}
                                            />
                                            {errors.payment_method_id && <p className="mt-1 text-xs text-red-500">{errors.payment_method_id}</p>}
                                        </div>

                                        <div className="relative grid gap-2">
                                            <Label htmlFor="discount_type">Discount Type</Label>
                                            <RadioGroup
                                                id="discount_type"
                                                value={data.discount_type}
                                                onValueChange={handleDiscountTypeChange}
                                                className="flex gap-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="amount" id="discount_type_amount" />
                                                    <Label htmlFor="discount_type_amount" className="cursor-pointer">
                                                        Amount
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="percentage" id="discount_type_percentage" />
                                                    <Label htmlFor="discount_type_percentage" className="cursor-pointer">
                                                        Percentage
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        {data.discount_type === 'percentage' ? (
                                            <div className="relative grid gap-2">
                                                <Label htmlFor="discount_percentage">Discount Percentage</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="discount_percentage"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        value={data.discount_percentage === 0 ? '' : formatDecimal(data.discount_percentage)}
                                                        onChange={(e) => setData('discount_percentage', Number(e.target.value))}
                                                        placeholder="Enter discount percentage"
                                                        className="pr-8"
                                                    />
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                        <span className="text-gray-500">%</span>
                                                    </div>
                                                </div>
                                                {errors.discount_percentage && (
                                                    <p className="mt-1 text-xs text-red-500">{errors.discount_percentage}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="relative grid gap-2">
                                                <Label htmlFor="discount_amount">Discount Amount</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="discount_amount"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={data.discount_amount === 0 ? '' : formatDecimal(data.discount_amount)}
                                                        onChange={(e) => setData('discount_amount', Number(e.target.value))}
                                                        placeholder="Enter discount amount"
                                                        className="pr-8"
                                                    />
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                        <span className="text-gray-500">$</span>
                                                    </div>
                                                </div>
                                                {errors.discount_amount && <p className="mt-1 text-xs text-red-500">{errors.discount_amount}</p>}
                                            </div>
                                        )}

                                        <div className="relative grid gap-2">
                                            <Label htmlFor="tax_rate_id">Tax Rate</Label>
                                            <Combobox
                                                id="tax_rate_id"
                                                value={data.tax_rate_id ? String(data.tax_rate_id) : ''}
                                                onValueChange={handleTaxRateChange}
                                                options={[
                                                    { value: '', label: 'No Tax' },
                                                    ...taxRates.map((tax) => ({
                                                        value: String(tax.id),
                                                        label: `${tax.rate}%`,
                                                    })),
                                                ]}
                                                placeholder="Select tax rate"
                                                searchPlaceholder="Search tax rates..."
                                                initialDisplayCount={5}
                                            />
                                            {errors.tax_rate_id && <p className="mt-1 text-xs text-red-500">{errors.tax_rate_id}</p>}
                                        </div>

                                        <div className="space-y-3 pt-4">
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                <span className="text-sm font-medium text-gray-500">Total Amount:</span>
                                                <span className="text-sm font-medium">{formatCurrency(data.total_amount)}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                <span className="text-sm font-medium text-gray-500">Discount:</span>
                                                <span className="text-sm font-medium text-red-500">-{formatCurrency(data.discount_amount)}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                <span className="text-sm font-medium text-gray-500">Tax:</span>
                                                <span className="text-sm font-medium">{formatCurrency(data.tax_amount)}</span>
                                            </div>
                                            <div className="flex items-center justify-between font-medium">
                                                <span className="text-gray-900">Grand Total:</span>
                                                <span className="text-lg text-gray-900">{formatCurrency(data.grand_total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="space-y-6">
                                <div className="rounded-md border">
                                    <div className="border-b p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-medium text-gray-900">Waybills</h3>
                                            <Button
                                                type="button"
                                                onClick={addWaybill}
                                                className="gap-2"
                                                disabled={availableWaybills.length === 0 || addingWaybill}
                                            >
                                                <PlusCircle className="h-4 w-4" /> Add Waybill
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-4">{addingWaybill ? renderWaybillForm() : renderWaybillList()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 py-4">
                        <Button variant="outline" type="button" onClick={() => router.visit(route('sales.invoices.index'))}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                processing ||
                                data.sales_invoice_details.length === 0 ||
                                !data.code ||
                                (!data.customer_id && !data.customer_name) ||
                                !data.payment_method_id
                            }
                            className="px-8"
                        >
                            {processing ? 'Updating...' : 'Update Invoice'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
