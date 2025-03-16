import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Printer, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Procurement',
        href: '#',
    },
    {
        title: 'Purchase Order',
        href: '#',
    },
];

interface Props {
    purchaseOrders: PurchaseOrder[];
}

type PurchaseOrder = {
    id: number;
    code: string;
    date: string;
    supplier: {
        id: number;
        name: string;
    };
    expected_delivery_date: string;
    status: string;
};

export default function Index({ purchaseOrders }: Props) {
    useToastNotification();
    const { hasPermission } = usePermissions();

    const columns: ColumnDef<PurchaseOrder>[] = [
        createNumberColumn<PurchaseOrder>(),
        {
            accessorKey: 'code',
            header: 'Code',
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }: { row: Row<PurchaseOrder> }) => {
                const date = row.getValue('date') as string;

                const formatDate = (dateString: string): string => {
                    const date = new Date(dateString);
                    const [year, month, day] = date.toISOString().split('T')[0].split('-');
                    return `${year}-${month}-${day}`;
                };

                return formatDate(date);
            },
        },
        {
            accessorKey: 'supplier.name',
            header: 'Supplier',
        },
        {
            accessorKey: 'expected_delivery_date',
            header: 'Expected Delivery',
            cell: ({ row }: { row: Row<PurchaseOrder> }) => {
                const expected_delivery_date = row.getValue('expected_delivery_date') as string;

                const formatDate = (dateString: string): string => {
                    const date = new Date(dateString);
                    const [year, month, day] = date.toISOString().split('T')[0].split('-');
                    return `${year}-${month}-${day}`;
                };

                return formatDate(expected_delivery_date);
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: { row: Row<PurchaseOrder> }) => {
                const status = row.getValue('status') as string;

                const capitalizeWords = (str: string): string => {
                    return str
                        .split(' ')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                };

                let bgColor = '';
                let textColor = '';

                if (status === 'pending') {
                    bgColor = 'bg-yellow-100';
                    textColor = 'text-yellow-800';
                } else if (status === 'partially_received') {
                    bgColor = 'bg-blue-100';
                    textColor = 'text-blue-800';
                } else if (status === 'received') {
                    bgColor = 'bg-green-100';
                    textColor = 'text-green-800';
                }

                return <span className={`rounded px-2 py-1 text-xs font-medium ${bgColor} ${textColor}`}>{capitalizeWords(status)}</span>;
            },
        },
        (hasPermission('update_stock_audit') || hasPermission('delete_stock_audit')) &&
            ActionColumn<PurchaseOrder>({
                hasPermission: hasPermission,
                actions: (purchaseOrder) => [
                    {
                        label: 'View Detail',
                        icon: <Eye className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('procurement.order.show', data.id)),
                        permission: 'read_purchase_order',
                    },
                    {
                        label: 'Edit',
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('procurement.order.edit', data.id)),
                        permission: 'update_purchase_order',
                        isHidden: (data) => data.status !== 'pending',
                    },
                    {
                        label: 'Print PDF',
                        icon: <Printer className="h-4 w-4" />,
                        onClick: (data) => {
                            window.open(route('procurement.order.generate-pdf', data.id), '_blank');
                        },
                        permission: 'read_purchase_order',
                    },
                    {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4" />,
                        className: 'text-red-600',
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Delete Purchase Order',
                            description: `This action cannot be undone. This will permanently delete purchase order ${purchaseOrder.code}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('procurement.order.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_purchase_order',
                        isHidden: (data) => data.status !== 'pending',
                    },
                ],
            }),
    ].filter(Boolean) as ColumnDef<PurchaseOrder>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Order" />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="flex items-center justify-between">
                    <Heading title="Purchase Order" description="Manage your purchase orders." />

                    {hasPermission('create_purchase_order') && (
                        <Link href={route('procurement.order.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Purchase Order
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable columns={columns} data={purchaseOrders} />
            </div>
        </AppLayout>
    );
}
