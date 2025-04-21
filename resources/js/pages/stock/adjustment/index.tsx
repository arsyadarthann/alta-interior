import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Eye, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stock',
        href: '#',
    },
    {
        title: 'Adjustment',
        href: '#',
    },
];

interface Props {
    stockAdjustments: {
        data: StockAdjustment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    branches: Branch[];
    warehouses: Warehouse[];
    selectedSourceAbleId?: string;
    selectedSourceAbleType?: string;
}

type Branch = {
    id: number;
    name: string;
};

type Warehouse = {
    id: number;
    name: string;
};

type StockAdjustment = {
    id: number;
    code: string;
    date: string;
    source_able: {
        id: number;
        name: string;
    };
    user: {
        id: number;
        name: string;
    };
};

export default function Index({ stockAdjustments, branches, warehouses, selectedSourceAbleId = '', selectedSourceAbleType = '' }: Props) {
    useToastNotification();

    const { hasPermission } = usePermissions();
    const { auth } = usePage().props as unknown as {
        auth: { user: { branch_id: number } };
    };
    const [, setIsLoading] = useState(false);
    const initialLoadComplete = useRef(false);

    const getDefaultSourceValue = () => {
        if (auth.user.branch_id) {
            return `${auth.user.branch_id}`;
        }

        if (selectedSourceAbleId && selectedSourceAbleType) {
            return `${selectedSourceAbleType}:${selectedSourceAbleId}`;
        }

        return 'all';
    };

    const [currentSource, setCurrentSource] = useState(getDefaultSourceValue());

    useEffect(() => {
        if (!initialLoadComplete.current && auth?.user?.branch_id) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlSourceId = urlParams.get('source_able_id');
            const urlSourceType = urlParams.get('source_able_type');

            if (urlSourceId !== auth.user.branch_id.toString() || urlSourceType !== 'Branch') {
                initialLoadComplete.current = true;

                if (window.history && window.history.replaceState) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('source_able_id', auth.user.branch_id.toString());
                    url.searchParams.set('source_able_type', 'Branch');
                    window.history.replaceState({}, '', url.toString());
                }

                setTimeout(() => {
                    router.reload({
                        data: {
                            source_able_id: auth.user.branch_id.toString(),
                            source_able_type: 'Branch',
                        },
                        only: ['stockAdjustments'],
                    });
                }, 0);
            } else {
                initialLoadComplete.current = true;
            }
        } else if (!initialLoadComplete.current) {
            initialLoadComplete.current = true;
        }
    }, []);

    const handleSourceChange = (value: string) => {
        if (auth.user.branch_id) {
            return;
        }

        setCurrentSource(value);
        setIsLoading(true);

        let params = {};
        if (value !== 'all') {
            const [type, id] = value.split(':');
            params = {
                source_able_id: id,
                source_able_type: type,
            };
        }

        router.get(route('stock.adjustment.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['stockAdjustments', 'branches', 'warehouses', 'selectedSourceAbleId', 'selectedSourceAbleType'],
            onFinish: () => setIsLoading(false),
        });
    };

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        let params: any = { page };

        // Maintain source filtering when changing pages
        if (currentSource !== 'all' && !auth.user.branch_id) {
            const [type, id] = currentSource.split(':');
            params.source_able_id = id;
            params.source_able_type = type;
        } else if (auth.user.branch_id) {
            params.source_able_id = auth.user.branch_id;
            params.source_able_type = 'Branch';
        }

        router.get(route('stock.adjustment.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['stockAdjustments'],
            onFinish: () => setIsLoading(false),
        });
    };

    const columns: ColumnDef<StockAdjustment>[] = [
        createNumberColumn<StockAdjustment>(),
        {
            accessorKey: 'code',
            header: 'Code',
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }: { row: Row<StockAdjustment> }) => {
                const date = row.getValue('date') as string;
                return formatDate(date);
            },
        },
        {
            accessorKey: 'source_able.name',
            header: 'Source',
        },
        {
            accessorKey: 'user.name',
            header: 'Created By',
        },
        ActionColumn<StockAdjustment>({
            hasPermission: hasPermission,
            actions: () => [
                {
                    label: 'View Detail',
                    icon: <Eye className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('stock.adjustment.show', data.id)),
                    permission: 'read_stock_adjustment',
                },
            ],
        }),
    ].filter(Boolean) as ColumnDef<StockAdjustment>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Adjustment" />

            <div className="rounded-lg bg-white px-8 py-6">
                <Heading title="Stock Adjustment" description="Manage your stock adjustments." />

                <div className="mb-4 flex items-center justify-between">
                    {!auth.user.branch_id ? (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="source" className="whitespace-nowrap">
                                Location Filter:
                            </Label>
                            <Combobox
                                value={currentSource}
                                onValueChange={handleSourceChange}
                                options={[
                                    { value: 'all', label: 'All Locations' },
                                    ...warehouses.map((warehouse) => ({
                                        value: `Warehouse:${warehouse.id}`,
                                        label: warehouse.name,
                                    })),
                                    ...branches.map((branch) => ({
                                        value: `Branch:${branch.id}`,
                                        label: branch.name,
                                    })),
                                ]}
                                placeholder="Select source"
                                searchPlaceholder="Search locations..."
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

                    {hasPermission('create_stock_adjustment') && (
                        <Link href={route('stock.adjustment.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Stock Adjustment
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={stockAdjustments.data}
                    serverPagination={{
                        pageCount: stockAdjustments.last_page,
                        currentPage: stockAdjustments.current_page,
                        totalItems: stockAdjustments.total,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>
        </AppLayout>
    );
}
