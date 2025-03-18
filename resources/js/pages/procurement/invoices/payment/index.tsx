import { DataTable } from '@/components/data-table';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Procurement',
        href: '#',
    },
    {
        title: 'Invoice Payment',
        href: '#',
    },
];

interface Props {
    purchaseInvoicePayments: {
        data: PurchaseInvoicePayment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

type PurchaseInvoicePayment = {
    id: number;
    code: string;
    date: string;
    due_date: string;
    purchase_invoice: {
        id: number;
        code: string;
    };
    grand_total: number;
    status: string;
    remaining_amount: number;
};

export default function Index({ purchaseInvoicePayments }: Props) {
    useToastNotification();
    const { hasPermission } = usePermissions();
    const [, setIsLoading] = useState(false);

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const [year, month, day] = date.toISOString().split('T')[0].split('-');
        return `${year}-${month}-${day}`;
    };

    const columns: ColumnDef<PurchaseInvoicePayment>[] = [
        createNumberColumn<PurchaseInvoicePayment>(),
        {
            accessorKey: 'code',
            header: 'Code',
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }: { row: Row<PurchaseInvoicePayment> }) => {
                const date = row.getValue('date') as string;
                return formatDate(date);
            },
        },
        {
            accessorKey: 'purchase_invoice.code',
            header: 'Invoice Paid',
        },
        {
            accessorKey: 'amount',
            header: 'Amount Paid',
            cell: ({ row }: { row: Row<PurchaseInvoicePayment> }) => {
                const amount = row.getValue('amount') as number;

                const formatCurrency = (value: number): string => {
                    const rounded = Math.round(value * 100) / 100;

                    const parts = rounded.toString().split('.');

                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

                    if (parts.length > 1 && parts[1] !== '00' && parseInt(parts[1]) !== 0) {
                        return 'Rp ' + parts[0] + ',' + (parts[1].length === 1 ? parts[1] + '0' : parts[1]);
                    }

                    return 'Rp ' + parts[0];
                };

                return formatCurrency(amount);
            },
        },
        {
            accessorKey: 'user.name',
            header: 'Created By',
        },
    ].filter(Boolean) as ColumnDef<PurchaseInvoicePayment>[];

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        router.get(
            route('procurement.payment.index'),
            { page },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['purchaseInvoices'],
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoice Payment" />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="flex items-center justify-between">
                    <Heading title="Invoice Payment" description="Manage your supplier invoice payment." />

                    {hasPermission('create_purchase_invoice') && (
                        <Link href={route('procurement.payment.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Invoice Payment
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={purchaseInvoicePayments.data}
                    serverPagination={{
                        pageCount: purchaseInvoicePayments.last_page,
                        currentPage: purchaseInvoicePayments.current_page,
                        totalItems: purchaseInvoicePayments.total,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>
        </AppLayout>
    );
}
