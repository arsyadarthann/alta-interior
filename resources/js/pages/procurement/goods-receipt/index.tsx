import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Eye, Plus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Procurement',
        href: '#',
    },
    {
        title: 'Goods Receipt',
        href: '#',
    },
];

interface Props {
    goodsReceipts: {
        data: GoodsReceipt[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

type GoodsReceipt = {
    id: number;
    code: string;
    date: string;
    supplier: {
        id: number;
        name: string;
    };
    received_by: string;
};

export default function Index({ goodsReceipts }: Props) {
    useToastNotification();
    const { hasPermission } = usePermissions();
    const [isLoading, setIsLoading] = useState(false);

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const [year, month, day] = date.toISOString().split('T')[0].split('-');
        return `${year}-${month}-${day}`;
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
            default:
                label = status.charAt(0).toUpperCase() + status.slice(1);
        }

        return (
            <Badge variant={variant as never} className={classes}>
                {label}
            </Badge>
        );
    };

    const columns: ColumnDef<GoodsReceipt>[] = [
        createNumberColumn<GoodsReceipt>(),
        {
            accessorKey: 'code',
            header: 'Code',
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }: { row: Row<GoodsReceipt> }) => {
                const date = row.getValue('date') as string;
                return formatDate(date);
            },
        },
        {
            accessorKey: 'supplier.name',
            header: 'Supplier',
        },
        {
            accessorKey: 'received_by',
            header: 'Received By',
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: { row: Row<GoodsReceipt> }) => {
                const status = row.getValue('status') as string;
                return getStatusBadge(status);
            },
        },
        ActionColumn<GoodsReceipt>({
            hasPermission: hasPermission,
            actions: () => [
                {
                    label: 'View Detail',
                    icon: <Eye className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('procurement.receipt.show', data.id)),
                    permission: 'read_goods_receipt',
                },
            ],
        }),
    ].filter(Boolean) as ColumnDef<GoodsReceipt>[];

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        router.get(
            route('procurement.receipt.index'),
            { page },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['goodsReceipts'],
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Goods Receipt" />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="flex items-center justify-between">
                    <Heading title="Goods Receipt" description="Manage your goods receipts." />

                    {hasPermission('create_goods_receipt') && (
                        <Link href={route('procurement.receipt.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Goods Receipt
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={goodsReceipts.data}
                    serverPagination={{
                        pageCount: goodsReceipts.last_page,
                        currentPage: goodsReceipts.current_page,
                        totalItems: goodsReceipts.total,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>
        </AppLayout>
    );
}
