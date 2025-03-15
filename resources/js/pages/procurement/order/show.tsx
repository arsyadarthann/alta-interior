import { DataTable } from '@/components/data-table';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Edit } from 'lucide-react';

interface ItemUnit {
    id: number;
    abbreviation: string;
    name: string;
}

interface ItemCategory {
    id: number;
    name: string;
}

interface OrderDetail {
    id: number;
    purchase_order_id: number;
    item_id: number;
    quantity: number | string;
    unit_price: number;
    total_price: number;
    item: {
        id: number;
        name: string;
        code: string;
        item_category_id: number;
        item_unit_id: number;
        item_category: ItemCategory;
        item_unit: ItemUnit;
    };
}

interface TaxRate {
    id: number;
    rate: number;
}

interface PurchaseOrderProps {
    purchaseOrder: {
        id: number;
        code: string;
        date: string;
        branch_id: number;
        supplier_id: number;
        expected_delivery_date: string;
        status: string;
        total_amount: number;
        tax_rate_id: number | null;
        tax_amount: number;
        grand_total: number;
        branch: {
            id: number;
            name: string;
        };
        supplier: {
            id: number;
            name: string;
        };
        tax_rate: TaxRate | null;
        user: {
            id: number;
            name: string;
        };
        purchase_order_details: OrderDetail[];
    };
}

export default function Show({ purchaseOrder }: PurchaseOrderProps) {
    const { hasPermission } = usePermissions();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Procurement',
            href: '#',
        },
        {
            title: 'Purchase Order',
            href: route('procurement.order.index'),
        },
        {
            title: purchaseOrder.code,
            href: route('procurement.order.show', purchaseOrder.id),
        },
    ];

    const handleEdit = () => {
        router.visit(route('procurement.order.edit', purchaseOrder.id));
    };

    const formatCurrency = (value: number): string => {
        const rounded = Math.round(value * 100) / 100;

        const parts = rounded.toString().split('.');

        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        if (parts.length > 1 && parts[1] !== '00' && parseInt(parts[1]) !== 0) {
            return 'Rp ' + parts[0] + ',' + (parts[1].length === 1 ? parts[1] + '0' : parts[1]);
        }

        return 'Rp ' + parts[0];
    };

    const columns: ColumnDef<OrderDetail>[] = [
        createNumberColumn<OrderDetail>(),
        {
            accessorKey: 'item.name',
            header: 'Item Name',
            cell: ({ row }) => `${row.original.item.name} (${row.original.item.code})`,
        },
        {
            accessorKey: 'quantity',
            header: 'Quantity',
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue('quantity'));
                const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
                return `${formattedQty} ${row.original.item.item_unit.abbreviation}`;
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'unit_price',
            header: 'Unit Price',
            cell: ({ row }) => {
                return formatCurrency(parseFloat(row.getValue('unit_price')));
            },
            meta: {
                className: 'text-right',
            },
        },
        {
            accessorKey: 'total_price',
            header: 'Total Price',
            cell: ({ row }) => {
                return formatCurrency(parseFloat(row.getValue('total_price')));
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

    const getStatusBadge = (status: string) => {
        let variant = 'outline';
        let classes = '';
        let label = '';

        switch (status) {
            case 'pending':
                variant = 'outline';
                classes = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200';
                label = 'Pending';
                break;
            case 'partially_received':
                variant = 'outline';
                classes = 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
                label = 'Partially Received';
                break;
            case 'received':
                variant = 'outline';
                classes = 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
                label = 'Received';
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Purchase Order: ${purchaseOrder.code}`} />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Purchase Order" description="Purchase order details and items" />
                    <div className="flex gap-3">
                        <Link href={route('procurement.order.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                        {hasPermission('update_purchase_order') && purchaseOrder.status === 'pending' && (
                            <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2">
                                <Edit className="h-4 w-4" /> Edit
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <Card className="h-full border-0 shadow-sm">
                            <div className="p-6">
                                <h2 className="mb-4 text-base font-semibold text-gray-900">Order Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Order Code</h3>
                                            <p className="mt-1 text-sm text-gray-900">{purchaseOrder.code}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                            <div className="mt-1">{getStatusBadge(purchaseOrder.status)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(purchaseOrder.date)}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Expected Delivery</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(purchaseOrder.expected_delivery_date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Branch</h3>
                                            <p className="mt-1 text-sm text-gray-900">{purchaseOrder.branch.name}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
                                            <p className="mt-1 text-sm text-gray-900">{purchaseOrder.supplier.name}</p>
                                        </div>
                                    </div>

                                    {purchaseOrder.user && (
                                        <div className="flex items-center">
                                            <div className="flex-1">
                                                <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                                                <p className="mt-1 text-sm text-gray-900">{purchaseOrder.user.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Order Summary</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Subtotal</span>
                                                <span className="text-sm font-medium">{formatCurrency(purchaseOrder.total_amount)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">
                                                    Tax {purchaseOrder.tax_rate ? `(${purchaseOrder.tax_rate.rate}%)` : ''}
                                                </span>
                                                <span className="text-sm font-medium">{formatCurrency(purchaseOrder.tax_amount)}</span>
                                            </div>
                                            <div className="mt-2 flex justify-between border-t pt-2">
                                                <span className="font-medium">Grand Total</span>
                                                <span className="font-bold text-gray-900">{formatCurrency(purchaseOrder.grand_total)}</span>
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
                                    <h2 className="text-base font-semibold text-gray-900">Order Items</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {purchaseOrder.purchase_order_details.length} items
                                    </Badge>
                                </div>

                                {purchaseOrder.purchase_order_details.length > 0 ? (
                                    <DataTable data={purchaseOrder.purchase_order_details} columns={columns} pageSize={10} />
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No order items found</p>
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
