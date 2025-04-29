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
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, CalendarIcon, DollarSign, PackageIcon, ShoppingCart, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Sales',
        href: '/sales',
    },
];

// Mocked data for the dashboard
const revenueData = [
    { month: 'Jan', revenue: 65000, target: 60000, orders: 120 },
    { month: 'Feb', revenue: 59000, target: 62000, orders: 110 },
    { month: 'Mar', revenue: 80000, target: 65000, orders: 140 },
    { month: 'Apr', revenue: 81000, target: 68000, orders: 145 },
    { month: 'May', revenue: 76000, target: 70000, orders: 135 },
    { month: 'Jun', revenue: 85000, target: 73000, orders: 150 },
];

const salesStatusData = [
    { name: 'Paid', value: 65, color: '#22c55e' },
    { name: 'Partially Paid', value: 25, color: '#f59e0b' },
    { name: 'Unpaid', value: 10, color: '#ef4444' },
];

const orderStatusData = [
    { name: 'Completed', value: 55, color: '#22c55e' },
    { name: 'Processed', value: 25, color: '#3b82f6' },
    { name: 'Pending', value: 15, color: '#f59e0b' },
    { name: 'Cancelled', value: 5, color: '#ef4444' },
];

const branchPerformance = [
    { name: 'Branch A', sales: 32000, target: 30000 },
    { name: 'Branch B', sales: 28000, target: 29000 },
    { name: 'Branch C', sales: 22000, target: 25000 },
    { name: 'Branch D', sales: 19000, target: 20000 },
];

const pendingOrders = [
    { id: 'SO-2025042501', customer: 'ABC Corp', date: '2025-04-23', items: 5, total: 2850, status: 'Pending Waybill' },
    { id: 'SO-2025042498', customer: 'XYZ Ltd', date: '2025-04-22', items: 3, total: 1750, status: 'Pending Waybill' },
    { id: 'SO-2025042487', customer: '123 Industries', date: '2025-04-22', items: 7, total: 4200, status: 'Pending Approval' },
    { id: 'SO-2025042475', customer: 'Global Ventures', date: '2025-04-21', items: 2, total: 980, status: 'Pending Approval' },
];

const recentInvoices = [
    { id: 'INV-20250423001', customer: 'ABC Corp', date: '2025-04-23', amount: 3850, status: 'Unpaid', due_date: '2025-05-07' },
    { id: 'INV-20250422002', customer: 'XYZ Ltd', date: '2025-04-22', amount: 5200, status: 'Partially Paid', due_date: '2025-05-06' },
    { id: 'INV-20250421003', customer: '123 Industries', date: '2025-04-21', amount: 1750, status: 'Paid', due_date: '2025-05-05' },
    { id: 'INV-20250420004', customer: 'Global Ventures', date: '2025-04-20', amount: 7600, status: 'Unpaid', due_date: '2025-05-04' },
];

const recentPayments = [
    { id: 'PMT-2025042578', invoice: 'INV-20250415001', customer: 'ABC Corp', date: '2025-04-22', method: 'Credit Card', amount: 3850 },
    { id: 'PMT-2025042541', invoice: 'INV-20250413005', customer: 'XYZ Ltd', date: '2025-04-21', method: 'Bank Transfer', amount: 5200 },
    { id: 'PMT-2025042498', invoice: 'INV-20250410002', customer: '123 Industries', date: '2025-04-19', method: 'Cash', amount: 1750 },
    { id: 'PMT-2025042456', invoice: 'INV-20250408007', customer: 'Global Ventures', date: '2025-04-18', method: 'Credit Card', amount: 7600 },
];

// Filter component based on your stock movements report
interface FilterProps extends React.HTMLAttributes<HTMLDivElement> {
    onDateChange: (range: DateRange | undefined) => void;
    initialDateRange: DateRange;
    branches: { id: number; name: string }[];
    selectedBranchId: string | null;
    onBranchChange: (value: string | null) => void;
    customerTypes: { value: string; label: string }[];
    selectedCustomerType: string | null;
    onCustomerTypeChange: (value: string | null) => void;
}

function SalesReportFilter({
    className,
    onDateChange,
    initialDateRange,
    branches,
    selectedBranchId,
    onBranchChange,
    customerTypes,
    selectedCustomerType,
    onCustomerTypeChange,
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
        window.location.href = route('dashboard', {
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

                {/* Branch Filter */}
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Branch</label>
                    <Combobox
                        value={selectedBranchId || ''}
                        onValueChange={(value: string) => onBranchChange(value === '' ? null : value)}
                        options={[
                            { value: '', label: 'All Branches' },
                            ...branches.map((branch) => ({
                                value: String(branch.id),
                                label: branch.name,
                            })),
                        ]}
                        placeholder="Select branch"
                        searchPlaceholder="Search branch..."
                        initialDisplayCount={10}
                    />
                </div>

                {/* Customer Type Filter */}
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Customer Type</label>
                    <Select value={selectedCustomerType || 'all'} onValueChange={(value) => onCustomerTypeChange(value === 'all' ? null : value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {customerTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Payment Status */}
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Payment Status</label>
                    <Select defaultValue="all">
                        <SelectTrigger>
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Reset button section */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleResetFilters}>
                    Reset Filters
                </Button>
            </div>
        </div>
    );
}

// Get status badge
const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
        case 'paid':
            return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
        case 'partially paid':
        case 'partially_paid':
            return <Badge className="bg-yellow-500 hover:bg-yellow-600">Partially Paid</Badge>;
        case 'unpaid':
            return <Badge className="bg-red-500 hover:bg-red-600">Unpaid</Badge>;
        case 'pending waybill':
            return <Badge className="bg-blue-500 hover:bg-blue-600">Pending Waybill</Badge>;
        case 'pending approval':
            return <Badge variant="outline">Pending Approval</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

// Customer type options for filter
const customerTypeOptions = [
    { value: 'retail', label: 'Retail' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'distributor', label: 'Distributor' },
];

interface SalesDashboardProps {
    branches: any[];
}

export default function SalesDashboard({ branches }: SalesDashboardProps) {
    const hasInitialized = useRef(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('overview');
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
    const urlBranchId = urlParams.get('branch_id');
    const urlCustomerType = urlParams.get('customer_type');
    const urlPage = urlParams.get('page');

    // Set initial date range from URL or default to current month
    const initialDateRange: DateRange = {
        from: urlStartDate ? new Date(urlStartDate) : firstDayOfMonth,
        to: urlEndDate ? new Date(urlEndDate) : lastDayOfMonth,
    };

    // State for filters
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(urlBranchId);
    const [selectedCustomerType, setSelectedCustomerType] = useState<string | null>(urlCustomerType);

    // Set initial page from URL or default to 1
    useEffect(() => {
        if (urlPage) {
            setCurrentPage(parseInt(urlPage));
        }
    }, [urlPage]);

    // Statistics summary
    const totalRevenue = 446000;
    const revenueGrowth = 8.2;
    const avgOrderValue = 560;
    const conversionRate = 87.5;
    const pendingOrdersCount = 18;
    const outstandingInvoices = 32;

    // Handle date range change
    const handleDateRangeChange = (range: DateRange | undefined) => {
        if (range?.from && range?.to) {
            const startDate = formatDate(range.from);
            const endDate = formatDate(range.to);

            // Reset to page 1 when filters change
            setCurrentPage(1);

            // Navigate to the URL with query parameters
            router.visit(route('dashboard'), {
                data: {
                    start_date: startDate,
                    end_date: endDate,
                    branch_id: selectedBranchId || undefined,
                    customer_type: selectedCustomerType || undefined,
                    page: 1,
                },
                method: 'get',
                preserveState: true,
                replace: true,
                only: ['salesData'],
            });
        }
    };

    // Handle branch filter change
    const handleBranchChange = (branchId: string | null) => {
        setSelectedBranchId(branchId);
        updateFilters(branchId, selectedCustomerType);
    };

    // Handle customer type filter change
    const handleCustomerTypeChange = (type: string | null) => {
        setSelectedCustomerType(type);
        updateFilters(selectedBranchId, type);
    };

    // Combined update filters function
    const updateFilters = (branchId: string | null, customerType: string | null) => {
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
        if (branchId) data.branch_id = branchId;
        if (customerType) data.customer_type = customerType;

        // Navigate with updated filters
        router.visit(route('dashboard'), {
            data,
            method: 'get',
            preserveState: true,
            replace: true,
            only: ['salesData'],
        });
    };

    // Handler for tab change
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setCurrentPage(1); // Reset to page 1 when tab changes
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard | Sales" />
            <div className="rounded-lg bg-white px-6 py-6">
                {/* Header with title and description */}
                <div className="mb-6 flex flex-col space-y-4">
                    <Heading title="Sales Dashboard" description="Comprehensive view of your sales performance, orders, invoices, and payments." />

                    {/* Filter Component */}
                    <SalesReportFilter
                        onDateChange={handleDateRangeChange}
                        initialDateRange={initialDateRange}
                        branches={branches}
                        selectedBranchId={selectedBranchId}
                        onBranchChange={handleBranchChange}
                        customerTypes={customerTypeOptions}
                        selectedCustomerType={selectedCustomerType}
                        onCustomerTypeChange={handleCustomerTypeChange}
                    />
                </div>

                {/* Quick Stats Cards */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-blue-100 p-3">
                                <DollarSign className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Total Revenue</h2>
                                <p className="text-2xl font-semibold text-gray-900">${totalRevenue.toLocaleString()}</p>
                                <div className="mt-1 flex items-center">
                                    <span className={`text-xs ${revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                                        {revenueGrowth >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                                        {Math.abs(revenueGrowth)}%
                                    </span>
                                    <span className="ml-1 text-xs text-gray-500">from last period</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-green-100 p-3">
                                <ShoppingCart className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Average Order Value</h2>
                                <p className="text-2xl font-semibold text-gray-900">${avgOrderValue}</p>
                                <div className="mt-1 flex items-center">
                                    <span className="flex items-center text-xs text-green-500">
                                        <ArrowUp className="mr-1 h-3 w-3" />
                                        3.5%
                                    </span>
                                    <span className="ml-1 text-xs text-gray-500">from last period</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-yellow-100 p-3">
                                <PackageIcon className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Pending Orders</h2>
                                <p className="text-2xl font-semibold text-gray-900">{pendingOrdersCount}</p>
                                <p className="mt-1 text-xs text-gray-500">${(pendingOrdersCount * avgOrderValue * 0.85).toLocaleString()} value</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-purple-100 p-3">
                                <TrendingUp className="h-6 w-6 text-purple-500" />
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Conversion Rate</h2>
                                <p className="text-2xl font-semibold text-gray-900">{conversionRate}%</p>
                                <div className="mt-1 flex items-center">
                                    <span className="flex items-center text-xs text-green-500">
                                        <ArrowUp className="mr-1 h-3 w-3" />
                                        2.1%
                                    </span>
                                    <span className="ml-1 text-xs text-gray-500">from last period</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tabs for different views */}
                <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="mb-6 w-full">
                    <TabsList className="mb-2 grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                        <TabsTrigger value="invoices">Invoices</TabsTrigger>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-0">
                        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Revenue Trend Chart */}
                            <Card className="shadow-sm lg:col-span-2">
                                <div className="p-4">
                                    <h3 className="mb-4 text-lg font-medium">Revenue Trend</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={revenueData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                                    labelFormatter={(label) => `Month: ${label}`}
                                                />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    stroke="#3b82f6"
                                                    name="Revenue ($)"
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="target"
                                                    stroke="#ef4444"
                                                    name="Target ($)"
                                                    strokeWidth={2}
                                                    strokeDasharray="5 5"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>

                            {/* Order Status */}
                            <Card className="shadow-sm">
                                <div className="p-4">
                                    <h3 className="mb-4 text-lg font-medium">Order Status</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={orderStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {orderStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Invoice Status */}
                            <Card className="shadow-sm">
                                <div className="p-4">
                                    <h3 className="mb-4 text-lg font-medium">Invoice Status</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={salesStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {salesStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>

                            {/* Branch Performance */}
                            <Card className="shadow-sm lg:col-span-2">
                                <div className="p-4">
                                    <h3 className="mb-4 text-lg font-medium">Branch Performance</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={branchPerformance} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                                                <Legend />
                                                <Bar dataKey="sales" name="Sales ($)" fill="#3b82f6" />
                                                <Bar dataKey="target" name="Target ($)" fill="#9ca3af" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Pending Orders Table */}
                        <Card className="shadow-sm">
                            <div className="p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Pending Orders</h3>
                                    <Button size="sm" variant="outline">
                                        View All
                                    </Button>
                                </div>
                                <div className="p-1 sm:p-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order ID</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingOrders.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                                                        No pending orders found for this period
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                pendingOrders.map((order, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{order.id}</TableCell>
                                                        <TableCell>{order.customer}</TableCell>
                                                        <TableCell>{order.date}</TableCell>
                                                        <TableCell>{order.items}</TableCell>
                                                        <TableCell className="text-right">${order.total.toLocaleString()}</TableCell>
                                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button size="sm" variant="ghost">
                                                                Process
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="orders" className="mt-0">
                        {/* Orders Tab Content */}
                        <Card className="shadow-sm">
                            <div className="p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Sales Orders</h3>
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="outline">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            Filter
                                        </Button>
                                        <Button size="sm">Create New</Button>
                                    </div>
                                </div>
                                <div className="p-1 sm:p-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order ID</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Waybill</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[
                                                ...pendingOrders,
                                                {
                                                    id: 'SO-2025042465',
                                                    customer: 'Tech Solutions',
                                                    date: '2025-04-20',
                                                    items: 8,
                                                    total: 5300,
                                                    status: 'Pending Approval',
                                                },
                                                {
                                                    id: 'SO-2025042452',
                                                    customer: 'Acme Inc',
                                                    date: '2025-04-19',
                                                    items: 4,
                                                    total: 1800,
                                                    status: 'Completed',
                                                },
                                            ].map((order, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{order.id}</TableCell>
                                                    <TableCell>{order.customer}</TableCell>
                                                    <TableCell>{order.date}</TableCell>
                                                    <TableCell>{order.items}</TableCell>
                                                    <TableCell className="text-right">${order.total.toLocaleString()}</TableCell>
                                                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                                                    <TableCell>{order.status === 'Completed' ? 'WB-2025042032' : '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="ghost">
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="invoices" className="mt-0">
                        {/* Invoices Tab Content */}
                        <Card className="shadow-sm">
                            <div className="p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Sales Invoices</h3>
                                    <div className="flex space-x-2">
                                        <Select defaultValue="all">
                                            <SelectTrigger className="w-36">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                                                <SelectItem value="unpaid">Unpaid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button size="sm">Create New</Button>
                                    </div>
                                </div>
                                <div className="p-1 sm:p-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Invoice ID</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Issue Date</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentInvoices.map((invoice, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{invoice.id}</TableCell>
                                                    <TableCell>{invoice.customer}</TableCell>
                                                    <TableCell>{invoice.date}</TableCell>
                                                    <TableCell>{invoice.due_date}</TableCell>
                                                    <TableCell className="text-right">${invoice.amount.toLocaleString()}</TableCell>
                                                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="ghost">
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </Card>

                        {/* Invoice Aging Summary */}
                        <Card className="mt-6 shadow-sm">
                            <div className="p-4">
                                <h3 className="mb-4 text-lg font-medium">Invoice Aging Summary</h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                                    {[
                                        { label: 'Current', count: 25, amount: 35800, color: 'text-green-600 bg-green-100' },
                                        { label: '1-30 days', count: 18, amount: 27200, color: 'text-blue-600 bg-blue-100' },
                                        { label: '31-60 days', count: 8, amount: 12500, color: 'text-yellow-600 bg-yellow-100' },
                                        { label: '61-90 days', count: 4, amount: 6800, color: 'text-orange-600 bg-orange-100' },
                                        { label: '90+ days', count: 2, amount: 3500, color: 'text-red-600 bg-red-100' },
                                    ].map((period, index) => (
                                        <div key={index} className={`rounded-lg p-4 ${period.color}`}>
                                            <div className="text-sm font-medium">{period.label}</div>
                                            <div className="mt-1 text-xl font-bold">${period.amount.toLocaleString()}</div>
                                            <div className="mt-1 text-sm">{period.count} invoices</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payments" className="mt-0">
                        {/* Payments Tab Content */}
                        <Card className="shadow-sm">
                            <div className="p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-medium">Recent Payments</h3>
                                    <div className="flex space-x-2">
                                        <Select defaultValue="all">
                                            <SelectTrigger className="w-36">
                                                <SelectValue placeholder="Payment Method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Methods</SelectItem>
                                                <SelectItem value="credit_card">Credit Card</SelectItem>
                                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="cash">Cash</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button size="sm">Record Payment</Button>
                                    </div>
                                </div>
                                <div className="p-1 sm:p-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Payment ID</TableHead>
                                                <TableHead>Invoice</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Method</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentPayments.map((payment, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{payment.id}</TableCell>
                                                    <TableCell>{payment.invoice}</TableCell>
                                                    <TableCell>{payment.customer}</TableCell>
                                                    <TableCell>{payment.date}</TableCell>
                                                    <TableCell>{payment.method}</TableCell>
                                                    <TableCell className="text-right">${payment.amount.toLocaleString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="ghost">
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </Card>

                        {/* Payment Method Distribution */}
                        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <Card className="shadow-sm">
                                <div className="p-4">
                                    <h3 className="mb-4 text-lg font-medium">Payment Methods</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Credit Card', value: 40, color: '#3b82f6' },
                                                        { name: 'Bank Transfer', value: 30, color: '#22c55e' },
                                                        { name: 'Cash', value: 20, color: '#f59e0b' },
                                                        { name: 'Other', value: 10, color: '#8b5cf6' },
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {[
                                                        { name: 'Credit Card', value: 40, color: '#3b82f6' },
                                                        { name: 'Bank Transfer', value: 30, color: '#22c55e' },
                                                        { name: 'Cash', value: 20, color: '#f59e0b' },
                                                        { name: 'Other', value: 10, color: '#8b5cf6' },
                                                    ].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>

                            <Card className="shadow-sm">
                                <div className="p-4">
                                    <h3 className="mb-4 text-lg font-medium">Monthly Payment Trend</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={[
                                                    { month: 'Jan', amount: 42500 },
                                                    { month: 'Feb', amount: 38600 },
                                                    { month: 'Mar', amount: 55200 },
                                                    { month: 'Apr', amount: 67300 },
                                                    { month: 'May', amount: 72800 },
                                                    { month: 'Jun', amount: 80000 },
                                                ]}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                                                <Bar dataKey="amount" name="Amount Collected ($)" fill="#3b82f6" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Pagination - shown on tables with multiple pages */}
                <div className="mt-6 flex w-full flex-col items-center justify-between gap-4 md:flex-row">
                    <div className="text-muted-foreground w-full text-sm md:text-left">Showing 1 to 4 of 28 entries</div>
                    <div className="flex w-full justify-end md:justify-end">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious className="cursor-pointer" />
                                </PaginationItem>

                                <PaginationItem>
                                    <PaginationLink isActive>1</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink>2</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink>3</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink>7</PaginationLink>
                                </PaginationItem>

                                <PaginationItem>
                                    <PaginationNext className="cursor-pointer" />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
