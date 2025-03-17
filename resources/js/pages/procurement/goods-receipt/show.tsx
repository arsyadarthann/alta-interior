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
import { ArrowLeft } from 'lucide-react';

interface Supplier {
    id: number;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
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
    goods_receipt_purchase_order: GoodsReceiptPurchaseOrder;
}

interface GoodsReceiptProps {
    goodsReceipt: {
        id: number;
        code: string;
        date: string;
        supplier_id: number;
        received_by: string;
        status: string;
        created_at: string;
        updated_at: string;
        supplier: Supplier;
        goods_receipt_details: GoodsReceiptDetail[];
    };
}

export default function Show({ goodsReceipt }: GoodsReceiptProps) {
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
            title: goodsReceipt.code,
            href: route('procurement.receipt.show', goodsReceipt.id),
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

        // Check if the value is a whole number
        if (Number.isInteger(numValue)) {
            return numValue.toString();
        }

        // Otherwise, display with up to 2 decimal places
        return numValue.toFixed(2).replace(/\.?0+$/, '');
    };

    const columns: ColumnDef<GoodsReceiptDetail>[] = [
        createNumberColumn<GoodsReceiptDetail>(),
        {
            accessorKey: 'purchase_order_detail.item.name',
            header: 'Item Name',
            cell: ({ row }) => {
                const detail = row.original;
                // Get item from purchase_order_detail
                const item = detail.purchase_order_detail?.item;
                return item ? `${item.name} (${item.code})` : `Item #${detail.purchase_order_detail_id}`;
            },
        },
        {
            accessorKey: 'goods_receipt_purchase_order.purchase_order.code',
            header: 'PO Number',
            cell: ({ row }) => {
                return row.original.goods_receipt_purchase_order?.purchase_order?.code || '-';
            },
        },
        {
            accessorKey: 'received_quantity',
            header: 'Received Qty',
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

    // Calculate total values
    const totalAmount = goodsReceipt.goods_receipt_details.reduce((sum, detail) => sum + parseFloat(detail.total_price), 0);

    // Group details by purchase order
    const detailsByPO = goodsReceipt.goods_receipt_details.reduce(
        (acc, detail) => {
            const poCode = detail.goods_receipt_purchase_order?.purchase_order?.code;
            if (!poCode) return acc;

            if (!acc[poCode]) {
                acc[poCode] = [];
            }

            acc[poCode].push(detail);
            return acc;
        },
        {} as Record<string, GoodsReceiptDetail[]>,
    );

    const getStatusBadge = (status: string) => {
        let variant = 'outline';
        let classes = '';
        let label = '';

        switch (status) {
            case 'not_invoiced':
                variant = 'outline';
                classes = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200';
                label = 'Not Invoiced';
                break;
            case 'invoiced':
                variant = 'outline';
                classes = 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
                label = 'Invoiced';
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

    const purchaseOrderCount = Object.keys(detailsByPO).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Goods Receipt: ${goodsReceipt.code}`} />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Goods Receipt" description="Goods receipt details and received items" />
                    <div className="flex gap-3">
                        <Link href={route('procurement.receipt.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <Card className="h-full border-0 shadow-sm">
                            <div className="p-6">
                                <h2 className="mb-4 text-base font-semibold text-gray-900">Receipt Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Receipt Code</h3>
                                            <p className="mt-1 text-sm text-gray-900">{goodsReceipt.code}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                            <p className="mt-1 text-sm text-gray-900">{getStatusBadge(goodsReceipt.status)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Receipt Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(goodsReceipt.date)}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Received By</h3>
                                            <p className="mt-1 text-sm text-gray-900">{goodsReceipt.received_by}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
                                            <p className="mt-1 text-sm text-gray-900">{goodsReceipt.supplier.name}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Purchase Orders</h3>
                                            <div className="mt-1">
                                                <Badge variant="secondary">
                                                    {purchaseOrderCount} {purchaseOrderCount === 1 ? 'PO' : 'POs'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Receipt Summary</h3>
                                        <div className="space-y-2">
                                            {Object.entries(detailsByPO).map(([poCode, details]) => {
                                                const poTotal = details.reduce((sum, detail) => sum + parseFloat(detail.total_price), 0);
                                                return (
                                                    <div className="flex justify-between" key={poCode}>
                                                        <span className="text-sm text-gray-600">PO: {poCode}</span>
                                                        <span className="text-sm font-medium">{formatCurrency(poTotal)}</span>
                                                    </div>
                                                );
                                            })}
                                            <div className="mt-2 flex justify-between border-t pt-2">
                                                <span className="font-medium">Total Amount</span>
                                                <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card className="h-full border-0 shadow-sm">
                            <div className="p-6">
                                <div className="mb-4 flex items-center">
                                    <h2 className="text-base font-semibold text-gray-900">Received Items</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {goodsReceipt.goods_receipt_details.length} items
                                    </Badge>
                                </div>

                                {goodsReceipt.goods_receipt_details.length > 0 ? (
                                    <DataTable data={goodsReceipt.goods_receipt_details} columns={columns} pageSize={10} />
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No items found in this receipt</p>
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
