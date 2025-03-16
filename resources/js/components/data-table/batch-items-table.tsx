import { DataTable } from '@/components/data-table'; // Adjust the import path as needed
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';

interface ItemUnit {
    id: number;
    name: string;
    abbreviation: string;
}

interface ItemCategory {
    id: number;
    name: string;
}

interface Item {
    id: number;
    name: string;
    item_category: ItemCategory;
    item_unit: ItemUnit;
}

interface SourceAble {
    id: number;
    name: string;
}

interface BatchItem {
    id: number;
    sku: string;
    item_id: number;
    item: Item;
    source_able_id: number;
    source_able_type: string;
    source_able: SourceAble;
    received_at: string;
    cogs: number;
    stock: number;
}

interface BatchItemsTableProps {
    itemId: number | string;
    sourceAbleId: number | string;
    sourceAbleType: string;
}

export function BatchItemsTable({ itemId, sourceAbleId, sourceAbleType }: BatchItemsTableProps) {
    const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Format tanggal dan waktu
    const formatDateTime = (dateTimeStr: string) => {
        if (!dateTimeStr) return 'N/A';
        const date = new Date(dateTimeStr);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatQuantity = (quantity: number, unitName: string) => {
        if (isNaN(quantity)) return `0 ${unitName}`;

        if (quantity % 1 === 0) {
            return `${Math.floor(quantity)} ${unitName}`;
        } else {
            return `${quantity} ${unitName}`;
        }
    };

    useEffect(() => {
        const fetchBatchItems = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    route('item.getItemBatch', {
                        item_id: itemId,
                        source_able_id: sourceAbleId,
                        source_able_type: sourceAbleType,
                    }),
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server response:', errorText);
                    throw new Error(`Failed to fetch batch items: ${response.status}`);
                }

                const data = await response.json();

                // Add validation for the expected data structure
                let items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];

                // Ensure each item has the required nested properties and add row number
                items = items.map((item, index) => ({
                    ...item,
                    rowNumber: index + 1,
                    item: item.item || { name: 'Unknown', itemUnit: { name: '' }, itemCategory: {} },
                    source_able: item.source_able || { name: 'Unknown' },
                }));

                setBatchItems(items);
            } catch (err) {
                console.error('Error fetching batch items:', err);
                setError('Failed to load batch items. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        if (itemId && sourceAbleId && sourceAbleType) {
            fetchBatchItems();
        } else {
            setIsLoading(false);
            setError('Missing required parameters');
        }
    }, [itemId, sourceAbleId, sourceAbleType]);

    // Define columns for the DataTable
    const columns = useMemo<ColumnDef<BatchItem, any>[]>(
        () => [
            {
                accessorKey: 'rowNumber',
                header: '#',
                cell: ({ row }) => row.index + 1,
            },
            {
                accessorKey: 'sku',
                header: 'SKU',
                cell: ({ row }) => <div className="font-medium">{row.original.sku}</div>,
            },
            {
                accessorKey: 'item.name',
                header: 'Item Name',
                cell: ({ row }) => row.original.item?.name || 'N/A',
            },
            {
                accessorKey: 'stock',
                header: 'Stock',
                cell: ({ row }) => (
                    <div className={row.original.stock <= 0 ? 'text-red-500' : ''}>
                        {formatQuantity(row.original.stock, row.original.item?.item_unit?.abbreviation || '')}
                    </div>
                ),
            },
            {
                accessorKey: 'cogs',
                header: 'COGS',
                cell: ({ row }) => formatCurrency(row.original.cogs),
            },
            {
                accessorKey: 'received_at',
                header: 'Received At',
                cell: ({ row }) => formatDateTime(row.original.received_at),
            },
        ],
        [],
    );

    if (error) {
        return <div className="p-4 text-red-500">{error}</div>;
    }

    if (isLoading) {
        return (
            <div className="rounded-md border p-4">
                <div className="flex flex-col gap-4">
                    {Array(5)
                        .fill(0)
                        .map((_, index) => (
                            <div key={`loading-${index}`} className="flex gap-4">
                                <Skeleton className="h-5 w-8" />
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                        ))}
                </div>
            </div>
        );
    }

    return <DataTable data={batchItems} columns={columns} pageSize={10} />;
}
