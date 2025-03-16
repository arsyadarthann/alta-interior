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
import { ArrowLeft, Edit } from 'lucide-react';

interface ItemUnit {
    id: number;
    abbreviation: string;
    name: string;
}

interface Location {
    id: number;
    name: string;
    type?: string;
}

interface StockTransferDetail {
    id: number;
    stock_transfer_id: number;
    item_id: number;
    quantity: number;
    source_before_quantity: number;
    source_after_quantity: number;
    destination_before_quantity: number;
    destination_after_quantity: number;
    item: {
        id: number;
        name: string;
        code: string;
        item_unit: ItemUnit;
    };
}

interface StockTransferProps {
    stockTransfer: {
        id: number;
        code: string;
        date: string;
        source_able_id: number;
        source_able_type: string;
        destination_able_id: number;
        destination_able_type: string;
        source_able: Location;
        destination_able: Location;
        user: {
            id: number;
            name: string;
        };
        stock_transfer_details: StockTransferDetail[];
    };
}

export default function Show({ stockTransfer }: StockTransferProps) {
    const { hasPermission } = usePermissions();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Stock',
            href: '#',
        },
        {
            title: 'Transfer',
            href: route('stock.transfer.index'),
        },
        {
            title: stockTransfer.code,
            href: route('stock.transfer.show', stockTransfer.id),
        },
    ];

    const handleEdit = () => {
        router.visit(route('stock.transfer.edit', stockTransfer.id));
    };

    const columns: ColumnDef<StockTransferDetail>[] = [
        createNumberColumn<StockTransferDetail>(),
        {
            accessorKey: 'item.name',
            header: 'Item Name',
            cell: ({ row }) => `${row.original.item.name} (${row.original.item.code})`,
        },
        {
            accessorKey: 'quantity',
            header: 'Quantity',
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue('quantity'));
                const formattedQty = qty % 1 === 0 ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '');
                return `${formattedQty} ${row.original.item.item_unit.abbreviation}`;
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'source_before_quantity',
            header: 'Source Stock',
            cell: ({ row }) => {
                const beforeQty = parseFloat(row.getValue('source_before_quantity'));
                const afterQty = parseFloat(row.original.source_after_quantity);
                const formattedBeforeQty = beforeQty % 1 === 0 ? beforeQty.toString() : beforeQty.toFixed(2).replace(/\.?0+$/, '');
                const formattedAfterQty = afterQty % 1 === 0 ? afterQty.toString() : afterQty.toFixed(2).replace(/\.?0+$/, '');
                const unitAbbreviation = row.original.item.item_unit.abbreviation;

                return (
                    <div className="items-left flex flex-col">
                        <div className="flex items-center space-x-2">
                            <span className="font-medium">
                                {formattedBeforeQty} {unitAbbreviation}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className={`font-semibold ${afterQty < 0 ? 'text-red-500' : afterQty > 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                                {formattedAfterQty} {unitAbbreviation}
                            </span>
                        </div>
                        {afterQty < 0 && <span className="mt-1 text-xs text-red-500">Low Stock</span>}
                    </div>
                );
            },
            meta: {
                className: 'text-center',
            },
        },
        {
            accessorKey: 'destination_before_quantity',
            header: 'Destination Stock',
            cell: ({ row }) => {
                const beforeQty = parseFloat(row.getValue('destination_before_quantity'));
                const afterQty = parseFloat(row.original.destination_after_quantity);
                const formattedBeforeQty = beforeQty % 1 === 0 ? beforeQty.toString() : beforeQty.toFixed(2).replace(/\.?0+$/, '');
                const formattedAfterQty = afterQty % 1 === 0 ? afterQty.toString() : afterQty.toFixed(2).replace(/\.?0+$/, '');
                const unitAbbreviation = row.original.item.item_unit.abbreviation;

                return (
                    <div className="items-left flex flex-col">
                        <div className="flex items-center space-x-2">
                            <span className="font-medium">
                                {formattedBeforeQty} {unitAbbreviation}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className={`font-semibold ${afterQty < 0 ? 'text-red-500' : afterQty > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                {formattedAfterQty} {unitAbbreviation}
                            </span>
                        </div>
                        {afterQty < 0 && <span className="mt-1 text-xs text-red-500">Low Stock</span>}
                    </div>
                );
            },
            meta: {
                className: 'text-center',
            },
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

    // Helper function to get location display name with type
    const getLocationDisplayName = (location: Location) => {
        const typeLabel = location.type === 'Branch' ? 'Branch' : location.type === 'Warehouse' ? 'Warehouse' : '';
        return `${location.name} ${typeLabel ? `(${typeLabel})` : ''}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Stock Transfer: ${stockTransfer.code}`} />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Stock Transfer" description="Stock transfer details and items" />
                    <div className="flex gap-3">
                        <Link href={route('stock.transfer.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                        {hasPermission('update_stock_transfer') && (
                            <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2">
                                <Edit className="h-4 w-4" /> Edit
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <Card className="h-full border-0 shadow-sm">
                            <div className="p-6">
                                <h2 className="mb-4 text-base font-semibold text-gray-900">Transfer Information</h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Transfer Code</h3>
                                            <p className="mt-1 text-sm text-gray-900">{stockTransfer.code}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Transfer Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(stockTransfer.date)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Transferred By</h3>
                                            <p className="mt-1 text-sm text-gray-900">{stockTransfer.user.name}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Transfer Route</h3>
                                            <div className="mt-1 text-sm text-gray-900">
                                                <div className="flex flex-col space-y-1">
                                                    <div className="flex items-center">
                                                        <span className="w-12 font-medium text-gray-600">From</span>
                                                        <span className="mr-1">:</span>
                                                        <span>{getLocationDisplayName(stockTransfer.source_able)}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="w-12 font-medium text-gray-600">To</span>
                                                        <span className="mr-1">:</span>
                                                        <span>{getLocationDisplayName(stockTransfer.destination_able)}</span>
                                                    </div>
                                                </div>
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
                                    <h2 className="text-base font-semibold text-gray-900">Transfer Items</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {stockTransfer.stock_transfer_details.length} items
                                    </Badge>
                                </div>

                                {stockTransfer.stock_transfer_details.length > 0 ? (
                                    <DataTable data={stockTransfer.stock_transfer_details} columns={columns} pageSize={10} />
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No transfer items found</p>
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
