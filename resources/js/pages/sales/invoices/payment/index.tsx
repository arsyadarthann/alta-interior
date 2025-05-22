import { DataTable } from '@/components/data-table';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: '#',
    },
    {
        title: 'Payments',
        href: '#',
    },
];

interface Props {
    salesInvoicePayments: {
        data: SalesInvoicePayment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    branches: Branch[];
    selectedBranchId?: string;
}

type Branch = {
    id: number;
    name: string;
    initial: string;
    contact: string;
    address: string;
};

type SalesInvoicePayment = {
    id: number;
    code: string;
    date: string;
    user_id: number;
    branch_id: number;
    sales_invoice_id: number;
    payment_method_id: number;
    amount: string;
    note: string | null;
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
    };
    branch: {
        id: number;
        name: string;
    };
    sales_invoice: {
        id: number;
        code: string;
        date: string;
        due_date: string;
        user_id: number;
        branch_id: number;
        customer_id: number;
        customer_name: string | null;
        total_amount: string;
        discount_type: string;
        discount_percentage: string;
        discount_amount: string;
        tax_rate_id: number;
        tax_amount: string;
        grand_total: string;
        paid_status: 'unpaid' | 'partially_paid' | 'paid';
        paid_amount: string;
        remaining_amount: string;
    };
    payment_method: {
        id: number;
        name: string;
        charge_percentage: string;
        account_number: string | null;
        account_name: string | null;
    };
};

export default function Index({ salesInvoicePayments, branches, selectedBranchId = '' }: Props) {
    useToastNotification();

    const { hasPermission } = usePermissions();
    const { auth } = usePage().props as unknown as {
        auth: { user: { branch_id: number } };
    };
    const [, setIsLoading] = useState(false);
    const initialLoadComplete = useRef(false);

    const getDefaultBranchValue = () => {
        if (auth.user.branch_id) {
            return `${auth.user.branch_id}`;
        }

        if (selectedBranchId) {
            return selectedBranchId;
        }

        return 'all';
    };

    const [currentBranch, setCurrentBranch] = useState(getDefaultBranchValue());

    useEffect(() => {
        if (!initialLoadComplete.current && auth?.user?.branch_id) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlBranchId = urlParams.get('branch_id');

            if (urlBranchId !== auth.user.branch_id.toString()) {
                initialLoadComplete.current = true;

                if (window.history && window.history.replaceState) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('branch_id', auth.user.branch_id.toString());
                    window.history.replaceState({}, '', url.toString());
                }

                setTimeout(() => {
                    router.reload({
                        data: {
                            branch_id: auth.user.branch_id.toString(),
                        },
                        only: ['salesInvoicePayments'],
                    });
                }, 0);
            } else {
                initialLoadComplete.current = true;
            }
        } else if (!initialLoadComplete.current) {
            initialLoadComplete.current = true;
        }
    }, []);

    const handleBranchChange = (value: string) => {
        if (auth.user.branch_id) {
            return;
        }

        setCurrentBranch(value);
        setIsLoading(true);

        let params = {};
        if (value !== 'all') {
            params = {
                branch_id: value,
            };
        }

        router.get(route('sales.payment.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['salesInvoicePayments', 'branches', 'selectedBranchId'],
            onFinish: () => setIsLoading(false),
        });
    };

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        const params: any = { page };

        // Maintain branch filtering when changing pages
        if (currentBranch !== 'all' && !auth.user.branch_id) {
            params.branch_id = currentBranch;
        } else if (auth.user.branch_id) {
            params.branch_id = auth.user.branch_id;
        }

        router.get(route('sales.payment.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['salesInvoicePayments'],
            onFinish: () => setIsLoading(false),
        });
    };

    const columns: ColumnDef<SalesInvoicePayment>[] = [
        createNumberColumn<SalesInvoicePayment>(),
        {
            accessorKey: 'code',
            header: 'Payment Code',
        },
        {
            accessorKey: 'date',
            header: 'Payment Date',
        },
        {
            accessorKey: 'sales_invoice.code',
            header: 'Invoice Number',
            cell: ({ row }: { row: Row<SalesInvoicePayment> }) => {
                const payment = row.original;
                return payment.sales_invoice.code;
            },
        },
        {
            accessorKey: 'payment_method.name',
            header: 'Payment Method',
            cell: ({ row }: { row: Row<SalesInvoicePayment> }) => {
                const payment = row.original;
                return payment.payment_method.name + (payment.payment_method.account_number ? ` (${payment.payment_method.account_number})` : '');
            },
        },
        {
            accessorKey: 'branch.name',
            header: 'Branch',
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }: { row: Row<SalesInvoicePayment> }) => {
                const amount = row.getValue('amount') as string;
                return formatCurrency(parseFloat(amount));
            },
        },
        {
            accessorKey: 'note',
            header: 'Note',
            cell: ({ row }: { row: Row<SalesInvoicePayment> }) => {
                const note = row.getValue('note') as string | null;
                return note || '-';
            },
        },
        {
            accessorKey: 'user.name',
            header: 'Created By',
        },
    ].filter(Boolean) as ColumnDef<SalesInvoicePayment>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Payments" />

            <div className="rounded-lg bg-white px-8 py-6">
                <Heading title="Sales Payments" description="Manage your sales invoice payments." />

                <div className="mb-4 flex items-center justify-between">
                    {!auth.user.branch_id ? (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="branch" className="whitespace-nowrap">
                                Branch Filter:
                            </Label>
                            <Combobox
                                value={currentBranch}
                                onValueChange={handleBranchChange}
                                options={[
                                    { value: 'all', label: 'All Branches' },
                                    ...branches.map((branch) => ({
                                        value: `${branch.id}`,
                                        label: branch.name,
                                    })),
                                ]}
                                placeholder="Select branch"
                                searchPlaceholder="Search branches..."
                                className="w-[200px]"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Label className="whitespace-nowrap">Branch:</Label>
                            <span className="text-sm font-medium">
                                {branches.find((branch) => branch.id === auth.user.branch_id)?.name || 'Unknown Branch'}
                            </span>
                        </div>
                    )}

                    {hasPermission('create_sales_invoice_payment') && (
                        <Link href={route('sales.payment.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Payment
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={salesInvoicePayments.data}
                    searchable={false}
                    serverPagination={{
                        pageCount: salesInvoicePayments.last_page,
                        currentPage: salesInvoicePayments.current_page,
                        totalItems: salesInvoicePayments.total,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>
        </AppLayout>
    );
}
