import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon, FileText } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/reports',
    },
    {
        title: 'Transaction Report',
        href: '/reports/transactions',
    },
];

// Filter component (reusing the same pattern)
interface FilterProps extends React.HTMLAttributes<HTMLDivElement> {
    onDateChange: (range: DateRange | undefined) => void;
    initialDateRange: DateRange;
    branches: { id: number; name: string }[];
    selectedBranchId: string | null;
    onBranchChange: (value: string | null) => void;
    onResetFilters: () => void;
    userBranchId?: number | null;
}

function TransactionReportFilter({
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

                {/* Export buttons */}
                <Button variant="outline" className="h-10">
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                </Button>
            </div>
        </div>
    );
}

// Helper function to generate status badge
const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
        case 'completed':
            return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
        case 'pending':
            return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
        case 'failed':
            return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>;
        case 'processing':
            return <Badge className="bg-blue-500 hover:bg-blue-600">Processing</Badge>;
        case 'cancelled':
            return <Badge className="bg-gray-500 hover:bg-gray-600">Cancelled</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

// Dummy data for transactions report
const dummyTransactionData = {
    // Summary data
    summary: {
        total_transactions: 150,
        total_amount: 25000000,
        average_transaction: 166667,
        completed_transactions: 120,
        pending_transactions: 20,
        failed_transactions: 10,
    },

    // Transaction types breakdown
    transaction_types: [
        { type: 'Sales', count: 75, amount: 15000000 },
        { type: 'Purchases', count: 40, amount: 8000000 },
        { type: 'Refunds', count: 10, amount: 1500000 },
        { type: 'Transfers', count: 25, amount: 500000 },
    ],

    // Daily transaction volume for chart
    daily_volume: [
        { date: '2025-04-01', count: 8, amount: 1200000 },
        { date: '2025-04-02', count: 5, amount: 900000 },
        { date: '2025-04-03', count: 12, amount: 1800000 },
        { date: '2025-04-04', count: 7, amount: 1100000 },
        { date: '2025-04-05', count: 10, amount: 1600000 },
        { date: '2025-04-06', count: 6, amount: 950000 },
        { date: '2025-04-07', count: 9, amount: 1300000 },
    ],

    // Recent transactions
    recent_transactions: [
        { id: 'TRX-001', date: '2025-04-07', type: 'Sales', amount: 500000, status: 'Completed', customer: 'John Doe' },
        { id: 'TRX-002', date: '2025-04-07', type: 'Purchases', amount: 800000, status: 'Completed', customer: 'Supplier A' },
        { id: 'TRX-003', date: '2025-04-06', type: 'Sales', amount: 320000, status: 'Completed', customer: 'Jane Smith' },
        { id: 'TRX-004', date: '2025-04-06', type: 'Refunds', amount: 150000, status: 'Processing', customer: 'Mike Johnson' },
        { id: 'TRX-005', date: '2025-04-05', type: 'Sales', amount: 650000, status: 'Completed', customer: 'Sarah Brown' },
        { id: 'TRX-006', date: '2025-04-05', type: 'Transfers', amount: 125000, status: 'Pending', customer: 'Branch B' },
        { id: 'TRX-007', date: '2025-04-04', type: 'Sales', amount: 420000, status: 'Completed', customer: 'Tom Wilson' },
        { id: 'TRX-008', date: '2025-04-04', type: 'Purchases', amount: 1200000, status: 'Completed', customer: 'Supplier B' },
        { id: 'TRX-009', date: '2025-04-03', type: 'Sales', amount: 375000, status: 'Failed', customer: 'Lisa Green' },
        { id: 'TRX-010', date: '2025-04-03', type: 'Sales', amount: 580000, status: 'Completed', customer: 'David Miller' },
    ],

    // Payment methods
    payment_methods: [
        { method: 'Cash', count: 60, amount: 8500000 },
        { method: 'Bank Transfer', count: 45, amount: 12000000 },
        { method: 'Credit Card', count: 30, amount: 3500000 },
        { method: 'Digital Wallet', count: 15, amount: 1000000 },
    ],
};

interface TransactionReportProps {
    branches: any[];
    // In a real application, this would be fetched from the backend
    transactionData?: typeof dummyTransactionData;
}

export default function TransactionReport({ branches }: TransactionReportProps) {
    const transactionData = dummyTransactionData; // In a real app, this would come from props
    const hasInitialized = useRef(false);

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

            // Navigate to the URL with query parameters
            router.visit(route('reports.transactions'), {
                data: {
                    start_date: startDate,
                    end_date: endDate,
                    branch_id: userBranchId ? userBranchId.toString() : selectedBranchId || undefined,
                },
                method: 'get',
                preserveState: true,
                replace: true,
            });
        }
    };

    const handleBranchChange = (branchId: string | null) => {
        if (userBranchId) return;

        setSelectedBranchId(branchId);

        router.visit(route('reports.transactions'), {
            data: {
                start_date: urlStartDate || formatDate(firstDayOfMonth),
                end_date: urlEndDate || formatDate(lastDayOfMonth),
                branch_id: branchId || undefined,
            },
            method: 'get',
            preserveState: true,
            replace: true,
        });
    };

    const handleResetFilters = () => {
        const startDate = formatDate(firstDayOfMonth);
        const endDate = formatDate(lastDayOfMonth);

        const data: any = {
            start_date: startDate,
            end_date: endDate,
        };

        if (userBranchId) {
            data.branch_id = userBranchId.toString();
        } else {
            setSelectedBranchId(null);
        }

        router.visit(route('reports.transactions'), {
            data,
            method: 'get',
            preserveState: true,
            replace: true,
        });
    };

    // If no URL parameters for dates and user has branch_id, enforce branch_id
    useEffect(() => {
        if (!hasInitialized.current || (userBranchId && urlBranchId !== userBranchId.toString())) {
            const startDate = formatDate(firstDayOfMonth);
            const endDate = formatDate(lastDayOfMonth);

            // Set the flag to prevent multiple redirects
            hasInitialized.current = true;

            // Prepare data for navigation
            const data: any = {
                start_date: urlStartDate || startDate,
                end_date: urlEndDate || endDate,
            };

            // If user has a branch_id, ALWAYS set it
            if (userBranchId) {
                data.branch_id = userBranchId.toString();
            }

            // Only navigate if we need to set dates or enforce branch
            if (!urlStartDate || !urlEndDate || (userBranchId && urlBranchId !== userBranchId.toString())) {
                router.visit(route('reports.transactions'), {
                    data,
                    method: 'get',
                    preserveState: true,
                    replace: true,
                });
            }
        }
    }, [urlBranchId]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaction Report" />
            <div className="rounded-lg bg-white px-6 py-6">
                <div className="mb-6 flex flex-col space-y-4">
                    <Heading title="Transaction Report" description="Overview of all financial transactions in your business." />

                    {/* Filter Component */}
                    <TransactionReportFilter
                        onDateChange={handleDateRangeChange}
                        initialDateRange={initialDateRange}
                        branches={branches}
                        selectedBranchId={selectedBranchId}
                        onBranchChange={handleBranchChange}
                        onResetFilters={handleResetFilters}
                        userBranchId={userBranchId}
                    />
                </div>

                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="p-4 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
                        <div className="mt-1 flex items-baseline">
                            <p className="text-2xl font-semibold text-gray-900">{transactionData.summary.total_transactions}</p>
                            <p className="ml-2 text-sm text-gray-500">transactions</p>
                        </div>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                <span className="font-medium text-green-600">{transactionData.summary.completed_transactions}</span> completed,&nbsp;
                                <span className="font-medium text-yellow-600">{transactionData.summary.pending_transactions}</span> pending,&nbsp;
                                <span className="font-medium text-red-600">{transactionData.summary.failed_transactions}</span> failed
                            </p>
                        </div>
                    </Card>

                    <Card className="p-4 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(transactionData.summary.total_amount)}</p>
                        <p className="mt-2 text-sm text-gray-500">Across all transaction types</p>
                    </Card>

                    <Card className="p-4 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500">Average Transaction</h3>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(transactionData.summary.average_transaction)}</p>
                        <p className="mt-2 text-sm text-gray-500">Per transaction</p>
                    </Card>
                </div>

                {/* Transaction Volume Chart */}
                <Card className="mb-6 shadow-sm">
                    <div className="p-4">
                        <h3 className="mb-4 text-lg font-medium">Daily Transaction Volume</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={transactionData.daily_volume} margin={{ left: 15, right: 15, top: 10, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tickFormatter={(value) => format(new Date(value), 'dd MMM')} />
                                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={(value) => `${value}`} />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        stroke="#82ca9d"
                                        tickFormatter={(value) => {
                                            if (value === 0) return 'Rp 0';
                                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                            return `${value}`;
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === 'Transaction Count') return [value, name];
                                            return [formatCurrency(value as number), name];
                                        }}
                                        labelFormatter={(label) => format(new Date(label as string), 'dd MMMM yyyy')}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="count" name="Transaction Count" fill="#8884d8" />
                                    <Bar yAxisId="right" dataKey="amount" name="Transaction Amount" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>

                {/* Transaction Types and Payment Methods */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Transaction Types */}
                    <Card className="shadow-sm">
                        <div className="p-4">
                            <h3 className="mb-4 text-lg font-medium">Transaction Types</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionData.transaction_types.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.type}</TableCell>
                                            <TableCell className="text-right">{item.count}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>

                    {/* Payment Methods */}
                    <Card className="shadow-sm">
                        <div className="p-4">
                            <h3 className="mb-4 text-lg font-medium">Payment Methods</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionData.payment_methods.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.method}</TableCell>
                                            <TableCell className="text-right">{item.count}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* Recent Transactions */}
                <Card className="shadow-sm">
                    <div className="p-4">
                        <h3 className="mb-4 text-lg font-medium">Recent Transactions</h3>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Customer/Vendor</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionData.recent_transactions.map((transaction, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{transaction.id}</TableCell>
                                            <TableCell>{format(new Date(transaction.date), 'dd MMM yyyy')}</TableCell>
                                            <TableCell>{transaction.type}</TableCell>
                                            <TableCell>{transaction.customer}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
                                            <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
