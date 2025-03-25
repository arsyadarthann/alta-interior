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
import { ArrowLeft, Edit, FileText } from 'lucide-react';

interface Branch {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    contact_name: string;
    phone: string;
    email: string;
    address: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

interface TaxRate {
    id: number;
    rate: string;
}

interface ItemUnit {
    id: number;
    name: string;
    abbreviation: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
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
    deleted_at: string | null;
    item_unit: ItemUnit;
}

interface ItemSource {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

interface SalesOrderDetail {
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
    item_source_able: ItemSource;
    item: Item;
}

interface SalesOrder {
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

interface Waybill {
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
}

interface SalesInvoiceDetail {
    id: number;
    sales_invoice_id: number;
    waybill_id: number;
    total_price: string;
    created_at: string;
    updated_at: string;
    waybill: Waybill;
}

interface SalesInvoice {
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
    created_at: string;
    updated_at: string;
    user: User;
    branch: Branch;
    customer: Customer;
    tax_rate: TaxRate;
    sales_invoice_details: SalesInvoiceDetail[];
}

interface SalesInvoiceProps {
    salesInvoice: SalesInvoice;
}

export default function Show({ salesInvoice }: SalesInvoiceProps) {
    const { hasPermission } = usePermissions();

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
            title: salesInvoice.code,
            href: route('sales.invoices.show', salesInvoice.id),
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

    // Calculate the total amount for a waybill based on waybill details
    const calculateWaybillTotalPrice = (waybill: Waybill): number => {
        if (!waybill.waybill_details || waybill.waybill_details.length === 0) {
            return 0;
        }

        return waybill.waybill_details.reduce((sum, detail) => {
            const quantity = parseFloat(detail.quantity);
            const unitPrice = parseFloat(detail.sales_order_detail.unit_price);
            return sum + quantity * unitPrice;
        }, 0);
    };

    const columns: ColumnDef<SalesInvoiceDetail>[] = [
        createNumberColumn<SalesInvoiceDetail>(),
        {
            accessorKey: 'waybill.code',
            header: 'Waybill Code',
            cell: ({ row }) => {
                const waybill = row.original.waybill;
                return (
                    <Link href={route('sales.waybill.show', waybill.id)} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {waybill.code}
                    </Link>
                );
            },
        },
        {
            accessorKey: 'waybill.date',
            header: 'Waybill Date',
            cell: ({ row }) => {
                return formatDate(row.original.waybill.date);
            },
        },
        {
            accessorKey: 'waybill.sales_order.code',
            header: 'Sales Order',
            cell: ({ row }) => {
                const salesOrder = row.original.waybill.sales_order;
                return (
                    <Link href={route('sales.order.show', salesOrder.id)} className="text-blue-600 hover:text-blue-800 hover:underline">
                        {salesOrder.code}
                    </Link>
                );
            },
        },
        {
            accessorKey: 'waybill.items_count',
            header: 'Items',
            cell: ({ row }) => {
                const waybill = row.original.waybill;
                return waybill.waybill_details?.length || 0;
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'total_price',
            header: 'Amount',
            cell: ({ row }) => {
                // Calculate the amount based on waybill_details (quantity × unit_price)
                const calculatedAmount = calculateWaybillTotalPrice(row.original.waybill);
                return formatCurrency(calculatedAmount);
            },
            meta: {
                className: 'text-right',
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
            case 'unpaid':
                variant = 'outline';
                classes = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200';
                label = 'Unpaid';
                break;
            case 'partially_paid':
                variant = 'outline';
                classes = 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
                label = 'Partially Paid';
                break;
            case 'paid':
                variant = 'outline';
                classes = 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
                label = 'Paid';
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
            <Head title={`Invoice: ${salesInvoice.code}`} />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Sales Invoice" description="Invoice details and included waybills" />
                    <div className="flex gap-3">
                        {hasPermission('update_sales_invoice') && (
                            <Link href={route('sales.invoices.edit', salesInvoice.id)}>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Edit className="h-4 w-4" /> Edit
                                </Button>
                            </Link>
                        )}
                        {hasPermission('print_sales_invoice') && (
                            <Link href={route('sales.invoices.print', salesInvoice.id)} target="_blank">
                                <Button variant="outline" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Print
                                </Button>
                            </Link>
                        )}
                        <Link href={route('sales.invoices.index')}>
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
                                <h2 className="mb-4 text-base font-semibold text-gray-900">Invoice Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Invoice Code</h3>
                                            <p className="mt-1 text-sm text-gray-900">{salesInvoice.code}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                            <div className="mt-1">{getStatusBadge(salesInvoice.paid_status)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Invoice Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(salesInvoice.date)}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(salesInvoice.due_date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                                            <p className="mt-1 text-sm text-gray-900">{salesInvoice.customer?.name || salesInvoice.customer_name}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                                            <p className="mt-1 text-sm text-gray-900">{salesInvoice.user.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Branch</h3>
                                            <p className="mt-1 text-sm text-gray-900">{salesInvoice.branch.name}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Tax Rate</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDecimal(salesInvoice.tax_rate?.rate) || '0'}%</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Payment Summary</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Subtotal</span>
                                                <span className="text-sm font-medium">{formatCurrency(salesInvoice.total_amount)}</span>
                                            </div>
                                            {parseFloat(salesInvoice.discount_amount) > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">
                                                        Discount{' '}
                                                        {salesInvoice.discount_type === 'percentage'
                                                            ? `(${formatDecimal(salesInvoice.discount_percentage)}%)`
                                                            : ''}
                                                    </span>
                                                    <span className="text-sm font-medium text-red-600">
                                                        -{formatCurrency(salesInvoice.discount_amount)}
                                                    </span>
                                                </div>
                                            )}
                                            {parseFloat(salesInvoice.tax_amount) > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">
                                                        Tax ({formatDecimal(salesInvoice.tax_rate?.rate) || '0'}%)
                                                    </span>
                                                    <span className="text-sm font-medium">{formatCurrency(salesInvoice.tax_amount)}</span>
                                                </div>
                                            )}
                                            <div className="border-t border-gray-100 pt-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-900">Grand Total</span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {formatCurrency(salesInvoice.grand_total)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="border-t border-gray-100 pt-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Amount Paid</span>
                                                    <span className="text-sm font-medium text-green-600">
                                                        {formatCurrency(salesInvoice.paid_amount)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Remaining</span>
                                                    <span className="text-sm font-medium text-red-600">
                                                        {formatCurrency(salesInvoice.remaining_amount)}
                                                    </span>
                                                </div>
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
                                    <h2 className="text-base font-semibold text-gray-900">Invoice Waybills</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {salesInvoice.sales_invoice_details.length} waybills
                                    </Badge>
                                </div>

                                {salesInvoice.sales_invoice_details.length > 0 ? (
                                    <DataTable data={salesInvoice.sales_invoice_details} columns={columns} pageSize={10} />
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No waybills found in this invoice</p>
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
