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
import { cn, formatCurrency, formatDecimal } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { addDays, format } from 'date-fns';
import { ArrowLeft, CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Procurement',
        href: '#',
    },
    {
        title: 'Invoice',
        href: route('procurement.invoices.index'),
    },
    {
        title: 'Create',
        href: route('procurement.invoices.create'),
    },
];

type Supplier = {
    id: number;
    name: string;
};

type GoodsReceipt = {
    id: number;
    code: string;
    date: string;
    received_by: string;
    status: string;
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
    purchase_order_detail: {
        id: number;
        purchase_order_id: number;
        item_id: number;
        quantity: string | number;
        unit_price: string | number;
        total_price: string | number;
        item: {
            id: number;
            name: string;
            code: string;
            item_unit: {
                id: number;
                name: string;
                abbreviation: string;
            };
            item_wholesale_unit?: {
                id: number;
                name: string;
                abbreviation: string;
            };
            wholesale_unit_conversion?: string | number;
        };
    };
    goods_receipt_purchase_order: {
        id: number;
        goods_receipt_id: number;
        purchase_order_id: number;
        purchase_order: {
            id: number;
            code: string;
        };
    };
    laravel_through_key: number;
};

interface Props {
    suppliers?: Supplier[];
}

export default function Create({ suppliers = [] }: Props) {
    const { showErrorToast } = useToastNotification();
    const [loading, setLoading] = useState(false);
    const [notInvoicedGoodsReceipts, setNotInvoicedGoodsReceipts] = useState<GoodsReceipt[]>([]);
    const [goodsReceiptDetails, setGoodsReceiptDetails] = useState<GoodsReceiptDetail[]>([]);
    const [selectedGoodsReceipt, setSelectedGoodsReceipt] = useState<string>('');
    const [, setSelectedDetails] = useState<Record<number, boolean>>({});
    const [, setCalculatingTotals] = useState(false);

    const latestGoodsReceiptsRef = useRef<GoodsReceipt[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        date: new Date(),
        due_date: addDays(new Date(), 30),
        supplier_id: '',
        total_amount: 0,
        tax_amount: 0,
        grand_total: 0,
        purchase_invoice_goods_receipts: [] as {
            goods_receipt_id: number;
            purchase_invoice_details: {
                goods_receipt_detail_id: number;
                quantity: number;
                unit_price: number;
                total_price: number;
                total_amount?: number;
                tax_amount?: number;
            }[];
        }[],
    });

    const displayQuantityWithWholesale = (detail: GoodsReceiptDetail) => {
        const item = detail.purchase_order_detail.item;

        if (item.item_wholesale_unit && item.wholesale_unit_conversion) {
            const quantity = parseFloat(detail.received_quantity as string);
            const conversion = parseFloat(item.wholesale_unit_conversion as string);
            const standardEquivalent = quantity * conversion;
            const standardUnit = item.item_unit.abbreviation;
            const wholesaleUnit = item.item_wholesale_unit.abbreviation;

            const formattedStandardEquivalent =
                Math.floor(standardEquivalent) === standardEquivalent ? standardEquivalent.toString() : standardEquivalent.toFixed(2);

            return (
                <>
                    {formatDecimal(quantity)} {wholesaleUnit}
                    <span className="block text-xs text-gray-500">
                        (= {formattedStandardEquivalent} {standardUnit})
                    </span>
                </>
            );
        }

        return (
            <>
                {formatDecimal(detail.received_quantity)} {item.item_unit.abbreviation}
            </>
        );
    };

    const displayPriceWithWholesale = (detail: GoodsReceiptDetail) => {
        const item = detail.purchase_order_detail.item;

        if (item.item_wholesale_unit && item.wholesale_unit_conversion) {
            const pricePerUnit = parseFloat(detail.price_per_unit as string);

            return <>{formatCurrency(pricePerUnit)}</>;
        }

        return formatCurrency(detail.price_per_unit);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const filteredGoodsReceipts = data.purchase_invoice_goods_receipts.filter((receipt) => receipt.purchase_invoice_details.length > 0);

        const submitData = {
            ...data,
            purchase_invoice_goods_receipt: filteredGoodsReceipts,
        };

        post(route('procurement.invoices.store', submitData), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        return format(date, 'dd MMM yyyy');
    };

    const fetchNotInvoicedGoodsReceipts = useCallback(
        async (supplierId: string) => {
            if (!supplierId) return;

            setLoading(true);
            try {
                const response = await fetch(
                    route('procurement.invoices.getNotInvoicedGoodsReceipts', {
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
                    latestGoodsReceiptsRef.current = data;

                    setNotInvoicedGoodsReceipts(data);

                    setSelectedGoodsReceipt('');
                    setGoodsReceiptDetails([]);
                    setSelectedDetails({});

                    setData((prevData) => ({
                        ...prevData,
                        purchase_invoice_goods_receipts: [],
                    }));

                    calculateTotals([]);
                } else {
                    console.error('Unexpected response format:', data);
                    showErrorToast(['Invalid response format']);
                }
            } catch (error) {
                console.error('Error fetching non-invoiced goods receipts:', error);
                showErrorToast([(error as Error).message]);
            } finally {
                setLoading(false);
            }
        },
        [setData, showErrorToast],
    );

    const fetchGoodsReceiptDetails = useCallback(
        async (goodsReceiptId: string) => {
            if (!goodsReceiptId) return;

            setLoading(true);
            try {
                const response = await fetch(
                    route('procurement.invoices.getGoodsReceiptData', {
                        goods_receipt_id: goodsReceiptId,
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

                if (responseData && responseData.goods_receipt_details && Array.isArray(responseData.goods_receipt_details)) {
                    setGoodsReceiptDetails((prevDetails) => {
                        const existingIds = new Set(prevDetails.map((d) => d.id));

                        const newDetails = responseData.goods_receipt_details.filter((d) => !existingIds.has(d.id));

                        return [...prevDetails, ...newDetails];
                    });

                    setSelectedDetails((prev) => {
                        const initialSelection = { ...prev };
                        responseData.goods_receipt_details.forEach((detail) => {
                            if (initialSelection[detail.id] === undefined) {
                                initialSelection[detail.id] = false;
                            }
                        });
                        return initialSelection;
                    });
                } else {
                    console.error('Unexpected response format:', responseData);
                    showErrorToast(['Invalid response format']);
                }
            } catch (error) {
                console.error('Error fetching goods receipt details:', error);
                showErrorToast([(error as Error).message]);
            } finally {
                setLoading(false);
            }
        },
        [showErrorToast],
    );

    const getDetailsForSelectedReceipt = () => {
        if (!selectedGoodsReceipt) return [];

        const selectedReceiptId = parseInt(selectedGoodsReceipt);

        return goodsReceiptDetails.filter(
            (detail) => detail.goods_receipt_purchase_order && detail.goods_receipt_purchase_order.goods_receipt_id === selectedReceiptId,
        );
    };

    useEffect(() => {
        if (data.purchase_invoice_goods_receipts.length > 0 && goodsReceiptDetails.length > 0) {
            setData((prevData) => ({ ...prevData }));
        }
    }, [goodsReceiptDetails]);

    const handleSupplierChange = (supplierId: string) => {
        setData((prevData) => ({
            ...prevData,
            supplier_id: supplierId,
        }));

        fetchNotInvoicedGoodsReceipts(supplierId);
    };

    useEffect(() => {
        if (data.supplier_id) {
            fetchNotInvoicedGoodsReceipts(data.supplier_id);
        }
    }, []);

    const calculateTotals = (goodsReceipts) => {
        setCalculatingTotals(true);
        try {
            // First calculate total with tax included (for grand total)
            const totalWithTax = goodsReceipts.reduce(
                (sum, receipt) =>
                    sum +
                    receipt.purchase_invoice_details.reduce((detailSum, detail) => {
                        // Use total_price + tax_amount for the total
                        const detailTotal = detail.total_price + (detail.tax_amount || 0);
                        return detailSum + detailTotal;
                    }, 0),
                0,
            );

            // Calculate tax amount separately
            const taxAmount = goodsReceipts.reduce(
                (sum, receipt) => sum + receipt.purchase_invoice_details.reduce((detailSum, detail) => detailSum + (detail.tax_amount || 0), 0),
                0,
            );

            // Calculate subtotal as total - tax (for display in the left sidebar)
            const subtotalBeforeTax = totalWithTax - taxAmount;

            setData((prevData) => ({
                ...prevData,
                total_amount: subtotalBeforeTax, // This will be used in the left sidebar as "Subtotal"
                tax_amount: taxAmount,
                grand_total: totalWithTax, // Grand total remains the same (includes tax)
            }));
        } finally {
            setCalculatingTotals(false);
        }
    };

    const handleSelectedGoodsReceiptChange = async (goodsReceiptId: string) => {
        setSelectedGoodsReceipt(goodsReceiptId);
        await fetchGoodsReceiptDetails(goodsReceiptId);
    };

    const addAllDetailsToInvoice = () => {
        const selectedReceiptDetails = getDetailsForSelectedReceipt();

        if (selectedReceiptDetails.length === 0) {
            showErrorToast(['No items available to add']);
            return;
        }

        const goodsReceiptId = parseInt(selectedGoodsReceipt);

        let receiptIndex = data.purchase_invoice_goods_receipts.findIndex((receipt) => receipt.goods_receipt_id === goodsReceiptId);

        const updatedGoodsReceipts = [...data.purchase_invoice_goods_receipts];
        if (receiptIndex === -1) {
            updatedGoodsReceipts.push({
                goods_receipt_id: goodsReceiptId,
                purchase_invoice_details: [],
            });
            receiptIndex = updatedGoodsReceipts.length - 1;
        }

        const currentDetails = updatedGoodsReceipts[receiptIndex].purchase_invoice_details;

        const newDetails = selectedReceiptDetails
            .filter((detail) => !isDetailInInvoice(detail.id))
            .map((detail) => {
                const totalPrice = Number(detail.total_price);
                const taxAmount = Number(detail.tax_amount || 0);
                const totalWithTax = totalPrice + taxAmount;

                return {
                    goods_receipt_detail_id: detail.id,
                    quantity: Number(detail.received_quantity),
                    unit_price: Number(detail.price_per_unit),
                    total_price: totalPrice,
                    total_amount: totalWithTax,
                    tax_amount: taxAmount,
                };
            });

        updatedGoodsReceipts[receiptIndex].purchase_invoice_details = [...currentDetails, ...newDetails];

        setData((prevData) => ({
            ...prevData,
            purchase_invoice_goods_receipts: updatedGoodsReceipts,
        }));

        calculateTotals(updatedGoodsReceipts);
        setSelectedGoodsReceipt('');
    };

    const getInvoiceItems = () => {
        const fetchAllGoodsReceiptDetails = async () => {
            const goodsReceiptIds = new Set(data.purchase_invoice_goods_receipts.map((receipt) => receipt.goods_receipt_id));

            for (const goodsReceiptId of goodsReceiptIds) {
                const hasDetails = goodsReceiptDetails.some(
                    (detail) => detail.goods_receipt_purchase_order && detail.goods_receipt_purchase_order.goods_receipt_id === goodsReceiptId,
                );

                if (!hasDetails) {
                    await fetchGoodsReceiptDetails(goodsReceiptId.toString());
                }
            }
        };

        fetchAllGoodsReceiptDetails();

        const goodsReceiptDetailsMap = goodsReceiptDetails.reduce((map, detail) => {
            map[detail.id] = detail;
            return map;
        }, {});

        const receiptsMap = {};
        notInvoicedGoodsReceipts.forEach((receipt) => {
            receiptsMap[receipt.id] = receipt;
        });
        latestGoodsReceiptsRef.current.forEach((receipt) => {
            receiptsMap[receipt.id] = receipt;
        });

        return data.purchase_invoice_goods_receipts.flatMap((receipt, receiptIndex) =>
            receipt.purchase_invoice_details.map((detail, detailIndex) => {
                const fullDetail = goodsReceiptDetailsMap[detail.goods_receipt_detail_id];
                const receiptInfo = receiptsMap[receipt.goods_receipt_id];

                return {
                    ...detail,
                    receiptIndex,
                    detailIndex,
                    goods_receipt_code: receiptInfo ? receiptInfo.code : 'Unknown',
                    goods_receipt_id: receipt.goods_receipt_id,
                    item_name: fullDetail ? fullDetail.purchase_order_detail.item.name : 'Unknown',
                    item_code: fullDetail ? fullDetail.purchase_order_detail.item.code : 'Unknown',
                    item_unit: fullDetail ? fullDetail.purchase_order_detail.item.item_unit.abbreviation : '',
                    item_wholesale_unit:
                        fullDetail && fullDetail.purchase_order_detail.item.item_wholesale_unit
                            ? fullDetail.purchase_order_detail.item.item_wholesale_unit.abbreviation
                            : null,
                    wholesale_unit_conversion:
                        fullDetail && fullDetail.purchase_order_detail.item.wholesale_unit_conversion
                            ? fullDetail.purchase_order_detail.item.wholesale_unit_conversion
                            : null,
                    tax_amount: detail.tax_amount || (fullDetail ? fullDetail.tax_amount : 0),
                    total_amount: detail.total_amount || (fullDetail ? fullDetail.total_amount : detail.total_price),
                    fullDetail, // Include the full detail for wholesale calculations
                };
            }),
        );
    };

    // Function to display item quantity in the invoice items table
    const displayInvoiceItemQuantity = (item) => {
        if (
            item.fullDetail &&
            item.fullDetail.purchase_order_detail.item.item_wholesale_unit &&
            item.fullDetail.purchase_order_detail.item.wholesale_unit_conversion
        ) {
            const item_detail = item.fullDetail.purchase_order_detail.item;
            const quantity = parseFloat(item.quantity);
            const conversion = parseFloat(item_detail.wholesale_unit_conversion);
            const standardEquivalent = quantity * conversion;

            // Format standard equivalent
            const formattedStandardEquivalent =
                Math.floor(standardEquivalent) === standardEquivalent ? standardEquivalent.toString() : standardEquivalent.toFixed(2);

            return (
                <>
                    {formatDecimal(quantity)} {item_detail.item_wholesale_unit.abbreviation}
                    <span className="block text-xs text-gray-500">
                        (= {formattedStandardEquivalent} {item.item_unit})
                    </span>
                </>
            );
        }

        return `${formatDecimal(item.quantity)} ${item.item_unit}`;
    };

    // Function to display item price in the invoice items table
    const displayInvoiceItemPrice = (item) => {
        if (
            item.fullDetail &&
            item.fullDetail.purchase_order_detail.item.item_wholesale_unit &&
            item.fullDetail.purchase_order_detail.item.wholesale_unit_conversion
        ) {
            const item_detail = item.fullDetail.purchase_order_detail.item;
            const unitPrice = parseFloat(item.unit_price);

            return <>{formatCurrency(unitPrice)}</>;
        }

        return formatCurrency(item.unit_price);
    };

    const removeReceiptFromInvoice = (receiptIndex: number) => {
        const updatedGoodsReceipts = [...data.purchase_invoice_goods_receipts];

        updatedGoodsReceipts.splice(receiptIndex, 1);

        setData((prevData) => ({
            ...prevData,
            purchase_invoice_goods_receipts: updatedGoodsReceipts,
        }));

        calculateTotals(updatedGoodsReceipts);
    };

    const getGroupedInvoiceItems = () => {
        const items = getInvoiceItems();

        const groupedItems = {};

        items.forEach((item) => {
            const receiptId = item.goods_receipt_id;
            const receiptIndex = item.receiptIndex;
            const receiptCode = item.goods_receipt_code;

            if (!groupedItems[receiptId]) {
                groupedItems[receiptId] = {
                    receiptId,
                    receiptIndex,
                    receiptCode,
                    items: [],
                };
            }

            groupedItems[receiptId].items.push(item);
        });

        return Object.values(groupedItems);
    };

    const isDetailInInvoice = (detailId: number) => {
        return data.purchase_invoice_goods_receipts.some((receipt) =>
            receipt.purchase_invoice_details.some((detail) => detail.goods_receipt_detail_id === detailId),
        );
    };

    const isReceiptInInvoice = (receiptId: number): boolean => {
        return data.purchase_invoice_goods_receipts.some((receipt) => receipt.goods_receipt_id === receiptId);
    };

    const getAvailableGoodsReceipts = () => {
        const availableReceipts = receiptsToDisplay.filter((receipt) => !isReceiptInInvoice(receipt.id));

        return availableReceipts.sort((a, b) => a.id - b.id);
    };

    const hasItemsToInvoice = data.purchase_invoice_goods_receipts.length > 0 && data.grand_total > 0;
    const canSubmit = data.code && data.supplier_id && data.date && data.due_date && hasItemsToInvoice;

    const receiptsToDisplay = notInvoicedGoodsReceipts.length > 0 ? notInvoicedGoodsReceipts : latestGoodsReceiptsRef.current;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Supplier Invoice" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Supplier Invoice" description="Create a new supplier invoice from goods receipts." />
                    <div className="flex gap-3">
                        <Link href={route('procurement.invoices.index')}>
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
                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="code">
                                                Invoice Code <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="code"
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value)}
                                                placeholder="Enter invoice code"
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
                                                        {data.due_date ? format(data.due_date, 'PPP') : <span>Select due date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={data.due_date}
                                                        onSelect={(date) => date && setData('due_date', date)}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {errors.due_date && <p className="mt-1 text-xs text-red-500">{errors.due_date}</p>}
                                        </div>

                                        <div className="mt-4 space-y-3 border-t pt-4">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Subtotal:</span>
                                                <span className="font-medium">{formatCurrency(data.total_amount)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Tax Amount:</span>
                                                <span className="font-medium">{formatCurrency(data.tax_amount)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-3">
                                                <span className="font-semibold">Total:</span>
                                                <span className="font-semibold">{formatCurrency(data.grand_total)}</span>
                                            </div>
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
                                        <p className="text-sm text-gray-500">Select goods receipts and items to include in this invoice</p>
                                    </div>

                                    {/* Item Selection Section */}
                                    {data.supplier_id && (
                                        <div className="mb-6 space-y-4">
                                            {loading ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                                    <span className="ml-2 text-gray-500">Loading...</span>
                                                </div>
                                            ) : receiptsToDisplay.length === 0 ? (
                                                <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center text-gray-500">
                                                    No pending goods receipts found for this supplier.
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="goods_receipt">Goods Receipt</Label>
                                                        <Combobox
                                                            value={selectedGoodsReceipt ? selectedGoodsReceipt.toString() : ''}
                                                            onValueChange={handleSelectedGoodsReceiptChange}
                                                            options={getAvailableGoodsReceipts().map((receipt) => ({
                                                                value: receipt.id.toString(),
                                                                label: `${receipt.code} (${formatDate(receipt.date)})`,
                                                            }))}
                                                            placeholder="Select goods receipt"
                                                            searchPlaceholder="Search goods receipts..."
                                                            initialDisplayCount={5}
                                                        />
                                                        {getAvailableGoodsReceipts().length === 0 &&
                                                            data.supplier_id &&
                                                            receiptsToDisplay.length > 0 && (
                                                                <p className="mt-2 text-sm text-amber-600">
                                                                    All available goods receipts have been added to this invoice.
                                                                </p>
                                                            )}
                                                    </div>

                                                    {/* Items from Selected Goods Receipt */}
                                                    {selectedGoodsReceipt && (
                                                        <div className="rounded-md border p-4">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <h3 className="font-medium">Items from Selected Receipt</h3>
                                                                <Button
                                                                    type="button"
                                                                    onClick={addAllDetailsToInvoice}
                                                                    size="sm"
                                                                    disabled={
                                                                        goodsReceiptDetails.length === 0 ||
                                                                        goodsReceiptDetails.every((detail) => isDetailInInvoice(detail.id))
                                                                    }
                                                                >
                                                                    <Plus className="mr-1 h-4 w-4" /> Add
                                                                </Button>
                                                            </div>

                                                            <div className="max-h-[400px] overflow-y-auto">
                                                                <table className="w-full border-collapse text-sm">
                                                                    <thead>
                                                                        <tr className="border-b">
                                                                            <th className="px-2 py-2 text-left">Item</th>
                                                                            <th className="px-2 py-2 text-center">Quantity</th>
                                                                            <th className="px-2 py-2 text-right">Unit Price</th>
                                                                            <th className="px-2 py-2 text-right">Tax Amount</th>
                                                                            <th className="px-2 py-2 text-right">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {getDetailsForSelectedReceipt().map((detail) => {
                                                                            const isInInvoice = isDetailInInvoice(detail.id);
                                                                            const totalWithTax =
                                                                                Number(detail.total_price) + Number(detail.tax_amount || 0);
                                                                            return (
                                                                                <tr
                                                                                    key={detail.id}
                                                                                    className={`border-b ${isInInvoice ? 'bg-green-50' : ''}`}
                                                                                >
                                                                                    <td className="px-2 py-2">
                                                                                        {detail.purchase_order_detail.item.name} (
                                                                                        {detail.purchase_order_detail.item.code})
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        {displayQuantityWithWholesale(detail)}
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-right">
                                                                                        {displayPriceWithWholesale(detail)}
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-right">
                                                                                        {formatCurrency(detail.tax_amount || 0)}
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-right">
                                                                                        {formatCurrency(totalWithTax)}
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

                                    {/* Items to be Invoiced Summary */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Items to be Invoiced</h3>

                                        {getInvoiceItems().length === 0 ? (
                                            <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                                                No items added yet. Use the selection panel above to add items.
                                            </div>
                                        ) : (
                                            <div className="max-h-[380px] overflow-y-auto rounded-md border p-4">
                                                {getGroupedInvoiceItems().map((group) => (
                                                    <div key={group.receiptId} className="mb-4 last:mb-0">
                                                        <div className="mb-2 flex items-center justify-between bg-gray-50 p-2">
                                                            <h4 className="text-sm font-medium">Goods Receipt: {group.receiptCode}</h4>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeReceiptFromInvoice(group.receiptIndex)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>

                                                        <table className="w-full border-collapse text-sm">
                                                            <thead>
                                                                <tr className="border-b">
                                                                    <th className="px-2 py-2 text-left">Item</th>
                                                                    <th className="px-2 py-2 text-center">Quantity</th>
                                                                    <th className="px-2 py-2 text-right">Unit Price</th>
                                                                    <th className="px-2 py-2 text-right">Tax Amount</th>
                                                                    <th className="px-2 py-2 text-right">Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.items.map((item) => {
                                                                    const totalWithTax = Number(item.total_price) + Number(item.tax_amount || 0);
                                                                    return (
                                                                        <tr key={item.goods_receipt_detail_id} className="border-b">
                                                                            <td className="px-2 py-2">
                                                                                {item.item_name} ({item.item_code})
                                                                            </td>
                                                                            <td className="px-2 py-2 text-center">
                                                                                {displayInvoiceItemQuantity(item)}
                                                                            </td>
                                                                            <td className="px-2 py-2 text-right">{displayInvoiceItemPrice(item)}</td>
                                                                            <td className="px-2 py-2 text-right">
                                                                                {formatCurrency(item.tax_amount || 0)}
                                                                            </td>
                                                                            <td className="px-2 py-2 text-right">{formatCurrency(totalWithTax)}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                                <tr className="bg-gray-50 font-medium">
                                                                    <td colSpan={4} className="px-2 py-2 text-right">
                                                                        Subtotal:
                                                                    </td>
                                                                    <td className="px-2 py-2 text-right">
                                                                        {formatCurrency(
                                                                            group.items.reduce(
                                                                                (sum, item) =>
                                                                                    sum + Number(item.total_price) + Number(item.tax_amount || 0),
                                                                                0,
                                                                            ),
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="sticky bottom-0 mt-6 border-t bg-white pt-4 pb-2">
                        <div className="flex items-center justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => router.visit(route('procurement.invoices.index'))}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || !canSubmit} className="px-8">
                                {processing ? 'Processing...' : 'Create Invoice'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
