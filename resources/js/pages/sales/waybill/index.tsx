import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { Eye, Plus, Printer } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: '#',
    },
    {
        title: 'Waybills',
        href: '#',
    },
];

interface Props {
    waybills: {
        data: Waybill[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    branches: Branch[];
    selectedBranchId?: string;
    filters?: {
        search?: string;
    };
}

type Branch = {
    id: number;
    name: string;
};

type Waybill = {
    id: number;
    code: string;
    date: string;
    user: {
        id: number;
        name: string;
    };
    branch: {
        id: number;
        name: string;
    };
    sales_order: {
        id: number;
        code: string;
    } | null;
    status: 'not_invoiced' | 'invoiced';
};

export default function Index({ waybills, branches, selectedBranchId = '', filters }: Props) {
    useToastNotification();

    const { hasPermission } = usePermissions();
    const { auth } = usePage().props as unknown as {
        auth: { user: { branch_id: number } };
    };
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');
    const initialLoadComplete = useRef(false);

    const getDefaultBranchValue = () => {
        if (auth.user.branch_id) {
            return `${auth.user.branch_id}`;
        }

        if (selectedBranchId) {
            return selectedBranchId;
        }

        return 'all';
    };

    const [currentBranch, setCurrentBranch] = useState(getDefaultBranchValue());

    // Custom debounce hook
    function useDebounce(callback: Function, delay: number) {
        const timeoutRef = useRef<NodeJS.Timeout>();

        return useCallback(
            (...args: any[]) => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => {
                    callback(...args);
                }, delay);
            },
            [callback, delay],
        );
    }

    // Debounced search handler to reduce excessive requests
    const debouncedSearch = useDebounce((value: string) => {
        const params: any = { search: value, page: 1 }; // Reset page to 1 when search changes

        // Maintain branch filtering when searching
        if (currentBranch !== 'all' && !auth.user.branch_id) {
            params.branch_id = currentBranch;
        } else if (auth.user.branch_id) {
            params.branch_id = auth.user.branch_id;
        }

        router.get(route('sales.waybill.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['waybills'],
            onBefore: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    }, 500);

    // Set search state when component mounts
    useEffect(() => {
        if (filters?.search !== undefined) {
            setSearch(filters.search);
        }
    }, []); // Run once on mount

    // Handle search change
    const handleSearchChange = (value: string) => {
        setSearch(value);
        debouncedSearch(value);
    };

    useEffect(() => {
        if (!initialLoadComplete.current && auth?.user?.branch_id) {
            const urlParams = new URLSearchParams(window.location.search);
            const urlBranchId = urlParams.get('branch_id');

            if (urlBranchId !== auth.user.branch_id.toString()) {
                initialLoadComplete.current = true;

                if (window.history && window.history.replaceState) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('branch_id', auth.user.branch_id.toString());
                    window.history.replaceState({}, '', url.toString());
                }

                setTimeout(() => {
                    router.reload({
                        data: {
                            branch_id: auth.user.branch_id.toString(),
                        },
                        only: ['waybills'],
                    });
                }, 0);
            } else {
                initialLoadComplete.current = true;
            }
        } else if (!initialLoadComplete.current) {
            initialLoadComplete.current = true;
        }
    }, []);

    const handleBranchChange = (value: string) => {
        if (auth.user.branch_id) {
            return;
        }

        setCurrentBranch(value);
        setIsLoading(true);

        let params: any = {};
        if (value !== 'all') {
            params.branch_id = value;
        }

        // Maintain search when changing branches
        if (search) {
            params.search = search;
        }

        router.get(route('sales.waybill.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['waybills', 'branches', 'selectedBranchId'],
            onFinish: () => setIsLoading(false),
        });
    };

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        const params: any = { page };

        // Maintain branch filtering when changing pages
        if (currentBranch !== 'all' && !auth.user.branch_id) {
            params.branch_id = currentBranch;
        } else if (auth.user.branch_id) {
            params.branch_id = auth.user.branch_id;
        }

        // Maintain search when changing pages
        if (search) {
            params.search = search;
        }

        router.get(route('sales.waybill.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['waybills'],
            onBefore: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'not_invoiced':
                return 'bg-yellow-100 text-yellow-800';
            case 'invoiced':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatStatus = (status: string) => {
        switch (status) {
            case 'not_invoiced':
                return 'Not Invoiced';
            case 'invoiced':
                return 'Invoiced';
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const columns: ColumnDef<Waybill>[] = [
        createNumberColumn<Waybill>(),
        {
            accessorKey: 'code',
            header: 'Waybill Code',
        },
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }: { row: Row<Waybill> }) => {
                const date = row.getValue('date') as string;
                return formatDate(date);
            },
        },
        {
            accessorKey: 'user.name',
            header: 'Created By',
        },
        {
            accessorKey: 'branch.name',
            header: 'Branch',
        },
        {
            accessorKey: 'sales_order.code',
            header: 'Sales Order',
            cell: ({ row }: { row: Row<Waybill> }) => {
                const salesOrder = row.original.sales_order;
                return salesOrder ? salesOrder.code : '-';
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: { row: Row<Waybill> }) => {
                const status = row.getValue('status') as string;
                const statusClass = getStatusClass(status);

                return <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass}`}>{formatStatus(status)}</span>;
            },
        },
        ActionColumn<Waybill>({
            hasPermission: hasPermission,
            actions: () => [
                {
                    label: 'View Detail',
                    icon: <Eye className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('sales.waybill.show', data.id)),
                    permission: 'read_waybill',
                },
                {
                    label: 'Print PDF',
                    icon: <Printer className="h-4 w-4" />,
                    onClick: (data) => {
                        window.open(route('sales.waybill.generate-pdf', data.id), '_blank');
                    },
                    permission: 'read_waybill',
                },
            ],
        }),
    ].filter(Boolean) as ColumnDef<Waybill>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Waybills" />

            <div className="rounded-lg bg-white px-8 py-6">
                <Heading title="Waybills" description="Manage your delivery waybills." />

                <div className="mb-4 flex items-center justify-between">
                    {!auth.user.branch_id ? (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="branch" className="whitespace-nowrap">
                                Branch Filter:
                            </Label>
                            <Combobox
                                value={currentBranch}
                                onValueChange={handleBranchChange}
                                options={[
                                    { value: 'all', label: 'All Branches' },
                                    ...branches.map((branch) => ({
                                        value: `${branch.id}`,
                                        label: branch.name,
                                    })),
                                ]}
                                placeholder="Select branch"
                                searchPlaceholder="Search branches..."
                                className="w-[200px]"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Label className="whitespace-nowrap">Branch:</Label>
                            <span className="text-sm font-medium">
                                {branches.find((branch) => branch.id === auth.user.branch_id)?.name || 'Unknown Branch'}
                            </span>
                        </div>
                    )}

                    {hasPermission('create_waybill') && (
                        <Link href={route('sales.waybill.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Waybill
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={waybills.data}
                    searchable={true}
                    searchPlaceholder="Search by waybill code or sales order..."
                    searchValue={search}
                    onSearchChange={handleSearchChange}
                    serverPagination={{
                        pageCount: waybills.last_page,
                        currentPage: waybills.current_page,
                        totalItems: waybills.total,
                        isLoading: isLoading,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>
        </AppLayout>
    );
}
