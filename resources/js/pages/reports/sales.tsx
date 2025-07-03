import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
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
import { CalendarIcon, Download, Eye, FileText } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { DateRange } from 'react-day-picker';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: '/reports',
    },
    {
        title: 'Sales Receivables Report',
        href: '/reports/sales-receivables',
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

function SalesReceivablesReportFilter({
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
interface SalesReceivablesReportProps {
    branches: { id: number; name: string }[];
    salesReports: {
        id: number;
        code: string;
        date: string;
        due_date: string;
        user_id: number;
        branch_id: number;
        customer_id: number | null;
        customer_name: string;
        total_amount: string;
        discount_type: string;
        discount_percentage: string;
        discount_amount: string;
        tax_rate_id: number | null;
        tax_amount: string;
        grand_total: string;
        payment_method_id: number;
        paid_status: string;
        paid_amount: string;
        remaining_amount: string;
        created_at: string;
        updated_at: string;
    }[];
}

export default function SalesReceivablesReport({ branches, salesReports }: SalesReceivablesReportProps) {
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
                router.visit(route('reports.sales'), {
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
            router.visit(route('reports.sales'), {
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
        router.visit(route('reports.sales'), {
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
        router.visit(route('reports.sales'), {
            data,
            method: 'get',
            preserveState: true,
            replace: true,
            only: ['salesReports'],
        });
    };

    // Filter invoices by status
    const paidInvoices = salesReports.filter((invoice) => invoice.paid_status === 'paid');
    const partiallyPaidInvoices = salesReports.filter((invoice) => invoice.paid_status === 'partially_paid');
    const unpaidInvoices = salesReports.filter((invoice) => invoice.paid_status === 'unpaid');

    // Calculate summary data
    const totalSales = salesReports.reduce((sum, invoice) => sum + parseFloat(invoice.grand_total), 0);
    const totalPaid = salesReports.reduce((sum, invoice) => sum + parseFloat(invoice.paid_amount), 0);
    const totalReceivables = salesReports.reduce((sum, invoice) => sum + parseFloat(invoice.remaining_amount), 0);
    const totalInvoices = salesReports.length;

    // Calculate overdue invoices (assuming due_date is past today)
    const overdueInvoices = salesReports.filter((invoice) => new Date(invoice.due_date) < today && parseFloat(invoice.remaining_amount) > 0);
    const totalOverdue = overdueInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.remaining_amount), 0);

    // Group by customer for summary
    const customerSummary = salesReports.reduce(
        (acc, invoice) => {
            // Use customer_name as key since customer_id is null for walk-in customers
            const customerKey = invoice.customer_name || 'Walk-in Customer';

            if (!acc[customerKey]) {
                acc[customerKey] = {
                    customer_name: customerKey,
                    total_sales: 0,
                    total_paid: 0,
                    total_receivable: 0,
                    invoice_count: 0,
                    invoices: [],
                };
            }
            acc[customerKey].total_sales += parseFloat(invoice.grand_total);
            acc[customerKey].total_paid += parseFloat(invoice.paid_amount);
            acc[customerKey].total_receivable += parseFloat(invoice.remaining_amount);
            acc[customerKey].invoice_count += 1;
            acc[customerKey].invoices.push(invoice);
            return acc;
        },
        {} as Record<
            string,
            {
                customer_name: string;
                total_sales: number;
                total_paid: number;
                total_receivable: number;
                invoice_count: number;
                invoices: any[];
            }
        >,
    );

    const customerSummaryArray = Object.values(customerSummary).sort((a, b) => b.total_sales - a.total_sales);

    // Group by branch for analysis
    const branchSummary = salesReports.reduce(
        (acc, invoice) => {
            const branchId = invoice.branch_id;
            const branchName = branches.find((b) => b.id === branchId)?.name || 'Unknown Branch';
            if (!acc[branchId]) {
                acc[branchId] = {
                    branch_name: branchName,
                    total_sales: 0,
                    total_paid: 0,
                    total_receivable: 0,
                    invoice_count: 0,
                };
            }
            acc[branchId].total_sales += parseFloat(invoice.grand_total);
            acc[branchId].total_paid += parseFloat(invoice.paid_amount);
            acc[branchId].total_receivable += parseFloat(invoice.remaining_amount);
            acc[branchId].invoice_count += 1;
            return acc;
        },
        {} as Record<
            number,
            {
                branch_name: string;
                total_sales: number;
                total_paid: number;
                total_receivable: number;
                invoice_count: number;
            }
        >,
    );

    const branchSummaryArray = Object.values(branchSummary).sort((a, b) => b.total_sales - a.total_sales);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Receivables Report" />
            <div className="rounded-lg bg-white px-6 py-6">
                <div className="mb-6 flex flex-col space-y-4">
                    <Heading
                        title="Sales Receivables Report"
                        description="Comprehensive analysis of sales invoices, payments, and outstanding receivables."
                    />

                    {/* Filter Component */}
                    <SalesReceivablesReportFilter
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
                    <TabsList className="mb-2 grid w-full grid-cols-4">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="customers">By Customer</TabsTrigger>
                        <TabsTrigger value="branches">By Branch</TabsTrigger>
                        <TabsTrigger value="invoices">Invoice Details</TabsTrigger>
                    </TabsList>

                    {/* Summary Tab */}
                    <TabsContent value="summary" className="mt-4">
                        {/* Key Metrics */}
                        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="p-4 shadow-sm">
                                <h3 className="font-medium text-gray-500">Total Penjualan</h3>
                                <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalSales)}</p>
                                <div className="mt-2 flex items-center text-sm text-gray-600">
                                    <span>dari {totalInvoices} invoice</span>
                                </div>
                            </Card>

                            <Card className="bg-green-50 p-4 shadow-sm">
                                <h3 className="font-medium text-gray-500">Total Terbayar</h3>
                                <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                                <div className="mt-2 flex items-center text-sm text-green-600">
                                    <span>{paidInvoices.length + partiallyPaidInvoices.length} invoice</span>
                                </div>
                            </Card>

                            <Card className="bg-yellow-50 p-4 shadow-sm">
                                <h3 className="font-medium text-gray-500">Total Piutang</h3>
                                <p className="text-3xl font-bold text-yellow-600">{formatCurrency(totalReceivables)}</p>
                                <div className="mt-2 flex items-center text-sm text-yellow-600">
                                    <span>{unpaidInvoices.length + partiallyPaidInvoices.length} invoice</span>
                                </div>
                            </Card>

                            <Card className="bg-red-50 p-4 shadow-sm">
                                <h3 className="font-medium text-gray-500">Piutang Jatuh Tempo</h3>
                                <p className="text-3xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
                                <div className="mt-2 flex items-center text-sm text-red-600">
                                    <span>{overdueInvoices.length} invoice overdue</span>
                                </div>
                            </Card>
                        </div>

                        {/* Payment Status Summary */}
                        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                            <Card className="border-green-200 bg-green-50 p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-green-700">Lunas</h3>
                                        <p className="text-2xl font-bold text-green-600">{paidInvoices.length}</p>
                                        <p className="text-sm text-green-600">
                                            {formatCurrency(paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.grand_total), 0))}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                        {totalInvoices > 0 ? ((paidInvoices.length / totalInvoices) * 100).toFixed(1) : 0}%
                                    </Badge>
                                </div>
                            </Card>

                            <Card className="border-yellow-200 bg-yellow-50 p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-yellow-700">Sebagian Dibayar</h3>
                                        <p className="text-2xl font-bold text-yellow-600">{partiallyPaidInvoices.length}</p>
                                        <p className="text-sm text-yellow-600">
                                            {formatCurrency(partiallyPaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.remaining_amount), 0))}{' '}
                                            sisa
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                        {totalInvoices > 0 ? ((partiallyPaidInvoices.length / totalInvoices) * 100).toFixed(1) : 0}%
                                    </Badge>
                                </div>
                            </Card>

                            <Card className="border-red-200 bg-red-50 p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-red-700">Belum Dibayar</h3>
                                        <p className="text-2xl font-bold text-red-600">{unpaidInvoices.length}</p>
                                        <p className="text-sm text-red-600">
                                            {formatCurrency(unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.grand_total), 0))}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                                        {totalInvoices > 0 ? ((unpaidInvoices.length / totalInvoices) * 100).toFixed(1) : 0}%
                                    </Badge>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Customers Tab */}
                    <TabsContent value="customers" className="mt-4">
                        <Card className="shadow-sm">
                            <div className="p-4">
                                <h3 className="mb-4 text-lg font-medium">Laporan per Customer</h3>
                                <div className="max-h-96 overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white">
                                            <TableRow>
                                                <TableHead>Customer</TableHead>
                                                <TableHead className="text-right">Jumlah Invoice</TableHead>
                                                <TableHead className="text-right">Total Penjualan</TableHead>
                                                <TableHead className="text-right">Total Terbayar</TableHead>
                                                <TableHead className="text-right">Sisa Piutang</TableHead>
                                                <TableHead className="text-center">Status Pembayaran</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customerSummaryArray.map((customer, index) => {
                                                const paymentPercentage =
                                                    customer.total_sales > 0 ? (customer.total_paid / customer.total_sales) * 100 : 0;

                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{customer.customer_name}</TableCell>
                                                        <TableCell className="text-right">{customer.invoice_count}</TableCell>
                                                        <TableCell className="text-right font-medium text-blue-600">
                                                            {formatCurrency(customer.total_sales)}
                                                        </TableCell>
                                                        <TableCell className="text-right text-green-600">
                                                            {formatCurrency(customer.total_paid)}
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-600">
                                                            {formatCurrency(customer.total_receivable)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge
                                                                variant={
                                                                    paymentPercentage === 100
                                                                        ? 'default'
                                                                        : paymentPercentage > 0
                                                                          ? 'secondary'
                                                                          : 'destructive'
                                                                }
                                                            >
                                                                {paymentPercentage.toFixed(0)}%
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Branches Tab */}
                    <TabsContent value="branches" className="mt-4">
                        <Card className="shadow-sm">
                            <div className="p-4">
                                <h3 className="mb-4 text-lg font-medium">Laporan per Cabang</h3>
                                <div className="max-h-96 overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white">
                                            <TableRow>
                                                <TableHead>Cabang</TableHead>
                                                <TableHead className="text-right">Jumlah Invoice</TableHead>
                                                <TableHead className="text-right">Total Penjualan</TableHead>
                                                <TableHead className="text-right">Total Terbayar</TableHead>
                                                <TableHead className="text-right">Sisa Piutang</TableHead>
                                                <TableHead className="text-center">% Terbayar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {branchSummaryArray.map((branch, index) => {
                                                const paymentPercentage = branch.total_sales > 0 ? (branch.total_paid / branch.total_sales) * 100 : 0;

                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{branch.branch_name}</TableCell>
                                                        <TableCell className="text-right">{branch.invoice_count}</TableCell>
                                                        <TableCell className="text-right font-medium text-blue-600">
                                                            {formatCurrency(branch.total_sales)}
                                                        </TableCell>
                                                        <TableCell className="text-right text-green-600">
                                                            {formatCurrency(branch.total_paid)}
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-600">
                                                            {formatCurrency(branch.total_receivable)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span
                                                                className={`font-medium ${
                                                                    paymentPercentage === 100
                                                                        ? 'text-green-600'
                                                                        : paymentPercentage > 50
                                                                          ? 'text-yellow-600'
                                                                          : 'text-red-600'
                                                                }`}
                                                            >
                                                                {paymentPercentage.toFixed(1)}%
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Invoice Details Tab */}
                    <TabsContent value="invoices" className="mt-4">
                        <Card className="shadow-sm">
                            <div className="p-4">
                                <h3 className="mb-4 text-lg font-medium">Detail Semua Invoice</h3>
                                <div className="max-h-96 overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white">
                                            <TableRow>
                                                <TableHead>No. Invoice</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Cabang</TableHead>
                                                <TableHead className="text-right">Tanggal</TableHead>
                                                <TableHead className="text-right">Jatuh Tempo</TableHead>
                                                <TableHead className="text-right">Total Invoice</TableHead>
                                                <TableHead className="text-right">Terbayar</TableHead>
                                                <TableHead className="text-right">Sisa</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {salesReports.map((invoice) => {
                                                const isOverdue = new Date(invoice.due_date) < today && parseFloat(invoice.remaining_amount) > 0;
                                                const branchName = branches.find((b) => b.id === invoice.branch_id)?.name || 'Unknown';

                                                const getStatusBadge = (status: string, isOverdue: boolean) => {
                                                    if (status === 'paid') {
                                                        return (
                                                            <Badge variant="default" className="bg-green-100 text-green-700">
                                                                Lunas
                                                            </Badge>
                                                        );
                                                    } else if (status === 'partially_paid') {
                                                        return (
                                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                                                Sebagian
                                                            </Badge>
                                                        );
                                                    } else if (isOverdue) {
                                                        return <Badge variant="destructive">Overdue</Badge>;
                                                    } else {
                                                        return (
                                                            <Badge variant="outline" className="border-red-200 text-red-600">
                                                                Belum Bayar
                                                            </Badge>
                                                        );
                                                    }
                                                };

                                                return (
                                                    <TableRow key={invoice.id}>
                                                        <TableCell className="font-medium">{invoice.code}</TableCell>
                                                        <TableCell>{invoice.customer_name || 'Walk-in Customer'}</TableCell>
                                                        <TableCell>{branchName}</TableCell>
                                                        <TableCell className="text-right">{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
                                                        <TableCell className="text-right">
                                                            {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(parseFloat(invoice.grand_total))}
                                                        </TableCell>
                                                        <TableCell className="text-right text-green-600">
                                                            {formatCurrency(parseFloat(invoice.paid_amount))}
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-600">
                                                            {formatCurrency(parseFloat(invoice.remaining_amount))}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {getStatusBadge(invoice.paid_status, isOverdue)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.visit(route('sales.invoices.show', invoice.id))}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
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
