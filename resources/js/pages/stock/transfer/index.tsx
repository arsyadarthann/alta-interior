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
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stock',
        href: '#',
    },
    {
        title: 'Transfer',
        href: '#',
    },
];

interface Props {
    stockTransfers: StockTransfer[];
}

type StockTransfer = {
    id: number;
    code: string;
    date: string;
    source_able: {
        id: number;
        name: string;
    };
    destination_able: {
        id: number;
        name: string;
    };
    user: {
        id: number;
        name: string;
    };
};

export default function Index({ stockTransfers }: Props) {
    useToastNotification();

    const { hasPermission } = usePermissions();

    const columns: ColumnDef<StockTransfer>[] = [
        createNumberColumn<StockTransfer>(),
        {
            accessorKey: 'code',
            header: 'Code',
        },
        {
            accessorKey: 'date',
            header: 'Date',
        },
        {
            accessorKey: 'source_able.name',
            header: 'From',
        },
        {
            accessorKey: 'destination_able.name',
            header: 'To',
        },
        {
            accessorKey: 'user.name',
            header: 'Created By',
        },
        ActionColumn<StockTransfer>({
            hasPermission: hasPermission,
            actions: () => [
                {
                    label: 'View Detail',
                    icon: <Eye className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('stock.transfer.show', data.id)),
                    permission: 'read_stock_transfer',
                },
            ],
        }),
    ].filter(Boolean) as ColumnDef<StockTransfer>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Transfer" />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="flex items-center justify-between">
                    <Heading title="Stock Transfer" description="Manage your stock transfers." />

                    {hasPermission('create_stock_transfer') && (
                        <Link href={route('stock.transfer.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Stock Transfer
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable columns={columns} data={stockTransfers} />
            </div>
        </AppLayout>
    );
}
