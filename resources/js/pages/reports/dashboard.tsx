import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon, ClipboardCheck, PackageIcon, ShoppingCart } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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

// Filter component based on your stock movements report
interface FilterProps extends React.HTMLAttributes<HTMLDivElement> {
    onDateChange: (range: DateRange | undefined) => void;
    initialDateRange: DateRange;
    branches: { id: number; name: string }[];
    selectedBranchId: string | null;
    onBranchChange: (value: string | null) => void;
    onResetFilters: () => void;
    userBranchId?: number | null;
}

function SalesReportFilter({
    className,
    onDateChange,
    initialDateRange,
    branches,
    selectedBranchId,
    onBranchChange,
    onResetFilters,
    userBranchId,
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

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-4">
                {/* Date Range Picker */}
                <div className={cn('grid flex-1 gap-2', className)}>
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
                <div className="grid w-64 gap-2">
                    <label className="text-sm font-medium">Branch</label>
                    {userBranchId ? (
                        <div className="border-input bg-background flex h-10 items-center rounded-md border px-3 py-2 text-sm">
                            {branches.find((branch) => branch.id === userBranchId)?.name || 'Your Branch'}
                        </div>
                    ) : (
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
                    )}
                </div>

                {/* Reset button aligned with the filters */}
                <Button variant="outline" onClick={onResetFilters} className="h-10">
                    Reset Filters
                </Button>
            </div>
        </div>
    );
}

// Get status badge
const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
        case 'pending':
            return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
        case 'processed':
            return <Badge className="bg-blue-500 hover:bg-blue-600">Processed</Badge>;
        case 'completed':
            return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
        case 'cancelled':
            return <Badge className="bg-red-500 hover:bg-red-600">Cancelled</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

interface SalesDashboardProps {
    branches: any[];
    salesData?: {
        total_revenue: number;
        average_sales_order: number;
        pending_orders: number;
        completed_orders: number;
        revenue_trend: {
            [key: string]: {
                month: number;
                total_revenue: string | number;
            };
        };
        sales_order: {
            total: number;
            status: {
                status: string;
                count: number;
            }[];
        };
    };
}

export default function SalesDashboard({ branches, salesData }: SalesDashboardProps) {
    const hasInitialized = useRef(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Get the user from Inertia props
    const { auth } = usePage().props as unknown as {
        auth: { user: { branch_id?: number } };
    };
    const userBranchId = auth?.user?.branch_id || null;

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
    const urlPage = urlParams.get('page');

    // If no URL parameters for dates, automatically set to current month
    // If user has a branch_id, automatically set branch filter
    useEffect(() => {
        if (!hasInitialized.current) {
            const startDate = formatDate(firstDayOfMonth);
            const endDate = formatDate(lastDayOfMonth);

            // Set the flag to prevent multiple redirects
            hasInitialized.current = true;

            // Prepare data for navigation
            const data: any = {
                start_date: startDate,
                end_date: endDate,
                page: 1,
            };

            // If user has a branch_id and URL doesn't already have that branch set
            if (userBranchId && urlBranchId !== userBranchId.toString()) {
                data.branch_id = userBranchId.toString();
            }

            // Only navigate if we need to set dates or branch
            if (!urlStartDate || !urlEndDate || (userBranchId && urlBranchId !== userBranchId.toString())) {
                router.visit(route('dashboard'), {
                    data,
                    method: 'get',
                    preserveState: true,
                    replace: true,
                    only: ['salesData'],
                });
            }
        }
    }, []);

    // Set initial date range from URL or default to current month
    const initialDateRange: DateRange = {
        from: urlStartDate ? new Date(urlStartDate) : firstDayOfMonth,
        to: urlEndDate ? new Date(urlEndDate) : lastDayOfMonth,
    };

    // State for filters - use user's branch_id as initial value if available
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(userBranchId ? userBranchId.toString() : urlBranchId);

    // Set initial page from URL or default to 1
    useEffect(() => {
        if (urlPage) {
            setCurrentPage(parseInt(urlPage));
        }
    }, [urlPage]);

    // Transform revenue trend data for the chart
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueChartData = salesData?.revenue_trend
        ? Object.values(salesData.revenue_trend).map((item) => ({
              month: monthNames[item.month - 1],
              revenue: parseFloat(String(item.total_revenue)),
          }))
        : [];

    // Transform order status data for pie chart
    const orderStatusChartData = salesData?.sales_order?.status
        ? salesData.sales_order.status.map((item) => {
              let color = '#22c55e'; // Default color
              switch (item.status.toLowerCase()) {
                  case 'pending':
                      color = '#f59e0b';
                      break;
                  case 'processed':
                      color = '#3b82f6';
                      break;
                  case 'completed':
                      color = '#22c55e';
                      break;
                  case 'cancelled':
                      color = '#ef4444';
                      break;
              }
              return {
                  name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                  value: item.count,
                  color: color,
              };
          })
        : [];

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
                    branch_id: userBranchId ? userBranchId.toString() : selectedBranchId || undefined,
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
        // If user has a branch_id, don't allow changing
        if (userBranchId) return;

        setSelectedBranchId(branchId);
        updateFilters(branchId);
    };

    // Handle reset filters
    const handleResetFilters = () => {
        // Get first and last day of current month
        const startDate = formatDate(firstDayOfMonth);
        const endDate = formatDate(lastDayOfMonth);

        // Reset date in local state
        setCurrentPage(1);

        // Prepare data for navigation
        const data: any = {
            start_date: startDate,
            end_date: endDate,
            page: 1,
        };

        // If user has a branch_id, keep that filter
        if (userBranchId) {
            data.branch_id = userBranchId.toString();
        } else {
            // Otherwise clear branch filter
            setSelectedBranchId(null);
        }

        // Navigate directly to avoid multiple state updates
        router.visit(route('dashboard'), {
            data,
            method: 'get',
            preserveState: true,
            replace: true,
            only: ['salesData'],
        });
    };

    // Combined update filters function
    const updateFilters = (branchId: string | null) => {
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
        if (userBranchId) {
            data.branch_id = userBranchId.toString();
        } else if (branchId) {
            data.branch_id = branchId;
        }

        // Navigate with updated filters
        router.visit(route('dashboard'), {
            data,
            method: 'get',
            preserveState: true,
            replace: true,
            only: ['salesData'],
        });
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
                        onResetFilters={handleResetFilters}
                        userBranchId={userBranchId}
                    />
                </div>

                {/* Quick Stats Cards */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-blue-100 p-3">
                                {/* Replace DollarSign with text "Rp" */}
                                <div className="flex h-6 w-6 items-center justify-center font-semibold text-blue-500">Rp</div>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Total Revenue</h2>
                                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(salesData?.total_revenue || 0)}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-purple-100 p-3">
                                <ShoppingCart className="h-6 w-6 text-purple-500" />
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Average Order Value</h2>
                                <p className="text-2xl font-semibold text-gray-900">{formatCurrency(salesData?.average_sales_order || 0)}</p>
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
                                <p className="text-2xl font-semibold text-gray-900">{salesData?.pending_orders || 0}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center">
                            <div className="rounded-full bg-green-100 p-3">
                                <ClipboardCheck className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-500">Completed Orders</h2>
                                <p className="text-2xl font-semibold text-gray-900">{salesData?.completed_orders || 0}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Charts */}
                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Revenue Trend Chart (65% width) */}
                    <Card className="shadow-sm lg:w-[65%]">
                        <div className="p-4">
                            <h3 className="mb-4 text-lg font-medium">Revenue Trend</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueChartData} margin={{ right: 15, top: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis
                                            tickFormatter={(value) => {
                                                if (value === 0) return 'Rp 0';
                                                if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}M`;
                                                if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}K`;
                                                return `Rp ${value}`;
                                            }}
                                            width={90}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [formatCurrency(value), '']}
                                            labelFormatter={(label) => `Month: ${label}`}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#3b82f6"
                                            name="Revenue"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    {/* Order Status (35% width) */}
                    <Card className="shadow-sm lg:w-[35%]">
                        <div className="p-4">
                            <h3 className="mb-4 text-lg font-medium">Order Status</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={orderStatusChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            // Add label to display percentages on the chart
                                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                        >
                                            {orderStatusChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [`${value}`, '']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
