import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
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
    stockAdjustments: StockAdjustment[];
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
            <Head title="Stock Audit" />

            <div className="rounded-lg bg-white px-8 py-6">
                <Heading title="Stock Adjustment" description="Manage your stock adjustments." />

                <div className="mb-4 flex items-center justify-between">
                    {!auth.user.branch_id ? (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="source" className="whitespace-nowrap">
                                Location Filter:
                            </Label>
                            <Select value={currentSource} onValueChange={handleSourceChange}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {warehouses.map((warehouse) => (
                                        <SelectItem key={`warehouse-${warehouse.id}`} value={`Warehouse:${warehouse.id}`}>
                                            {warehouse.name}
                                        </SelectItem>
                                    ))}
                                    {branches.map((branch) => (
                                        <SelectItem key={`branch-${branch.id}`} value={`Branch:${branch.id}`}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

                <DataTable columns={columns} data={stockAdjustments} />
            </div>
        </AppLayout>
    );
}
