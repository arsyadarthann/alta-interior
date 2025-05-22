import { DataTable } from '@/components/data-table';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft } from 'lucide-react';

interface ItemUnit {
    id: number;
    abbreviation: string;
    name: string;
}

interface StockAdjustmentDetail {
    id: number;
    stock_adjustment_id: number;
    type: string;
    item_id: number;
    before_adjustment_quantity: number;
    adjustment_quantity: number;
    after_adjustment_quantity: number;
    reason: string | null;
    item: {
        id: number;
        name: string;
        unit: string;
        item_unit: ItemUnit;
    };
}

interface StockAdjustmentProps {
    stockAdjustment: {
        id: number;
        code: string;
        date: string;
        source_able_id: string;
        source_able_type: string;
        user_id: number;
        source_able: {
            id: number;
            name: string;
        };
        user: {
            id: number;
            name: string;
        };
        stock_adjustment_details: StockAdjustmentDetail[];
    };
}

export default function Show({ stockAdjustment }: StockAdjustmentProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Stock',
            href: '#',
        },
        {
            title: 'Adjustment',
            href: route('stock.adjustment.index'),
        },
        {
            title: stockAdjustment.code,
            href: route('stock.adjustment.show', stockAdjustment.id),
        },
    ];

    const columns: ColumnDef<StockAdjustmentDetail>[] = [
        createNumberColumn<StockAdjustmentDetail>(),
        {
            accessorKey: 'item.name',
            header: 'Item Name',
        },
        {
            accessorKey: 'before_adjustment_quantity',
            header: 'Before',
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue('before_adjustment_quantity'));
                const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
                return `${formattedQty} ${row.original.item.item_unit.abbreviation}`;
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'after_adjustment_quantity',
            header: 'After',
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue('after_adjustment_quantity'));
                const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');

                return `${formattedQty} ${row.original.item.item_unit.abbreviation}`;
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'adjustment_quantity',
            header: 'Adjustment',
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue('adjustment_quantity'));
                const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
                const type = row.original.type;
                let typeColor = 'bg-gray-100 text-gray-800';
                let typeIcon = '';
                if (type === 'increased') {
                    typeColor = 'bg-green-100 text-green-800';
                    typeIcon = '↑';
                } else if (type === 'decreased') {
                    typeColor = 'bg-red-100 text-red-800';
                    typeIcon = '↓';
                }
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${typeColor}`}>
                        {typeIcon} {formattedQty} {row.original.item.item_unit.abbreviation}
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

    const getSourceTypeLabel = () => {
        if (stockAdjustment.source_able_type) {
            if (stockAdjustment.source_able_type.includes('Branch')) {
                return 'Branch';
            } else if (stockAdjustment.source_able_type.includes('Warehouse')) {
                return 'Warehouse';
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Stock Adjustment: ${stockAdjustment.code}`} />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Stock Adjustment" description="Stock adjustment details and results" />
                    <div className="flex gap-3">
                        <Link href={route('stock.adjustment.index')}>
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
                                <h2 className="mb-4 text-base font-semibold text-gray-900">Adjustment Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Adjustment Code</h3>
                                            <p className="mt-1 text-sm text-gray-900">{stockAdjustment.code}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Adjustment Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(stockAdjustment.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Adjustment By</h3>
                                            <p className="mt-1 text-sm text-gray-900">{stockAdjustment.user.name}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">{getSourceTypeLabel()}</h3>
                                            <p className="mt-1 text-sm text-gray-900">{stockAdjustment.source_able.name}</p>
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
                                    <h2 className="text-base font-semibold text-gray-900">Adjustment Items</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {stockAdjustment.stock_adjustment_details.length} items
                                    </Badge>
                                </div>

                                {stockAdjustment.stock_adjustment_details.length > 0 ? (
                                    <DataTable data={stockAdjustment.stock_adjustment_details} columns={columns} searchable={false} pageSize={10} />
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No adjustment items found</p>
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
