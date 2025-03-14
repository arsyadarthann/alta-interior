import React from 'react';
import { Head, router, Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import Heading from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Edit, ArrowLeft, Lock, Unlock } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { createNumberColumn } from '@/components/data-table/columns';

interface ItemUnit {
    id: number;
    abbreviation: string;
    name: string;
}

interface StockAuditDetail {
    id: number;
    stock_audit_id: number;
    item_id: number;
    system_quantity: number;
    physical_quantity: number;
    discrepancy_quantity: number;
    reason: string | null;
    item: {
        id: number;
        name: string;
        unit: string;
        item_unit: ItemUnit;
    };
}

interface StockAuditProps {
    stockAudit: {
        id: number;
        code: string;
        date: string;
        branch_id: number;
        user_id: number;
        is_locked: boolean;
        branch: {
            id: number;
            name: string;
        };
        user: {
            id: number;
            name: string;
        };
        stock_audit_details: StockAuditDetail[];
    }
}

export default function Show({ stockAudit }: StockAuditProps) {
    const { hasPermission } = usePermissions();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Stock',
            href: '#',
        },
        {
            title: 'Audit',
            href: route('stock.audit.index'),
        },
        {
            title: stockAudit.code,
            href: route('stock.audit.show', stockAudit.id)
        }
    ];

    const handleEdit = () => {
        router.visit(route('stock.audit.edit', stockAudit.id));
    };

    const handleToggleLock = () => {
        router.post(route('stock.audit.lock', stockAudit.id));
    };

    const columns: ColumnDef<StockAuditDetail>[] = [
        createNumberColumn<StockAuditDetail>(),
        {
            accessorKey: "item.name",
            header: "Item Name",
        },
        {
            accessorKey: "system_quantity",
            header: "System Quantity",
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue("system_quantity"));
                const formattedQty = qty % 1 === 0 ?
                    qty.toString() :
                    qty.toFixed(2).replace(/\.?0+$/, '');
                return `${formattedQty} ${row.original.item.item_unit.abbreviation}`;
            },
            meta: {
                className: "text-center",
            },
        },
        {
            accessorKey: "physical_quantity",
            header: "Physical Count",
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue("physical_quantity"));
                const formattedQty = qty % 1 === 0 ?
                    qty.toString() :
                    qty.toFixed(2).replace(/\.?0+$/, '');
                return `${formattedQty} ${row.original.item.item_unit.abbreviation}`;
            },
            meta: {
                className: "text-center",
            },
        },
        {
            accessorKey: "discrepancy_quantity",
            header: "Discrepancy",
            cell: ({ row }) => {
                const qty = parseFloat(row.getValue("discrepancy_quantity"));
                const formattedQty = qty % 1 === 0 ?
                    qty.toString() :
                    qty.toFixed(2).replace(/\.?0+$/, '');
                return (
                    <span className={qty < 0 ? 'text-red-500' : qty > 0 ? 'text-green-500' : 'text-gray-500'}>
                        {formattedQty} {row.original.item.item_unit.abbreviation}
                    </span>
                );
            },
            meta: {
                className: "text-center",
            },
        },
        {
            accessorKey: "reason",
            header: "Reason",
            cell: ({ row }) => row.getValue("reason") || "-"
        }
    ];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Stock Audit: ${stockAudit.code}`} />

            <div className="bg-white rounded-lg px-8 py-6">
                <div className="flex justify-between items-center mb-6">
                    <Heading
                        title="Stock Audit"
                        description="Stock audit details and results"
                    />
                    <div className="flex gap-3">
                        <Link href={route('stock.audit.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                        {hasPermission('update_stock_audit') && !stockAudit.is_locked && (
                            <Button
                                onClick={handleEdit}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Edit className="h-4 w-4" /> Edit
                            </Button>
                        )}
                        {hasPermission('lock_stock_audit') && (
                            <Button
                                onClick={handleToggleLock}
                                variant={stockAudit.is_locked ? "destructive" : "default"}
                                className="flex items-center gap-2"
                            >
                                {stockAudit.is_locked ? (
                                    <>
                                        <Unlock className="h-4 w-4" /> Unlock
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" /> Lock
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <Card className="border-0 shadow-sm h-full">
                            <div className="p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Audit Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Audit Code</h3>
                                            <p className="mt-1 text-sm text-gray-900">{stockAudit.code}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Audit Date</h3>
                                            <p className="mt-1 text-sm text-gray-900">{formatDate(stockAudit.date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Audited By</h3>
                                            <p className="mt-1 text-sm text-gray-900">{stockAudit.user.name}</p>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Branch</h3>
                                            <p className="mt-1 text-sm text-gray-900">{stockAudit.branch.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                            <div className="mt-1">
                                                {stockAudit.is_locked ? (
                                                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                                                        Locked
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                        Not Locked
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card className="border-0 shadow-sm h-full">
                            <div className="p-6">
                                <div className="flex items-center mb-4">
                                    <h2 className="text-base font-semibold text-gray-900">Audit Items</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {stockAudit.stock_audit_details.length} items
                                    </Badge>
                                </div>

                                {stockAudit.stock_audit_details.length > 0 ? (
                                    <DataTable
                                        data={stockAudit.stock_audit_details}
                                        columns={columns}
                                        pageSize={10}
                                    />
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>No audit items found</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
