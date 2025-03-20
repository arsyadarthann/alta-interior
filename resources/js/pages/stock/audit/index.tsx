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
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Eye, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stock',
        href: '#',
    },
    {
        title: 'Audit',
        href: '#',
    },
];

interface Props {
    stockAudits: {
        data: StockAudit[];
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

type StockAudit = {
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
    is_locked: boolean;
};

export default function Index({ stockAudits, branches, warehouses, selectedSourceAbleId = '', selectedSourceAbleType = '' }: Props) {
    useToastNotification();

    const { hasPermission } = usePermissions();
    const { auth } = usePage().props as unknown as {
        auth: { user: { branch_id: number } };
    };
    const [isLoading, setIsLoading] = useState(false);
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
                        only: ['stockAudits'],
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
            // If user is branch-restricted, don't allow changing
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

        router.get(route('stock.audit.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['stockAudits', 'branches', 'warehouses', 'selectedSourceAbleId', 'selectedSourceAbleType'],
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

        router.get(route('stock.audit.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['stockAudits'],
            onFinish: () => setIsLoading(false),
        });
    };

    const columns: ColumnDef<StockAudit>[] = [
        createNumberColumn<StockAudit>(),
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
        {
            accessorKey: 'is_locked',
            header: 'Status',
            cell: ({ row }: { row: Row<StockAudit> }) => {
                const isLocked = row.getValue('is_locked');

                return (
                    <span className={`rounded px-2 py-1 text-xs font-medium ${isLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {isLocked ? 'Locked' : 'Not Locked'}
                    </span>
                );
            },
        },
        (hasPermission('update_stock_audit') || hasPermission('delete_stock_audit')) &&
            ActionColumn<StockAudit>({
                hasPermission: hasPermission,
                actions: (stockAudit) => [
                    {
                        label: 'View Detail',
                        icon: <Eye className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('stock.audit.show', data.id)),
                        permission: 'read_stock_audit',
                    },
                    {
                        label: 'Edit',
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('stock.audit.edit', data.id)),
                        permission: 'update_stock_audit',
                        isHidden: (data) => data.is_locked,
                    },
                    {
                        label: 'Lock',
                        icon: <Lock className="h-4 w-4" />,
                        onClick: (data) => {
                            router.patch(
                                route('stock.audit.lock', data.id),
                                {},
                                {
                                    preserveScroll: true,
                                },
                            );
                        },
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Lock Stock Audit',
                            description: `Are you sure you want to lock audit ${stockAudit.code}? This will prevent any further changes.`,
                            buttonText: 'Lock',
                            buttonClassName: 'bg-green-600',
                        },
                        permission: 'update_stock_audit',
                        isHidden: (data) => data.is_locked,
                    },
                    {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4" />,
                        className: 'text-red-600',
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Delete Stock Audit',
                            description: `This action cannot be undone. This will permanently delete audit ${stockAudit.code}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('stock.audit.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_stock_audit',
                        isHidden: (data) => data.is_locked,
                    },
                ],
            }),
    ].filter(Boolean) as ColumnDef<StockAudit>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Audit" />

            <div className="rounded-lg bg-white px-8 py-6">
                <Heading title="Stock Audit" description="Manage your stock audits." />

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

                    {hasPermission('create_stock_audit') && (
                        <Link href={route('stock.audit.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Stock Audit
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={stockAudits.data}
                    serverPagination={{
                        pageCount: stockAudits.last_page,
                        currentPage: stockAudits.current_page,
                        totalItems: stockAudits.total,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>
        </AppLayout>
    );
}
