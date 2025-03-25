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

interface SalesOrder {
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
    tax_rate_id: number;
    tax_amount: string;
    grand_total: string;
    customer: {
        id: number;
        name: string;
    };
}

interface WaybillDetail {
    id: number;
    waybill_id: number;
    sales_order_detail_id: number;
    quantity: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    sales_order_detail: SalesOrderDetail;
}

interface WaybillProps {
    waybill: {
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
        waybill_details: WaybillDetail[];
    };
}

export default function Show({ waybill }: WaybillProps) {
    const { hasPermission } = usePermissions();

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
            title: waybill.code,
            href: route('sales.waybill.show', waybill.id),
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

    const columns: ColumnDef<WaybillDetail>[] = [
        createNumberColumn<WaybillDetail>(),
        {
            accessorKey: 'sales_order_detail.item.name',
            header: 'Item Name',
            cell: ({ row }) => {
                const detail = row.original.sales_order_detail;
                const item = detail.item;
                return item ? `${item.name} (${item.code})` : `Item #${detail.item_id}`;
            },
        },
        {
            accessorKey: 'sales_order_detail.item_source_able',
            header: 'Item Location',
            cell: ({ row }) => {
                const detail = row.original.sales_order_detail;
                return `${detail.item_source_able?.name}`;
            },
        },
        {
            accessorKey: 'quantity',
            header: 'Quantity',
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue('quantity'));
                const formattedQty = formatDecimal(qty);
                const unit = row.original.sales_order_detail?.item?.item_unit?.abbreviation || '';
                return `${formattedQty} ${unit}`;
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => {
                return row.original.description || '-';
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
            case 'processed':
                variant = 'outline';
                classes = 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
                label = 'Processed';
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

    const getStatusSOBadge = (status: string) => {
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
            <Head title={`Waybill: ${waybill.code}`} />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Waybill" description="Waybill details and delivery items" />
                    <div className="flex gap-3">
                        {hasPermission('update_sales_waybill') && (
                            <Link href={route('sales.waybill.edit', waybill.id)}>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Edit className="h-4 w-4" /> Edit
                                </Button>
                            </Link>
                        )}
                        <Link href={route('sales.waybill.index')}>
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
                                <h2 className="mb-4 text-base font-semibold text-gray-900">Waybill Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Waybill Code</h3>
                                            <p className="mt-1 text-sm text-gray-900">{waybill.code}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                            <div className="mt-1">{getStatusBadge(waybill.status)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Waybill Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(waybill.date)}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                                            <p className="mt-1 text-sm text-gray-900">{waybill.user.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {waybill.sales_order.customer ? waybill.sales_order.customer.name : waybill.sales_order.customer_name}
                                            </p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Branch</h3>
                                            <p className="mt-1 text-sm text-gray-900">{waybill.branch.name}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Related Order</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Order Code</span>
                                                <Link
                                                    href={route('sales.order.show', waybill.sales_order.id)}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    {waybill.sales_order.code}
                                                </Link>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Order Date</span>
                                                <span className="text-sm font-medium">{formatDate(waybill.sales_order.date)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Order Status</span>
                                                <span className="text-sm font-medium">{getStatusSOBadge(waybill.sales_order.status)}</span>
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
                                    <h2 className="text-base font-semibold text-gray-900">Waybill Items</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {waybill.waybill_details.length} items
                                    </Badge>
                                </div>

                                {waybill.waybill_details.length > 0 ? (
                                    <DataTable data={waybill.waybill_details} columns={columns} pageSize={10} />
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No items found in this waybill</p>
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
