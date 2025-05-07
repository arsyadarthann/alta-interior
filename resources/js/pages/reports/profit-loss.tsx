import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon, Download, FileText } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/reports',
    },
    {
        title: 'Profit & Loss Report',
        href: '/reports/profit-loss',
    },
];

// Filter component
interface FilterProps extends React.HTMLAttributes<HTMLDivElement> {
    onDateChange: (range: DateRange | undefined) => void;
    initialDateRange: DateRange;
    branches: { id: number; name: string }[];
    selectedBranchId: string | null;
    onBranchChange: (value: string | null) => void;
    onResetFilters: () => void;
    userBranchId?: number | null;
}

function ProfitLossReportFilter({
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

                {/* Export to PDF/Excel buttons */}
                <Button variant="outline" className="h-10">
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                </Button>
                <Button variant="outline" className="h-10">
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                </Button>
            </div>
        </div>
    );
}

// Define the props structure
interface ProfitLossReportProps {
    branches: { id: number; name: string }[];
    salesReports: {
        total_revenue: number;
        tax_amount: number;
        total_collected: number;
        cogs: number;
        expenses: number;
        profit_or_loss: number;
        profit_or_loss_percentage: number;
        profit_or_loss_trend?: {
            [key: string]: {
                month: number;
                total_revenue: number;
                tax_amount: number;
                net_revenue: number;
                cogs: number;
                expenses: number;
                profit_or_loss: number;
            };
        };
    };
}

export default function ProfitLossReport({ branches, salesReports }: ProfitLossReportProps) {
    const hasInitialized = useRef(false);
    const [activeTab, setActiveTab] = useState('summary');

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

    // Get report year from start date or use current year
    const reportYear = urlStartDate ? new Date(urlStartDate).getFullYear() : today.getFullYear();

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
            };

            // If user has a branch_id and URL doesn't already have that branch set
            if (userBranchId && urlBranchId !== userBranchId.toString()) {
                data.branch_id = userBranchId.toString();
            }

            // Only navigate if we need to set dates or branch
            if (!urlStartDate || !urlEndDate || (userBranchId && urlBranchId !== userBranchId.toString())) {
                router.visit(route('reports.profit-loss'), {
                    data,
                    method: 'get',
                    preserveState: true,
                    replace: true,
                    only: ['salesReports'],
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

    // Filter handling functions
    const handleDateRangeChange = (range: DateRange | undefined) => {
        if (range?.from && range?.to) {
            const startDate = formatDate(range.from);
            const endDate = formatDate(range.to);

            // Build query data object
            const data: Record<string, string> = {
                start_date: startDate,
                end_date: endDate,
            };

            // Only add branch_id if user has a branch or if it's selected in filter
            if (userBranchId) {
                data.branch_id = userBranchId.toString();
            } else if (selectedBranchId) {
                data.branch_id = selectedBranchId;
            }

            // Navigate to the URL with query parameters
            router.visit(route('reports.profit-loss'), {
                data,
                method: 'get',
                preserveState: true,
                replace: true,
                only: ['salesReports'],
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

        // Prepare data for navigation
        const data: any = {
            start_date: startDate,
            end_date: endDate,
        };

        // If user has a branch_id, keep that filter
        if (userBranchId) {
            data.branch_id = userBranchId.toString();
        } else {
            // Otherwise clear branch filter
            setSelectedBranchId(null);
        }

        // Navigate directly to avoid multiple state updates
        router.visit(route('reports.profit-loss'), {
            data,
            method: 'get',
            preserveState: true,
            replace: true,
            only: ['salesReports'],
        });
    };

    // Combined update filters function
    const updateFilters = (branchId: string | null) => {
        // Get current dates from URL or use defaults
        const currentStartDate = urlStartDate || formatDate(firstDayOfMonth);
        const currentEndDate = urlEndDate || formatDate(lastDayOfMonth);

        // Navigation data object
        const data: any = {
            start_date: currentStartDate,
            end_date: currentEndDate,
        };

        // Only add defined filters
        if (userBranchId) {
            data.branch_id = userBranchId.toString();
        } else if (branchId) {
            data.branch_id = branchId;
        }

        // Navigate with updated filters
        router.visit(route('reports.profit-loss'), {
            data,
            method: 'get',
            preserveState: true,
            replace: true,
            only: ['salesReports'],
        });
    };

    // Generate monthly data from API profit_or_loss_trend
    const monthlyData = salesReports.profit_or_loss_trend
        ? Object.values(salesReports.profit_or_loss_trend).map((data: any) => {
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return {
                  month: monthNames[data.month - 1],
                  monthIndex: data.month, // Keep the month index for sorting if needed
                  revenue: data.total_revenue,
                  cogs: data.cogs,
                  expenses: data.expenses,
                  profit_or_loss: data.profit_or_loss,
                  net_revenue: data.net_revenue,
                  tax_amount: data.tax_amount,
              };
          })
        : Array.from({ length: 12 }, (_, i) => {
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              return {
                  month: monthNames[i],
                  monthIndex: i + 1,
                  revenue: 0,
                  cogs: 0,
                  expenses: 0,
                  profit_or_loss: 0,
                  net_revenue: 0,
                  tax_amount: 0,
              };
          });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profit & Loss Report" />
            <div className="rounded-lg bg-white px-6 py-6">
                <div className="mb-6 flex flex-col space-y-4">
                    <Heading title="Profit & Loss Report" description="Comprehensive analysis of revenue, costs, expenses, and profitability." />

                    {/* Filter Component */}
                    <ProfitLossReportFilter
                        onDateChange={handleDateRangeChange}
                        initialDateRange={initialDateRange}
                        branches={branches}
                        selectedBranchId={selectedBranchId}
                        onBranchChange={handleBranchChange}
                        onResetFilters={handleResetFilters}
                        userBranchId={userBranchId}
                    />
                </div>

                {/* Report Content Tabs */}
                <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-2 grid w-full grid-cols-2">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly Analysis</TabsTrigger>
                    </TabsList>

                    {/* Summary Tab */}
                    <TabsContent value="summary" className="mt-4">
                        {/* Key Metrics */}
                        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="p-4 shadow-sm">
                                <h3 className="font-medium text-gray-500">Total Revenue</h3>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(salesReports.total_revenue)}</p>
                                <div className="mt-2 flex items-center text-sm">
                                    <span>Tax: {formatCurrency(salesReports.tax_amount)}</span>
                                </div>
                            </Card>

                            <Card className="p-4 shadow-sm">
                                <h3 className="font-medium text-gray-500">Total Costs & Expenses</h3>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(salesReports.cogs + salesReports.expenses)}</p>
                                <div className="mt-2 flex items-center text-sm">
                                    <span>
                                        COGS: {formatCurrency(salesReports.cogs)} | Expenses: {formatCurrency(salesReports.expenses)}
                                    </span>
                                </div>
                            </Card>

                            <Card className={`p-4 shadow-sm ${salesReports.profit_or_loss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                <h3 className="font-medium text-gray-500">Net Profit/Loss</h3>
                                <p className={`text-3xl font-bold ${salesReports.profit_or_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(salesReports.profit_or_loss)}
                                </p>
                                <div className="mt-2 flex items-center text-sm">
                                    <span>Margin: {salesReports.profit_or_loss_percentage}%</span>
                                </div>
                            </Card>
                        </div>

                        {/* Financial Statement */}
                        <Card className="mb-6 shadow-sm">
                            <div className="p-4">
                                <h3 className="mb-4 text-lg font-medium">Profit & Loss Statement</h3>
                                <Table>
                                    <TableBody>
                                        <TableRow className="font-semibold">
                                            <TableCell>Revenue</TableCell>
                                            <TableCell className="text-right">{formatCurrency(salesReports.total_revenue)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="pl-8">Less: Tax</TableCell>
                                            <TableCell className="text-right">{formatCurrency(salesReports.tax_amount)}</TableCell>
                                        </TableRow>
                                        <TableRow className="font-semibold">
                                            <TableCell>Net Revenue</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(salesReports.total_revenue - salesReports.tax_amount)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="pl-8">Less: Cost of Goods Sold</TableCell>
                                            <TableCell className="text-right">{formatCurrency(salesReports.cogs)}</TableCell>
                                        </TableRow>
                                        <TableRow className="font-semibold">
                                            <TableCell>Gross Profit</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(salesReports.total_revenue - salesReports.tax_amount - salesReports.cogs)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="pl-8">Less: Operating Expenses</TableCell>
                                            <TableCell className="text-right">{formatCurrency(salesReports.expenses)}</TableCell>
                                        </TableRow>
                                        <TableRow className={`font-bold ${salesReports.profit_or_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            <TableCell>Net Profit/Loss</TableCell>
                                            <TableCell className="text-right">{formatCurrency(salesReports.profit_or_loss)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Monthly Analysis Tab */}
                    <TabsContent value="monthly" className="mt-4">
                        <Card className="mb-6 shadow-sm">
                            <div className="p-4">
                                <h3 className="mb-4 text-lg font-medium">Monthly P&L Trend {reportYear}</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={monthlyData} margin={{ left: 15, right: 15, top: 10, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis
                                                tickFormatter={(value) => {
                                                    if (value === 0) return 'Rp 0';
                                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                                    return `${value}`;
                                                }}
                                                width={80}
                                            />
                                            <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                                            <Legend />
                                            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} />
                                            <Line type="monotone" dataKey="cogs" name="COGS" stroke="#64748b" strokeWidth={2} />
                                            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f59e0b" strokeWidth={2} />
                                            <Line type="monotone" dataKey="profit_or_loss" name="Profit/Loss" stroke="#22c55e" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </Card>

                        <Card className="shadow-sm">
                            <div className="p-4">
                                <h3 className="mb-4 text-lg font-medium">Monthly P&L Data {reportYear}</h3>
                                <div className="max-h-80 overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white">
                                            <TableRow>
                                                <TableHead>Month</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                                <TableHead className="text-right">Tax</TableHead>
                                                <TableHead className="text-right">COGS</TableHead>
                                                <TableHead className="text-right">Expenses</TableHead>
                                                <TableHead className="text-right">Profit/Loss</TableHead>
                                                <TableHead className="text-right">Margin</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {monthlyData.map((month, index) => {
                                                const margin = month.revenue > 0 ? ((month.profit_or_loss / month.revenue) * 100).toFixed(1) : '0.0';
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>{month.month}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(month.revenue)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(month.tax_amount)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(month.cogs)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(month.expenses)}</TableCell>
                                                        <TableCell
                                                            className={`text-right ${month.profit_or_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                                        >
                                                            {formatCurrency(month.profit_or_loss)}
                                                        </TableCell>
                                                        <TableCell className="text-right">{margin}%</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
