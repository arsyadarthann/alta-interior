import { DataTable } from '@/components/data-table';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Edit, Lock } from 'lucide-react';

interface ItemUnit {
    id: number;
    abbreviation: string;
    name: string;
}

interface StockAuditDetail {
    id: number;
    stock_audit_id: number;
    item_id: number;
    system_quantity: number;
    physical_quantity: number;
    discrepancy_quantity: number;
    reason: string | null;
    item: {
        id: number;
        name: string;
        unit: string;
        item_unit: ItemUnit;
    };
}

interface Branch {
    id: number;
    name: string;
}

interface Warehouse {
    id: number;
    name: string;
}

interface StockAuditProps {
    stockAudit: {
        id: number;
        code: string;
        date: string;
        source_able_type: string;
        source_able_id: string;
        branch_id?: number; // For backward compatibility
        user_id: number;
        is_locked: boolean;
        branch?: Branch;
        warehouse?: Warehouse;
        source_able?: Branch | Warehouse;
        user: {
            id: number;
            name: string;
        };
        stock_audit_details: StockAuditDetail[];
    };
}

export default function Show({ stockAudit }: StockAuditProps) {
    const { hasPermission } = usePermissions();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Stock',
            href: '#',
        },
        {
            title: 'Audit',
            href: route('stock.audit.index'),
        },
        {
            title: stockAudit.code,
            href: route('stock.audit.show', stockAudit.id),
        },
    ];

    const handleEdit = () => {
        router.visit(route('stock.audit.edit', stockAudit.id));
    };

    const handleToggleLock = () => {
        router.patch(route('stock.audit.lock', stockAudit.id));
    };

    const columns: ColumnDef<StockAuditDetail>[] = [
        createNumberColumn<StockAuditDetail>(),
        {
            accessorKey: 'item.name',
            header: 'Item Name',
        },
        {
            accessorKey: 'system_quantity',
            header: 'System Quantity',
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue('system_quantity'));
                const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
                return `${formattedQty} ${row.original.item.item_unit.abbreviation}`;
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'physical_quantity',
            header: 'Physical Count',
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue('physical_quantity'));
                const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
                return `${formattedQty} ${row.original.item.item_unit.abbreviation}`;
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'discrepancy_quantity',
            header: 'Discrepancy',
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue('discrepancy_quantity'));
                const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
                return (
                    <span className={qty < 0 ? 'text-red-500' : qty > 0 ? 'text-green-500' : 'text-gray-500'}>
                        {formattedQty} {row.original.item.item_unit.abbreviation}
                    </span>
                );
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'reason',
            header: 'Reason',
            cell: ({ row }) => row.getValue('reason') || '-',
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

    // Get the source name based on source_able_type
    const getSourceName = () => {
        // Check if source_able is loaded
        if (stockAudit.source_able) {
            return stockAudit.source_able.name;
        }

        // Fallback to branch for backwards compatibility
        if (stockAudit.branch) {
            return stockAudit.branch.name;
        }

        // If warehouse is available
        if (stockAudit.warehouse) {
            return stockAudit.warehouse.name;
        }

        return 'Unknown';
    };

    // Get the source type label based on source_able_type
    const getSourceTypeLabel = () => {
        if (stockAudit.source_able_type) {
            if (stockAudit.source_able_type.includes('Branch')) {
                return 'Branch';
            } else if (stockAudit.source_able_type.includes('Warehouse')) {
                return 'Warehouse';
            }
        }

        // Fallback label
        return stockAudit.branch ? 'Branch' : 'Location';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Stock Audit: ${stockAudit.code}`} />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Stock Audit" description="Stock audit details and results" />
                    <div className="flex gap-3">
                        <Link href={route('stock.audit.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                        {hasPermission('update_stock_audit') && !stockAudit.is_locked && (
                            <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2">
                                <Edit className="h-4 w-4" /> Edit
                            </Button>
                        )}
                        {hasPermission('update_stock_audit') && !stockAudit.is_locked && (
                            <Button
                                onClick={handleToggleLock}
                                variant={stockAudit.is_locked ? 'destructive' : 'default'}
                                className="flex items-center gap-2"
                            >
                                <Lock className="h-4 w-4" /> Lock
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <Card className="h-full border-0 shadow-sm">
                            <div className="p-6">
                                <h2 className="mb-4 text-base font-semibold text-gray-900">Audit Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Audit Code</h3>
                                            <p className="mt-1 text-sm text-gray-900">{stockAudit.code}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Audit Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(stockAudit.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Audited By</h3>
                                            <p className="mt-1 text-sm text-gray-900">{stockAudit.user.name}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">{getSourceTypeLabel()}</h3>
                                            <p className="mt-1 text-sm text-gray-900">{getSourceName()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                            <div className="mt-1">
                                                {stockAudit.is_locked ? (
                                                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                                                        Locked
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                        Not Locked
                                                    </Badge>
                                                )}
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
                                    <h2 className="text-base font-semibold text-gray-900">Audit Items</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {stockAudit.stock_audit_details.length} items
                                    </Badge>
                                </div>

                                {stockAudit.stock_audit_details.length > 0 ? (
                                    <DataTable data={stockAudit.stock_audit_details} columns={columns} pageSize={10} />
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No audit items found</p>
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
