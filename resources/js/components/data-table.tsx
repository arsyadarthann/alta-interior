import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    Row,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface ServerSidePaginationProps {
    pageCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    totalItems?: number;
}

interface DataTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    pageSize?: number;
    rowClassName?: (row: Row<TData>) => string;
    summaryContent?: ReactNode;
    serverPagination?: ServerSidePaginationProps;
}

export function DataTable<TData>({ data, columns, pageSize = 10, rowClassName, summaryContent, serverPagination }: DataTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [{ pageIndex, pageSize: currentPageSize }, setPagination] = useState({
        pageIndex: 0,
        pageSize: pageSize,
    });

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            pagination: {
                pageIndex: serverPagination ? serverPagination.currentPage - 1 : pageIndex,
                pageSize: currentPageSize,
            },
        },
        onSortingChange: setSorting,
        onPaginationChange: serverPagination
            ? () => {} // Pagination is managed by server when using serverPagination
            : setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: !serverPagination ? getPaginationRowModel() : undefined,
        getSortedRowModel: getSortedRowModel(),
        manualPagination: !!serverPagination, // Enable manual pagination when using server-side
        pageCount: serverPagination ? serverPagination.pageCount : undefined,
    });

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
                {/* The main table */}
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={rowClassName?.(row)}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="max-w-[200px] sm:max-w-[250px] md:max-w-[300px]">
                                            <div className="truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : serverPagination?.isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading data...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {summaryContent}
            </div>

            <div className="flex flex-row items-center justify-between gap-2 overflow-x-auto py-4">
                <div className="flex-shrink-0">
                    <p className="text-muted-foreground text-sm whitespace-nowrap">
                        {serverPagination ? (
                            <>
                                {serverPagination.totalItems !== undefined ? (
                                    <>
                                        Showing {Math.min(serverPagination.totalItems, 1)} to{' '}
                                        {Math.min(currentPageSize * serverPagination.currentPage, serverPagination.totalItems)} of{' '}
                                        {serverPagination.totalItems} results
                                    </>
                                ) : (
                                    <>
                                        Page {serverPagination.currentPage} of {serverPagination.pageCount}
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                Showing{' '}
                                <span className="font-medium">
                                    {table.getState().pagination.pageSize * table.getState().pagination.pageIndex + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium">
                                    {Math.min(
                                        table.getState().pagination.pageSize * (table.getState().pagination.pageIndex + 1),
                                        table.getFilteredRowModel().rows.length,
                                    )}
                                </span>{' '}
                                of <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> results
                            </>
                        )}
                    </p>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (serverPagination) {
                                serverPagination.onPageChange(serverPagination.currentPage - 1);
                            } else {
                                table.previousPage();
                            }
                        }}
                        disabled={
                            (serverPagination ? serverPagination.currentPage <= 1 : !table.getCanPreviousPage()) || !!serverPagination?.isLoading
                        }
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        <Input
                            type="number"
                            min={1}
                            max={serverPagination ? serverPagination.pageCount : table.getPageCount()}
                            value={serverPagination ? serverPagination.currentPage : table.getState().pagination.pageIndex + 1}
                            onChange={(e) => {
                                const page = e.target.value ? Number(e.target.value) : 1;
                                if (serverPagination) {
                                    if (page >= 1 && page <= serverPagination.pageCount) {
                                        serverPagination.onPageChange(page);
                                    }
                                } else {
                                    if (page >= 1 && page <= table.getPageCount()) {
                                        table.setPageIndex(page - 1);
                                    }
                                }
                            }}
                            className="h-8 w-16 text-center"
                            disabled={serverPagination?.isLoading}
                        />
                        <span className="text-muted-foreground text-sm">
                            of {serverPagination ? serverPagination.pageCount : table.getPageCount()}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (serverPagination) {
                                serverPagination.onPageChange(serverPagination.currentPage + 1);
                            } else {
                                table.nextPage();
                            }
                        }}
                        disabled={
                            (serverPagination ? serverPagination.currentPage >= serverPagination.pageCount : !table.getCanNextPage()) ||
                            !!serverPagination?.isLoading
                        }
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
