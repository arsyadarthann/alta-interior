import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Eye, Plus, Lock } from 'lucide-react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { DataTable } from "@/components/data-table";
import Heading from "@/components/heading";
import { useToastNotification } from "@/hooks/use-toast-notification";
import { createNumberColumn } from "@/components/data-table/columns";
import { ActionColumn } from "@/components/data-table/action-column";
import { Pencil, Trash2 } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stock',
        href: '#',
    },
    {
        title: 'Adjustment',
        href: '#',
    }
];

interface Props {
    stockAdjustments: StockAdjustment[];
    branches: Branch[];
    selectedBranchId?: string;
}

type Branch = {
    id: number;
    name: string;
}

type StockAdjustment = {
    id: number;
    code: string;
    date: string;
    branch: {
        id: number;
        name: string;
    };
    user: {
        id: number;
        name: string;
    }
}

export default function Index({ stockAdjustments, branches, selectedBranchId = '' }: Props) {
    useToastNotification();

    const { hasPermission } = usePermissions();
    const { auth } = usePage().props as unknown as {
        auth: { user: { branch_id: number } },
    };

    const initialLoadComplete = useRef(false);

    const defaultBranchId = auth.user.branch_id
        ? auth.user.branch_id.toString()
        : (selectedBranchId || "all");

    const [currentBranchId, setCurrentBranchId] = useState(defaultBranchId);

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
                        data: { branch_id: auth.user.branch_id.toString() },
                        only: ['stockAdjustments'],
                    });
                }, 0);
            } else {
                initialLoadComplete.current = true;
            }
        }
    }, []);

    const handleBranchChange = (value: string) => {
        if (!auth.user.branch_id) {
            setCurrentBranchId(value);

            const params = value === "all" ? {} : { branch_id: value };

            router.get(route('stock.adjustment.index'), params, {
                preserveState: true,
                preserveScroll: true,
                only: ['stockAdjustments', 'branches', 'selectedBranchId'],
            });
        }
    };

    const columns: ColumnDef<StockAdjustment>[] = [
        createNumberColumn<StockAdjustment>(),
        {
            accessorKey: "code",
            header: "Code",
        },
        {
            accessorKey: "date",
            header: "Date",
        },
        {
            accessorKey: "branch.name",
            header: "Branch",
        },
        {
            accessorKey: "user.name",
            header: "Created By",
        },
        ActionColumn<StockAdjustment>({
            hasPermission: hasPermission,
            actions: () => [
                {
                    label: "View Detail",
                    icon: <Eye className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('stock.adjustment.show', data.id)),
                    permission: 'read_stock_adjustment',
                }
            ],
        })
    ].filter(Boolean) as ColumnDef<StockAdjustment>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Audit" />

            <div className="bg-white rounded-lg px-8 py-6">
                <Heading title="Stock Adjustment" description="Manage your stock adjustments." />

                <div className="flex justify-between items-center mb-4">
                    {!auth.user.branch_id ? (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="branch_id" className="whitespace-nowrap">Branch:</Label>
                            <Select
                                value={currentBranchId}
                                onValueChange={handleBranchChange}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id.toString()}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Label className="whitespace-nowrap">Branch:</Label>
                            <span className="text-sm font-medium">
                                {branches.find(branch => branch.id === auth.user.branch_id)?.name || 'Unknown Branch'}
                            </span>
                        </div>
                    )}

                    {hasPermission('create_stock_adjustment') && (
                        <Link href={route('stock.adjustment.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Stock Adjustment
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable columns={columns} data={stockAdjustments} />
            </div>
        </AppLayout>
    );
}
