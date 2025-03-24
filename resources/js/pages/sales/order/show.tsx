import { DataTable } from '@/components/data-table';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Edit } from 'lucide-react';

interface Branch {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface ItemUnit {
    id: number;
    name: string;
    abbreviation: string;
}

interface Item {
    id: number;
    name: string;
    code: string;
    item_category_id: number;
    item_unit_id: number;
    price: string;
    item_unit?: ItemUnit;
}

interface ItemSource {
    id: number;
    name: string;
}

interface SalesOrderDetail {
    id: number;
    sales_order_id: number;
    item_id: number;
    item_source_able_id: number;
    item_source_able_type: string;
    quantity: string;
    unit_price: string;
    total_price: string;
    created_at: string;
    updated_at: string;
    item: Item;
    item_source_able: ItemSource;
}

interface Waybill {
    id: number;
    code: string;
    date: string;
    user_id: number;
    user: User;
    branch_id: number;
    sales_order_id: number;
    status: string;
    created_at: string;
    updated_at: string;
}

interface SalesOrderProps {
    salesOrder: {
        id: number;
        code: string;
        date: string;
        user_id: number;
        branch_id: number;
        customer_id: number;
        customer_name: string;
        status: string;
        created_at: string;
        updated_at: string;
        total_amount: string;
        tax_rate_id: number | null;
        tax_amount: string;
        grand_total: string;
        user: User;
        branch: Branch;
        customer: Customer;
        sales_order_details: SalesOrderDetail[];
        waybills: Waybill[];
    };
}

export default function Show({ salesOrder }: SalesOrderProps) {
    const { hasPermission } = usePermissions();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sales',
            href: '#',
        },
        {
            title: 'Orders',
            href: route('sales.order.index'),
        },
        {
            title: salesOrder.code,
            href: route('sales.order.show', salesOrder.id),
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

    const columns: ColumnDef<SalesOrderDetail>[] = [
        createNumberColumn<SalesOrderDetail>(),
        {
            accessorKey: 'item.name',
            header: 'Item Name',
            cell: ({ row }) => {
                const detail = row.original;
                const item = detail.item;
                return item ? `${item.name} (${item.code})` : `Item #${detail.item_id}`;
            },
        },
        {
            accessorKey: 'item_source_able',
            header: 'Item Location',
            cell: ({ row }) => {
                const detail = row.original;
                return `${detail.item_source_able?.name}`;
            },
        },
        {
            accessorKey: 'quantity',
            header: 'Quantity',
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue('quantity'));
                const formattedQty = formatDecimal(qty);
                const unit = row.original.item?.item_unit?.abbreviation || '';
                return `${formattedQty} ${unit}`;
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'unit_price',
            header: 'Unit Price',
            cell: ({ row }) => {
                return formatCurrency(row.getValue('unit_price'));
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

    const waybillColumns: ColumnDef<Waybill>[] = [
        createNumberColumn<Waybill>(),
        {
            accessorKey: 'code',
            header: 'Waybill Code',
            cell: ({ row }) => (
                <Link href={route('sales.waybill.show', row.original.id)} className="text-blue-600 hover:text-blue-800">
                    {row.original.code}
                </Link>
            ),
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }) => {
                return formatDate(row.original.date);
            },
        },
        {
            accessorKey: 'user.name',
            header: 'Processed By',
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                return getWaybillStatusBadge(row.original.status);
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
            case 'completed':
                variant = 'outline';
                classes = 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
                label = 'Completed';
                break;
            case 'processed':
                variant = 'outline';
                classes = 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
                label = 'Processed';
                break;
            case 'cancelled':
                variant = 'outline';
                classes = 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200';
                label = 'Cancelled';
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

    const getWaybillStatusBadge = (status: string) => {
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
                label = status
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
        }

        return (
            <Badge variant={variant as never} className={classes}>
                {label}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Sales Order: ${salesOrder.code}`} />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Sales Order" description="Sales order details and ordered items" />
                    <div className="flex gap-3">
                        {hasPermission('update_sales_order') && salesOrder.status === 'pending' && (
                            <Link href={route('sales.order.edit', salesOrder.id)}>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Edit className="h-4 w-4" /> Edit
                                </Button>
                            </Link>
                        )}
                        <Link href={route('sales.order.index')}>
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
                                <h2 className="mb-4 text-base font-semibold text-gray-900">Order Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Order Code</h3>
                                            <p className="mt-1 text-sm text-gray-900">{salesOrder.code}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                            <div className="mt-1">{getStatusBadge(salesOrder.status)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(salesOrder.date)}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                                            <p className="mt-1 text-sm text-gray-900">{salesOrder.user.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                                            <p className="mt-1 text-sm text-gray-900">{salesOrder.customer_name || salesOrder.customer.name}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Branch</h3>
                                            <p className="mt-1 text-sm text-gray-900">{salesOrder.branch.name}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Order Summary</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Subtotal</span>
                                                <span className="text-sm font-medium">{formatCurrency(salesOrder.total_amount)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Tax</span>
                                                <span className="text-sm font-medium">{formatCurrency(salesOrder.tax_amount)}</span>
                                            </div>
                                            <div className="mt-2 flex justify-between border-t pt-2">
                                                <span className="font-medium">Total Amount</span>
                                                <span className="font-bold text-gray-900">{formatCurrency(salesOrder.grand_total)}</span>
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
                                        {salesOrder.sales_order_details.length} items
                                    </Badge>
                                </div>

                                {salesOrder.sales_order_details.length > 0 ? (
                                    <DataTable data={salesOrder.sales_order_details} columns={columns} pageSize={10} />
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No items found in this order</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Waybill History Section */}
                <div className="mt-6">
                    <Card className="border-0 shadow-sm">
                        <div className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center">
                                    <h2 className="text-base font-semibold text-gray-900">Waybill History</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {salesOrder.waybills?.length || 0} waybills
                                    </Badge>
                                </div>
                            </div>

                            {salesOrder.waybills && salesOrder.waybills.length > 0 ? (
                                <DataTable data={salesOrder.waybills} columns={waybillColumns} pageSize={5} />
                            ) : (
                                <div className="py-8 text-center text-gray-500">
                                    <p>No waybills associated with this order</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
