import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn, formatDecimal } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DateRange } from 'react-day-picker';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/reports',
    },
    {
        title: 'Stock Movements',
        href: '/stock-movements',
    },
];

interface Item {
    id: number;
    name: string;
    code: string;
    price: string;
    stock: string;
    item_category: {
        id: number;
        name: string;
    };
    item_wholesale_unit: {
        id: number;
        name: string;
        abbreviation: string;
    } | null;
    item_unit: {
        id: number;
        name: string;
        abbreviation: string;
    };
}

interface Location {
    id: number;
    name: string;
    type: string; // Full class name
    model_type: 'warehouse' | 'branch'; // Just for UI display
}

interface StockMovement {
    source_able_name: string;
    item_name: string;
    item_from: string | null;
    item_unit: string;
    type: 'in' | 'out' | 'increased' | 'decreased' | 'balanced';
    previous_quantity: number;
    movement_quantity: number;
    after_quantity: number;
    reference_code: string | null;
    reference_type: string | null;
    reference_by: string | null;
    created_at_date: string;
    created_at_time: string;
}

interface FilterProps extends React.HTMLAttributes<HTMLDivElement> {
    onDateChange: (range: DateRange | undefined) => void;
    initialDateRange: DateRange;
    items: Item[];
    selectedItemId: string | null;
    onItemChange: (value: string | null) => void;
    locations: Location[];
    selectedLocationId: string | null;
    selectedLocationType: string | null;
    onLocationChange: (value: string | null, type: string | null) => void;
    movementTypes: { value: string; label: string }[];
    selectedMovementType: string | null;
    onMovementTypeChange: (value: string | null) => void;
}

// Enhanced Filter Component
// Updated Filter component with fixed reset button
function EnhancedFilter({
    className,
    onDateChange,
    initialDateRange,
    items,
    selectedItemId,
    onItemChange,
    locations,
    selectedLocationId,
    selectedLocationType,
    onLocationChange,
    movementTypes,
    selectedMovementType,
    onMovementTypeChange,
}: FilterProps) {
    const [date, setDate] = React.useState<DateRange | undefined>(initialDateRange);
    const isInitialMount = useRef(true);

    // Handle date change
    const handleDateSelect = (newDate: DateRange | undefined) => {
        setDate(newDate);

        if (newDate?.from && newDate?.to && !isInitialMount.current) {
            onDateChange(newDate);
        }
    };

    // Mark initial mount as complete after first render
    React.useEffect(() => {
        isInitialMount.current = false;
    }, []);

    // Update local state when props change
    React.useEffect(() => {
        setDate(initialDateRange);
    }, [initialDateRange]);

    // Handle reset filters
    const handleResetFilters = () => {
        // Get first and last day of current month
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Format dates for API
        const startDate = format(firstDayOfMonth, 'yyyy-MM-dd');
        const endDate = format(lastDayOfMonth, 'yyyy-MM-dd');

        // Reset date in local state
        setDate({
            from: firstDayOfMonth,
            to: lastDayOfMonth,
        });

        // Navigate directly to avoid multiple state updates
        window.location.href = route('reports.stock-movements', {
            start_date: startDate,
            end_date: endDate,
            page: 1,
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Date Range Picker */}
                <div className={cn('grid gap-2', className)}>
                    <label className="text-sm font-medium">Date Range</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={'outline'}
                                className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                <div className="flex flex-col truncate text-xs md:flex-row md:items-center md:gap-1 md:text-sm">
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">From:</span>
                                        <span>{format(date?.from || new Date(), 'dd-MMM-yyyy')}</span>
                                    </div>
                                    <div className="hidden md:inline">-</div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">To:</span>
                                        <span>{format(date?.to || new Date(), 'dd-MMM-yyyy')}</span>
                                    </div>
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleDateSelect}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Rest of filters unchanged */}
                {/* Location Filter */}
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Location</label>
                    <Combobox
                        value={selectedLocationId && selectedLocationType ? `${selectedLocationType}:${selectedLocationId}` : ''}
                        onValueChange={(value: string) => {
                            if (value === '') {
                                onLocationChange(null, null);
                            } else {
                                const [type, id] = value.split(':');
                                onLocationChange(id, type);
                            }
                        }}
                        options={[
                            { value: '', label: 'All Locations' },
                            ...locations
                                .filter((loc) => loc.model_type === 'warehouse')
                                .map((loc) => ({
                                    value: `${loc.type}:${loc.id}`,
                                    label: `${loc.name} (Warehouse)`,
                                })),
                            ...locations
                                .filter((loc) => loc.model_type === 'branch')
                                .map((loc) => ({
                                    value: `${loc.type}:${loc.id}`,
                                    label: `${loc.name} (Branch)`,
                                })),
                        ]}
                        placeholder="Select location"
                        searchPlaceholder="Search location..."
                        initialDisplayCount={10}
                    />
                </div>

                {/* Item Filter */}
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Item</label>
                    <Combobox
                        value={selectedItemId || ''}
                        onValueChange={(value: string) => onItemChange(value === '' ? null : value)}
                        options={[
                            { value: '', label: 'All Items' },
                            ...items.map((item) => ({
                                value: String(item.id),
                                label: `${item.name} (${item.code})`,
                            })),
                        ]}
                        placeholder="Select item"
                        searchPlaceholder="Search item..."
                        initialDisplayCount={10}
                    />
                </div>

                {/* Movement Type Filter */}
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Movement Type</label>
                    <Select value={selectedMovementType || 'all'} onValueChange={(value) => onMovementTypeChange(value === 'all' ? null : value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {movementTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Updated buttons section */}
            <div className="flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={handleResetFilters} // Use the new reset handler
                >
                    Reset Filters
                </Button>
            </div>
        </div>
    );
}

// Get movement type badge color
const getMovementTypeBadge = (type: string) => {
    switch (type) {
        case 'in':
            return <Badge className="bg-green-500 hover:bg-green-600">In</Badge>;
        case 'out':
            return <Badge className="bg-red-500 hover:bg-red-600">Out</Badge>;
        case 'increased':
            return <Badge className="bg-blue-500 hover:bg-blue-600">Increased</Badge>;
        case 'decreased':
            return <Badge className="bg-yellow-500 hover:bg-yellow-600">Decreased</Badge>;
        default:
            return <Badge>{type}</Badge>;
    }
};

// Movement type options for filter
const movementTypeOptions = [
    { value: 'in', label: 'In' },
    { value: 'out', label: 'Out' },
    { value: 'increased', label: 'Increased' },
    { value: 'decreased', label: 'Decreased' },
];

interface StockMovementsReportProps {
    items: Item[];
    warehouses: any[];
    branches: any[];
    stockMovements: StockMovement[];
}

export default function EnhancedStockMovementsReport({ items, warehouses, branches, stockMovements }: StockMovementsReportProps) {
    const hasInitialized = useRef(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('all');
    const itemsPerPage = 10;

    // Format dates in YYYY-MM-DD format
    const formatDate = (date: Date | null | undefined): string => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Get first and last day of current month as defaults
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get current URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlStartDate = urlParams.get('start_date');
    const urlEndDate = urlParams.get('end_date');
    const urlItemId = urlParams.get('item_id');
    const urlSourceAbleId = urlParams.get('source_able_id');
    const urlSourceAbleType = urlParams.get('source_able_type');
    const urlMovementType = urlParams.get('type');
    const urlPage = urlParams.get('page');

    // Set initial date range from URL or default to current month
    const initialDateRange: DateRange = {
        from: urlStartDate ? new Date(urlStartDate) : firstDayOfMonth,
        to: urlEndDate ? new Date(urlEndDate) : lastDayOfMonth,
    };

    // Prepare location data with model type information for the UI
    const locations: Location[] = [
        ...warehouses.map((warehouse) => ({
            ...warehouse,
            type: 'App\\Models\\Warehouse', // Assuming this is the full class name
            model_type: 'warehouse' as const,
        })),
        ...branches.map((branch) => ({
            ...branch,
            type: 'App\\Models\\Branch', // Assuming this is the full class name
            model_type: 'branch' as const,
        })),
    ];

    // State for filters
    const [selectedItemId, setSelectedItemId] = useState<string | null>(urlItemId);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(urlSourceAbleId);
    const [selectedLocationType, setSelectedLocationType] = useState<string | null>(urlSourceAbleType);
    const [selectedMovementType, setSelectedMovementType] = useState<string | null>(urlMovementType);

    // Set initial page from URL or default to 1
    useEffect(() => {
        if (urlPage) {
            setCurrentPage(parseInt(urlPage));
        }
    }, [urlPage]);

    // Filter stock movements based on the active tab
    const filteredByTab = useMemo(() => {
        if (activeTab === 'all') return stockMovements;
        if (activeTab === 'in') return stockMovements.filter((m) => m.type === 'in' || m.type === 'increased');
        if (activeTab === 'out') return stockMovements.filter((m) => m.type === 'out' || m.type === 'decreased');
        return stockMovements;
    }, [stockMovements, activeTab]);

    // Calculate pagination info
    const totalItems = filteredByTab.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const from = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalItems);

    // Get paginated data for current page
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredByTab.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredByTab, currentPage, itemsPerPage]);

    // Handle date range change
    const handleDateRangeChange = (range: DateRange | undefined) => {
        if (range?.from && range?.to) {
            const startDate = formatDate(range.from);
            const endDate = formatDate(range.to);

            // Reset to page 1 when filters change
            setCurrentPage(1);

            // Navigate to the URL with query parameters
            router.visit(route('reports.stock-movements'), {
                data: {
                    start_date: startDate,
                    end_date: endDate,
                    item_id: selectedItemId || undefined,
                    source_able_id: selectedLocationId || undefined,
                    source_able_type: selectedLocationType || undefined,
                    type: selectedMovementType || undefined,
                    page: 1,
                },
                method: 'get',
                preserveState: true,
                replace: true,
                only: ['stockMovements'],
            });
        }
    };

    // Handle item filter change
    const handleItemChange = (itemId: string | null) => {
        setSelectedItemId(itemId);
        updateFilters(itemId, selectedLocationId, selectedLocationType, selectedMovementType);
    };

    // Handle location filter change
    const handleLocationChange = (locationId: string | null, locationType: string | null) => {
        setSelectedLocationId(locationId);
        setSelectedLocationType(locationType);
        updateFilters(selectedItemId, locationId, locationType, selectedMovementType);
    };

    // Handle movement type filter change
    const handleMovementTypeChange = (type: string | null) => {
        setSelectedMovementType(type);
        updateFilters(selectedItemId, selectedLocationId, selectedLocationType, type);
    };

    // Combined update filters function
    const updateFilters = (itemId: string | null, locationId: string | null, locationType: string | null, movementType: string | null) => {
        // Reset to page 1 when filters change
        setCurrentPage(1);

        // Get current dates from URL or use defaults
        const currentStartDate = urlStartDate || formatDate(firstDayOfMonth);
        const currentEndDate = urlEndDate || formatDate(lastDayOfMonth);

        // Navigation data object
        const data: any = {
            start_date: currentStartDate,
            end_date: currentEndDate,
            page: 1,
        };

        // Only add defined filters
        if (itemId) data.item_id = itemId;
        if (locationId) data.source_able_id = locationId;
        if (locationType) data.source_able_type = locationType;
        if (movementType) data.type = movementType;

        // Navigate with updated filters
        router.visit(route('reports.stock-movements'), {
            data,
            method: 'get',
            preserveState: true,
            replace: true,
            only: ['stockMovements'],
        });
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);

        // Update URL with new page but don't make a new request
        const currentStartDate = urlStartDate || formatDate(firstDayOfMonth);
        const currentEndDate = urlEndDate || formatDate(lastDayOfMonth);

        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('start_date', currentStartDate);
        url.searchParams.set('end_date', currentEndDate);

        if (selectedItemId) {
            url.searchParams.set('item_id', selectedItemId);
        } else {
            url.searchParams.delete('item_id');
        }

        if (selectedLocationId && selectedLocationType) {
            url.searchParams.set('source_able_id', selectedLocationId);
            url.searchParams.set('source_able_type', selectedLocationType);
        } else {
            url.searchParams.delete('source_able_id');
            url.searchParams.delete('source_able_type');
        }

        if (selectedMovementType) {
            url.searchParams.set('type', selectedMovementType);
        } else {
            url.searchParams.delete('type');
        }

        window.history.pushState({}, '', url.toString());
    };

    // Initialize with current month on first load if needed
    useEffect(() => {
        // Check if we've already initialized
        if (hasInitialized.current) {
            return;
        }

        // Mark as initialized to prevent infinite loops
        hasInitialized.current = true;

        // Only initialize if no date parameters in URL
        if (!urlStartDate || !urlEndDate) {
            router.visit(route('reports.stock-movements'), {
                data: {
                    start_date: formatDate(firstDayOfMonth),
                    end_date: formatDate(lastDayOfMonth),
                    item_id: selectedItemId || undefined,
                    source_able_id: selectedLocationId || undefined,
                    source_able_type: selectedLocationType || undefined,
                    type: selectedMovementType || undefined,
                    page: currentPage,
                },
                method: 'get',
                preserveState: true,
                replace: true,
                only: ['stockMovements'],
            });
        }
    }, []);

    // Generate pagination items
    const renderPaginationItems = () => {
        const items = [];

        // Always show first page
        items.push(
            <PaginationItem key="first">
                <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
                    1
                </PaginationLink>
            </PaginationItem>,
        );

        // Show ellipsis if needed
        if (currentPage > 3) {
            items.push(
                <PaginationItem key="ellipsis-1">
                    <PaginationEllipsis />
                </PaginationItem>,
            );
        }

        // Show current page and adjacent pages
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (i <= 1 || i >= totalPages) continue; // Skip first and last page (they're always shown)
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                        {i}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        // Show ellipsis if needed
        if (currentPage < totalPages - 2) {
            items.push(
                <PaginationItem key="ellipsis-2">
                    <PaginationEllipsis />
                </PaginationItem>,
            );
        }

        // Always show last page if there's more than one page
        if (totalPages > 1) {
            items.push(
                <PaginationItem key="last">
                    <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        return items;
    };

    // Handler for tab change
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setCurrentPage(1); // Reset to page 1 when tab changes
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports | Stock Movements" />
            <div className="rounded-lg bg-white px-6 py-6">
                {/* Header with title and description */}
                <div className="mb-6 flex flex-col space-y-4">
                    <Heading
                        title="Stock Movements Report"
                        description="Summary of stock movements including incoming, outgoing, and stock adjustments."
                    />

                    {/* Enhanced Filter Component */}
                    <EnhancedFilter
                        onDateChange={handleDateRangeChange}
                        initialDateRange={initialDateRange}
                        items={items}
                        selectedItemId={selectedItemId}
                        onItemChange={handleItemChange}
                        locations={locations}
                        selectedLocationId={selectedLocationId}
                        selectedLocationType={selectedLocationType}
                        onLocationChange={handleLocationChange}
                        movementTypes={movementTypeOptions}
                        selectedMovementType={selectedMovementType}
                        onMovementTypeChange={handleMovementTypeChange}
                    />
                </div>

                {/* Tabs for stock movement types */}
                <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="mb-6 w-full">
                    <TabsList className="mb-2 grid w-full grid-cols-3">
                        <TabsTrigger value="all">All Movements</TabsTrigger>
                        <TabsTrigger value="in">Stock In</TabsTrigger>
                        <TabsTrigger value="out">Stock Out</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-0">
                        {/* Stock Movements Table */}
                        <Card className="shadow-sm">
                            <div className="p-1 sm:p-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Movement Type</TableHead>
                                            <TableHead className="text-right">Initial Stock</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Final Stock</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>By</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={10} className="text-muted-foreground py-8 text-center">
                                                    No stock movement data found for this period
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedData.map((movement, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{movement.created_at_date}</TableCell>
                                                    <TableCell>{movement.created_at_time}</TableCell>
                                                    <TableCell className="font-medium">{movement.item_name}</TableCell>
                                                    <TableCell>{movement.source_able_name}</TableCell>
                                                    <TableCell>{getMovementTypeBadge(movement.type)}</TableCell>
                                                    <TableCell className="text-right">
                                                        {formatDecimal(movement.previous_quantity)} {movement.item_unit}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatDecimal(movement.movement_quantity)} {movement.item_unit}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatDecimal(movement.after_quantity)} {movement.item_unit}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-medium">{movement.reference_code}</span>
                                                            <span className="text-muted-foreground text-xs">{movement.reference_type}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{movement.reference_by}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="in" className="mt-0">
                        {/* Stock In Movements Table */}
                        <Card className="shadow-sm">
                            <div className="p-1 sm:p-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Movement Type</TableHead>
                                            <TableHead className="text-right">Initial Stock</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Final Stock</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>By</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={10} className="text-muted-foreground py-8 text-center">
                                                    No incoming stock data found for this period
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedData.map((movement, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{movement.created_at_date}</TableCell>
                                                    <TableCell>{movement.created_at_time}</TableCell>
                                                    <TableCell className="font-medium">{movement.item_name}</TableCell>
                                                    <TableCell>{movement.source_able_name}</TableCell>
                                                    <TableCell>{getMovementTypeBadge(movement.type)}</TableCell>
                                                    <TableCell className="text-right">
                                                        {formatDecimal(movement.previous_quantity)} {movement.item_unit}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatDecimal(movement.movement_quantity)} {movement.item_unit}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatDecimal(movement.after_quantity)} {movement.item_unit}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-medium">{movement.reference_code}</span>
                                                            <span className="text-muted-foreground text-xs">{movement.reference_type}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{movement.reference_by}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="out" className="mt-0">
                        {/* Identical table structure for "out" movements */}
                        <Card className="shadow-sm">
                            <div className="p-1 sm:p-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Movement Type</TableHead>
                                            <TableHead className="text-right">Initial Stock</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Final Stock</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>By</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={10} className="text-muted-foreground py-8 text-center">
                                                    No outgoing stock data found for this period
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedData.map((movement, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{movement.created_at_date}</TableCell>
                                                    <TableCell>{movement.created_at_time}</TableCell>
                                                    <TableCell className="font-medium">{movement.item_name}</TableCell>
                                                    <TableCell>{movement.source_able_name}</TableCell>
                                                    <TableCell>{getMovementTypeBadge(movement.type)}</TableCell>
                                                    <TableCell className="text-right">
                                                        {formatDecimal(movement.previous_quantity)} {movement.item_unit}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatDecimal(movement.movement_quantity)} {movement.item_unit}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatDecimal(movement.after_quantity)} {movement.item_unit}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-medium">{movement.reference_code}</span>
                                                            <span className="text-muted-foreground text-xs">{movement.reference_type}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{movement.reference_by}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex w-full flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="text-muted-foreground w-full text-sm md:text-left">
                            Showing {from} to {to} of {totalItems} entries
                        </div>
                        <div className="flex w-full justify-end md:justify-end">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>

                                    {renderPaginationItems()}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
