import { DataTable } from '@/components/data-table';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, FileEdit } from 'lucide-react';

interface Supplier {
    id: number;
    name: string;
}

interface TaxRate {
    id: number;
    name?: string;
    rate: number;
}

interface PurchaseOrder {
    id: number;
    code: string;
}

interface ItemUnit {
    id: number;
    name: string;
    abbreviation: string;
    created_at: string;
    updated_at: string;
    deleted_at: null | string;
}

interface Item {
    id: number;
    name: string;
    code: string;
    item_category_id: number;
    item_unit_id: number;
    price: string;
    created_at: string;
    updated_at: string;
    deleted_at: null | string;
    item_unit?: ItemUnit;
}

interface PurchaseOrderDetail {
    id: number;
    purchase_order_id: number;
    item_id: number;
    quantity: string;
    unit_price: string;
    total_price: string;
    created_at: string;
    updated_at: string;
    item: Item;
    purchase_order?: PurchaseOrder;
}

interface GoodsReceiptPurchaseOrder {
    id: number;
    goods_receipt_id: number;
    purchase_order_id: number;
    created_at: string;
    updated_at: string;
    purchase_order: PurchaseOrder;
}

interface GoodsReceiptDetail {
    id: number;
    goods_receipt_purchase_order_id: number;
    purchase_order_detail_id: number;
    received_quantity: string;
    price_per_unit: string;
    total_price: string;
    cogs: string;
    created_at: string;
    updated_at: string;
    laravel_through_key: number;
    purchase_order_detail: PurchaseOrderDetail;
    goods_receipt_purchase_order?: GoodsReceiptPurchaseOrder;
}

interface GoodsReceipt {
    id: number;
    code: string;
    date: string;
    supplier_id: number;
    received_by: string;
    status: string;
    created_at: string;
    updated_at: string;
    pivot?: {
        purchase_invoice_id: number;
        goods_receipt_id: number;
        created_at: string;
        updated_at: string;
    };
    goods_receipt_details: GoodsReceiptDetail[];
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface PurchaseInvoicePayment {
    id: number;
    code: string;
    date: string;
    user_id: number;
    purchase_invoice_id: number;
    payment_method_id: number;
    amount: string;
    created_at: string;
    updated_at: string;
    payment_method?: PaymentMethod;
    user?: User;
}

interface PurchaseInvoiceProps {
    purchaseInvoice: {
        id: number;
        code: string;
        date: string;
        due_date: string;
        supplier_id: number;
        total_amount: string;
        tax_rate_id: number | null;
        tax_amount: string;
        grand_total: string;
        status: string;
        remaining_amount: string;
        created_at: string;
        updated_at: string;
        supplier: Supplier;
        tax_rate: TaxRate | null;
        goods_receipts: GoodsReceipt[];
        purchase_invoice_payments?: PurchaseInvoicePayment[];
    };
}

export default function Show({ purchaseInvoice }: PurchaseInvoiceProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Procurement',
            href: '#',
        },
        {
            title: 'Invoice',
            href: route('procurement.invoice.index'),
        },
        {
            title: purchaseInvoice.code,
            href: route('procurement.invoice.show', purchaseInvoice.id),
        },
    ];

    const formatCurrency = (value: string | number): string => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        const rounded = Math.round(numValue * 100) / 100;

        const parts = rounded.toString().split('.');

        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        if (parts.length > 1 && parts[1] !== '00' && parseInt(parts[1]) !== 0) {
            return 'Rp ' + parts[0] + ',' + (parts[1].length === 1 ? parts[1] + '0' : parts[1]);
        }

        return 'Rp ' + parts[0];
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

    const allInvoiceItems = purchaseInvoice.goods_receipts.flatMap((receipt) =>
        receipt.goods_receipt_details.map((detail) => ({
            ...detail,
            goods_receipt_code: receipt.code,
            goods_receipt_id: receipt.id,
        })),
    );

    const columns: ColumnDef<any>[] = [
        createNumberColumn<any>(),
        {
            accessorKey: 'goods_receipt_code',
            header: 'Receipt Number',
            cell: ({ row }) => row.original.goods_receipt_code || '-',
        },
        {
            accessorKey: 'purchase_order_detail.purchase_order.code',
            header: 'PO Number',
            cell: ({ row }) => {
                const poDetail = row.original.purchase_order_detail;
                return poDetail && poDetail.purchase_order ? poDetail.purchase_order.code : '-';
            },
        },
        {
            accessorKey: 'purchase_order_detail.item.name',
            header: 'Item Name',
            cell: ({ row }) => {
                const detail = row.original;
                const item = detail.purchase_order_detail?.item;
                return item ? `${item.name} (${item.code})` : `Item #${detail.purchase_order_detail_id}`;
            },
        },
        {
            accessorKey: 'received_quantity',
            header: 'Quantity',
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue('received_quantity'));
                const formattedQty = formatDecimal(qty);
                const unit = row.original.purchase_order_detail?.item?.item_unit?.abbreviation || '';
                return `${formattedQty} ${unit}`;
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'price_per_unit',
            header: 'Unit Price',
            cell: ({ row }) => {
                return formatCurrency(row.getValue('price_per_unit'));
            },
            meta: {
                className: 'text-right',
            },
        },
        {
            accessorKey: 'total_price',
            header: 'Total Price',
            cell: ({ row }) => {
                return formatCurrency(row.getValue('total_price'));
            },
            meta: {
                className: 'text-right font-medium',
            },
        },
    ];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    };

    const detailsByReceipt = purchaseInvoice.goods_receipts.reduce(
        (acc, receipt) => {
            const receiptTotal = receipt.goods_receipt_details.reduce((sum, detail) => sum + parseFloat(detail.total_price), 0);

            acc[receipt.code] = {
                id: receipt.id,
                code: receipt.code,
                date: receipt.date,
                total: receiptTotal,
                details: receipt.goods_receipt_details,
            };

            return acc;
        },
        {} as Record<
            string,
            {
                id: number;
                code: string;
                date: string;
                total: number;
                details: GoodsReceiptDetail[];
            }
        >,
    );

    const getStatusBadge = (status: string) => {
        let variant = 'outline';
        let classes = '';
        let label = '';

        switch (status.toLowerCase()) {
            case 'unpaid':
                variant = 'outline';
                classes = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200';
                label = 'Unpaid';
                break;
            case 'paid':
                variant = 'outline';
                classes = 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
                label = 'Paid';
                break;
            case 'partially_paid':
                variant = 'outline';
                classes = 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
                label = 'Partially Paid';
                break;
            default:
                label = status.charAt(0).toUpperCase() + status.slice(1);
        }

        return (
            <Badge variant={variant as never} className={classes}>
                {label}
            </Badge>
        );
    };

    const receiptCount = purchaseInvoice.goods_receipts.length;
    const itemCount = allInvoiceItems.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Supplier Invoice: ${purchaseInvoice.code}`} />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Supplier Invoice" description="Invoice details and items" />
                    <div className="flex gap-3">
                        {purchaseInvoice.status == 'unpaid' && (
                            <Link href={route('procurement.invoice.edit', purchaseInvoice.id)}>
                                <Button className="flex items-center gap-2">
                                    <FileEdit className="h-4 w-4" /> Edit
                                </Button>
                            </Link>
                        )}
                        <Link href={route('procurement.invoice.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <Card className="border-0 shadow-sm">
                            <div className="p-6">
                                <h2 className="mb-4 text-base font-semibold text-gray-900">Invoice Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Invoice Code</h3>
                                            <p className="mt-1 text-sm text-gray-900">{purchaseInvoice.code}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                            <p className="mt-1 text-sm text-gray-900">{getStatusBadge(purchaseInvoice.status)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Invoice Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(purchaseInvoice.date)}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(purchaseInvoice.due_date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
                                            <p className="mt-1 text-sm text-gray-900">{purchaseInvoice.supplier.name}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Goods Receipts</h3>
                                            <div className="mt-1">
                                                <Badge variant="secondary">
                                                    {receiptCount} {receiptCount === 1 ? 'Receipt' : 'Receipts'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Invoice Summary</h3>
                                        <div className="space-y-2">
                                            {Object.entries(detailsByReceipt).map(([receiptCode, receipt]) => (
                                                <div className="flex justify-between" key={receiptCode}>
                                                    <span className="text-sm text-gray-600">Receipt: {receipt.code}</span>
                                                    <span className="text-sm font-medium">{formatCurrency(receipt.total)}</span>
                                                </div>
                                            ))}

                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Subtotal</span>
                                                <span className="text-sm font-medium">{formatCurrency(purchaseInvoice.total_amount)}</span>
                                            </div>

                                            {purchaseInvoice.tax_rate ? (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Tax ({purchaseInvoice.tax_rate.rate}%)</span>
                                                    <span className="text-sm font-medium">{formatCurrency(purchaseInvoice.tax_amount)}</span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Tax (0%)</span>
                                                    <span className="text-sm font-medium">{formatCurrency(purchaseInvoice.tax_amount)}</span>
                                                </div>
                                            )}

                                            <div className="mt-2 flex justify-between border-t pt-2">
                                                <span className="font-medium">Grand Total</span>
                                                <span className="font-bold text-gray-900">{formatCurrency(purchaseInvoice.grand_total)}</span>
                                            </div>

                                            {purchaseInvoice.status !== 'paid' && (
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-600">Remaining Amount</span>
                                                    <span className="font-medium text-gray-900">
                                                        {formatCurrency(purchaseInvoice.remaining_amount)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        {/* Payment History section moved above Invoice Items */}
                        {purchaseInvoice.purchase_invoice_payments && purchaseInvoice.purchase_invoice_payments.length > 0 && (
                            <Card className="mb-6 border-0 shadow-sm">
                                <div className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-gray-900">Payment History</h2>
                                        <Badge variant="outline" className="border-green-100 bg-green-50 text-green-700">
                                            {purchaseInvoice.purchase_invoice_payments.length}{' '}
                                            {purchaseInvoice.purchase_invoice_payments.length === 1 ? 'Payment' : 'Payments'}
                                        </Badge>
                                    </div>

                                    <div className="overflow-hidden rounded-md border">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Payment Code
                                                    </th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Date
                                                    </th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Method
                                                    </th>
                                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Processed By
                                                    </th>
                                                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {purchaseInvoice.purchase_invoice_payments.map((payment) => (
                                                    <tr key={payment.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
                                                            {payment.code}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-500">
                                                            {formatDate(payment.date)}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-500">
                                                            {payment.payment_method?.name || 'Cash'}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-500">
                                                            {payment.user?.name || 'System User'}
                                                        </td>
                                                        <td className="px-4 py-2 text-right text-sm font-medium whitespace-nowrap">
                                                            {formatCurrency(payment.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-green-50">
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-4 py-2 text-right text-sm font-semibold whitespace-nowrap text-gray-900"
                                                    >
                                                        Total Paid:
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm font-semibold whitespace-nowrap text-green-700">
                                                        {formatCurrency(
                                                            purchaseInvoice.purchase_invoice_payments.reduce(
                                                                (sum, payment) => sum + parseFloat(payment.amount),
                                                                0,
                                                            ),
                                                        )}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </Card>
                        )}

                        <Card className="border-0 shadow-sm">
                            <div className="p-6">
                                <div className="mb-4 flex items-center">
                                    <h2 className="text-base font-semibold text-gray-900">Invoice Items</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {itemCount} items
                                    </Badge>
                                </div>

                                {allInvoiceItems.length > 0 ? (
                                    <DataTable data={allInvoiceItems} columns={columns} pageSize={6} />
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No items found in this invoice</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
