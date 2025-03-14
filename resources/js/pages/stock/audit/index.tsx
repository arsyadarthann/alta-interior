import React, { useState } from 'react';
import {Head, Link, router} from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Eye, Plus, Lock } from 'lucide-react';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { DataTable } from "@/components/data-table";
import Heading from "@/components/heading";
import { useToastNotification } from "@/hooks/use-toast-notification";
import {createNumberColumn} from "@/components/data-table/columns";
import {ActionColumn} from "@/components/data-table/action-column";
import { Pencil, Trash2 } from "lucide-react";
import {usePermissions} from "@/hooks/use-permissions";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stock',
        href: '#',
    },
    {
        title: 'Audit',
        href: '#',
    }
];

interface Props {
    stockAudits: StockAudit[];
    branches: Branch[];
    selectedBranchId?: string;
}

type Branch = {
    id: number;
    name: string;
}

type StockAudit = {
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
    },
    is_locked: boolean;
}

export default function Index({ stockAudits, branches, selectedBranchId = '' } : Props) {
    useToastNotification();
    const { hasPermission } = usePermissions();
    const [currentBranchId, setCurrentBranchId] = useState(selectedBranchId || "all");

    const handleBranchChange = (value: string) => {
        setCurrentBranchId(value);

        // Send null or remove branch_id parameter when "all" is selected
        const params = value === "all" ? {} : { branch_id: value };

        router.get(route('stock.audit.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const columns: ColumnDef<StockAudit>[] = [
        createNumberColumn<StockAudit>(),
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
        {
            accessorKey: "is_locked",
            header: "Status",
            cell: ({ row }: { row: Row<StockAudit> }) => {
                const isLocked = row.getValue("is_locked");

                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${isLocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                {isLocked ? "Locked" : "Not Locked"}
            </span>
                );
            }
        },
        (hasPermission('update_stock_audit') || hasPermission('delete_stock_audit')) && (
            ActionColumn<StockAudit>({
                hasPermission: hasPermission,
                actions: (stockAudit) => [
                    {
                        label: "View Detail",
                        icon: <Eye className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('stock.audit.show', data.id)),
                        permission: 'read_stock_audit',
                    },
                    {
                        label: "Edit",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('stock.audit.edit', data.id)),
                        permission: 'update_stock_audit',
                        isHidden: (data) => data.is_locked,
                    },
                    {
                        label: "Lock",
                        icon: <Lock className="h-4 w-4" />,
                        onClick: (data) => {
                            router.patch(route('stock.audit.lock', data.id), {}, {
                                preserveScroll: true,
                            });
                        },
                        showConfirmDialog: true,
                        confirmDialogProps:{
                            title: "Lock Stock Audit",
                            description: `Are you sure you want to lock audit ${stockAudit.code}? This will prevent any further changes.`,
                            buttonText: "Lock",
                            buttonClassName: "bg-green-600",
                        },
                        permission: 'update_stock_audit',
                        isHidden: (data) => data.is_locked,
                    },
                    {
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        className: "text-red-600",
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: "Delete Stock Audit",
                            description: `This action cannot be undone. This will permanently delete audit ${stockAudit.code}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('stock.audit.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_stock_audit',
                        isHidden: (data) => data.is_locked,
                    },
                ],
            })
        )
    ].filter(Boolean) as ColumnDef<StockAudit>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Audit" />

            <div className="bg-white rounded-lg px-8 py-6">
                <Heading title="Stock Audit" description="Manage your stock audits." />

                <div className="flex justify-between items-center mb-4">
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

                    {hasPermission('create_stock_audit') && (
                        <Link href={route('stock.audit.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Stock Audit
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable columns={columns} data={stockAudits} />
            </div>
        </AppLayout>
    );
}
