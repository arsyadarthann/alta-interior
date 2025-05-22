import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    type ColumnDef,
    type ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    Row,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { Filter, Loader2, Search, X } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

interface ServerSidePaginationProps {
    pageCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    totalItems?: number;
}

interface FilterOption {
    id: string;
    label: string;
    type?: 'select' | 'date' | 'text';
    options?: { label: string; value: string }[];
}

interface DataTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    pageSize?: number;
    rowClassName?: (row: Row<TData>) => string;
    summaryContent?: ReactNode;
    serverPagination?: ServerSidePaginationProps;
    // Properti untuk search dan filter
    searchable?: boolean;
    searchPlaceholder?: string;
    searchValue?: string;
    filterOptions?: FilterOption[];
    onSearchChange?: (value: string) => void;
    onFilterChange?: (filters: Record<string, string>) => void;
    // Properti untuk kompatibilitas dengan API lama
    filters?: Array<{
        id: string;
        title: string;
        options: { label: string; value: string }[];
        value: string;
        onChange: (value: string) => void;
    }>;
}

export function DataTable<TData>({
    data,
    columns,
    pageSize = 10,
    rowClassName,
    summaryContent,
    serverPagination,
    searchable = true,
    searchPlaceholder = 'Cari...',
    searchValue = '',
    filterOptions = [],
    onSearchChange,
    onFilterChange,
    filters = [],
}: DataTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [{ pageIndex, pageSize: currentPageSize }, setPagination] = useState({
        pageIndex: 0,
        pageSize: pageSize,
    });
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

    // Inisialisasi activeFilters dari props filters (untuk kompatibilitas)
    useEffect(() => {
        if (filters && filters.length > 0) {
            const initialFilters: Record<string, string> = {};
            filters.forEach((filter) => {
                if (filter.value) {
                    initialFilters[filter.id] = filter.value;
                }
            });
            setActiveFilters((prev) => ({ ...prev, ...initialFilters }));
        }
    }, [filters]);

    // Effect untuk menghandle perubahan filter
    useEffect(() => {
        if (onFilterChange) {
            onFilterChange(activeFilters);
        }
    }, [activeFilters, onFilterChange]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            pagination: {
                pageIndex: serverPagination ? serverPagination.currentPage - 1 : pageIndex,
                pageSize: currentPageSize,
            },
            globalFilter: searchValue,
            columnFilters,
        },
        onGlobalFilterChange: onSearchChange,
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        onPaginationChange: serverPagination ? () => {} : setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: !serverPagination ? getPaginationRowModel() : undefined,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: !serverPagination ? getFilteredRowModel() : undefined,
        manualPagination: !!serverPagination,
        manualFiltering: !!onSearchChange || !!onFilterChange,
        pageCount: serverPagination ? serverPagination.pageCount : undefined,
    });

    // Function untuk handle filter change
    const handleFilterChange = (filterId: string, value: string) => {
        setActiveFilters((prev) => {
            const newFilters = { ...prev };
            if (value === 'all') {
                delete newFilters[filterId];
            } else {
                newFilters[filterId] = value;
            }
            return newFilters;
        });

        // Handle untuk backward compatibility dengan API lama
        if (filters.length > 0) {
            const filter = filters.find((f) => f.id === filterId);
            if (filter && filter.onChange) {
                filter.onChange(value === 'all' ? '' : value);
            }
        }
    };

    // Function untuk reset semua filter
    const handleResetFilters = () => {
        setActiveFilters({});
        if (onSearchChange) {
            onSearchChange('');
        }

        // Reset filters untuk backward compatibility
        if (filters.length > 0) {
            filters.forEach((filter) => {
                if (filter.onChange) {
                    filter.onChange('');
                }
            });
        }
    };

    // Fungsi untuk menghasilkan array halaman yang ditampilkan di pagination
    const generatePaginationItems = () => {
        const totalPages = serverPagination ? serverPagination.pageCount : table.getPageCount();
        const currentPage = serverPagination ? serverPagination.currentPage : pageIndex + 1;

        let pages: (number | 'ellipsis')[] = [];

        if (totalPages <= 1) return pages;

        // Selalu tampilkan halaman pertama
        pages.push(1);

        // Jika halaman saat ini lebih dari 3, tambahkan ellipsis setelah halaman pertama
        if (currentPage > 3) {
            pages.push('ellipsis');
        }

        // Tambahkan halaman di sekitar halaman saat ini
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (i < currentPage + 2 && i > currentPage - 2) {
                pages.push(i);
            }
        }

        // Jika halaman saat ini kurang dari totalPages - 2, tambahkan ellipsis sebelum halaman terakhir
        if (currentPage < totalPages - 2) {
            pages.push('ellipsis');
        }

        // Selalu tampilkan halaman terakhir jika lebih dari 1 halaman
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    const handlePageChange = (page: number) => {
        if (serverPagination) {
            serverPagination.onPageChange(page);
        } else {
            table.setPageIndex(page - 1);
        }
    };

    const currentPage = serverPagination ? serverPagination.currentPage : pageIndex + 1;
    const totalPages = serverPagination ? serverPagination.pageCount : table.getPageCount();
    const isLoading = serverPagination?.isLoading || false;

    // Gabungkan filterOptions dan filters untuk backward compatibility
    const mergedFilterOptions = [...filterOptions];

    filters.forEach((filter) => {
        if (!mergedFilterOptions.some((fo) => fo.id === filter.id)) {
            mergedFilterOptions.push({
                id: filter.id,
                label: filter.title,
                type: 'select',
                options: filter.options.map((o) => ({
                    label: o.label,
                    value: o.value === '' ? 'all' : o.value,
                })),
            });
        }
    });

    // Hitung jumlah filter aktif untuk menampilkan badge
    const activeFilterCount = Object.keys(activeFilters).length + (searchValue ? 1 : 0);

    return (
        <div className="rounded-md border">
            {/* Header dengan search dan filter */}
            <div className="border-b p-4">
                <div className="flex items-center justify-between gap-4">
                    <div></div> {/* Empty div to push content to the right */}
                    <div className="flex items-center gap-2">
                        {searchable && (
                            <div className="relative w-full sm:w-64 md:w-72">
                                <div className="border-input relative flex items-center overflow-hidden rounded-md border">
                                    <Search className="text-muted-foreground absolute left-3 h-4 w-4" />
                                    <Input
                                        placeholder={searchPlaceholder}
                                        value={searchValue}
                                        onChange={(e) => onSearchChange?.(e.target.value)}
                                        className="border-0 pr-9 pl-9 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    />
                                    {searchValue && (
                                        <X
                                            className="text-muted-foreground hover:text-foreground absolute right-3 h-4 w-4 cursor-pointer"
                                            onClick={() => onSearchChange?.('')}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {mergedFilterOptions.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="relative">
                                        <Filter className="h-4 w-4" />
                                        {activeFilterCount > 0 && (
                                            <span className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-72">
                                    <div className="flex items-center justify-between p-2">
                                        <DropdownMenuLabel>Filters</DropdownMenuLabel>
                                        <Button
                                            variant="ghost"
                                            onClick={handleResetFilters}
                                            className="h-8 px-2 text-sm text-red-500 hover:text-red-700"
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <div className="max-h-[400px] overflow-auto p-2">
                                        {mergedFilterOptions.map((filter) => {
                                            // Cari nilai filter dari activeFilters atau API lama
                                            const oldFilter = filters.find((f) => f.id === filter.id);
                                            const currentFilterValue =
                                                activeFilters[filter.id] || (oldFilter?.value === '' ? 'all' : oldFilter?.value) || 'all';

                                            return (
                                                <div key={filter.id} className="mb-4 last:mb-0">
                                                    <h4 className="mb-2 text-sm font-medium">{filter.label}</h4>
                                                    {(filter.type === 'select' || !filter.type) && filter.options && (
                                                        <Select
                                                            value={currentFilterValue}
                                                            onValueChange={(value) => handleFilterChange(filter.id, value)}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder={`Semua ${filter.label}`} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">Semua</SelectItem>
                                                                {filter.options
                                                                    .filter((option) => option.value !== '' && option.value !== 'all')
                                                                    .map((option) => (
                                                                        <SelectItem key={option.value} value={option.value}>
                                                                            {option.label}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}

                                                    {filter.type === 'date' && (
                                                        <DatePicker
                                                            placeholder="dd/mm/yyyy"
                                                            value={activeFilters[filter.id] ? new Date(activeFilters[filter.id]) : undefined}
                                                            onChange={(date) => {
                                                                if (date) {
                                                                    handleFilterChange(filter.id, date.toISOString());
                                                                } else {
                                                                    handleFilterChange(filter.id, 'all');
                                                                }
                                                            }}
                                                        />
                                                    )}

                                                    {filter.type === 'text' && (
                                                        <Input
                                                            placeholder={`Filter by ${filter.label}`}
                                                            value={activeFilters[filter.id] || ''}
                                                            onChange={(e) => handleFilterChange(filter.id, e.target.value || 'all')}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Active filters display */}
                {(searchValue || Object.keys(activeFilters).length > 0) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        {searchValue && (
                            <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium">
                                <span>Search: {searchValue}</span>
                                <X
                                    className="text-muted-foreground hover:text-foreground h-3 w-3 cursor-pointer"
                                    onClick={() => onSearchChange?.('')}
                                />
                            </div>
                        )}

                        {Object.entries(activeFilters).map(([key, value]) => {
                            const filterOption = mergedFilterOptions.find((f) => f.id === key);
                            const optionLabel =
                                filterOption?.type === 'select' ? filterOption?.options?.find((o) => o.value === value)?.label || value : value;

                            return (
                                <div key={key} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium">
                                    <span>
                                        {filterOption?.label || key}: {optionLabel}
                                    </span>
                                    <X
                                        className="text-muted-foreground hover:text-foreground h-3 w-3 cursor-pointer"
                                        onClick={() => handleFilterChange(key, 'all')}
                                    />
                                </div>
                            );
                        })}

                        {(searchValue || Object.keys(activeFilters).length > 0) && (
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-sm" onClick={handleResetFilters}>
                                <X className="mr-1 h-3 w-3" />
                                Clear all
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Main Table */}
            <div className="overflow-x-auto">
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

            {/* Footer with pagination */}
            <div className="flex flex-col items-center justify-between gap-4 border-t p-4 sm:flex-row">
                <div className="w-full sm:w-auto">
                    <p className="text-muted-foreground text-sm whitespace-nowrap">
                        {serverPagination ? (
                            serverPagination.totalItems !== undefined ? (
                                <>
                                    Showing {(currentPage - 1) * currentPageSize + 1} to{' '}
                                    {Math.min(currentPageSize * currentPage, serverPagination.totalItems)} of {serverPagination.totalItems} results
                                </>
                            ) : (
                                <>
                                    Page {serverPagination.currentPage} of {serverPagination.pageCount}
                                </>
                            )
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

                <div className="w-full sm:ml-auto sm:w-auto">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage <= 1 || isLoading}
                                    aria-disabled={currentPage <= 1 || isLoading}
                                    className={`${currentPage <= 1 || isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                                />
                            </PaginationItem>

                            {generatePaginationItems().map((page, i) => (
                                <PaginationItem key={i}>
                                    {page === 'ellipsis' ? (
                                        <PaginationEllipsis />
                                    ) : (
                                        <PaginationLink
                                            isActive={page === currentPage}
                                            onClick={() => handlePageChange(page)}
                                            disabled={isLoading}
                                            className={isLoading ? 'pointer-events-none' : 'cursor-pointer'}
                                        >
                                            {page}
                                        </PaginationLink>
                                    )}
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= totalPages || isLoading}
                                    aria-disabled={currentPage >= totalPages || isLoading}
                                    className={`${currentPage >= totalPages || isLoading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    );
}
