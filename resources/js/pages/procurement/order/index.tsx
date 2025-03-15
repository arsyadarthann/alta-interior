import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Eye, Plus, Printer } from 'lucide-react';
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
        title: 'Procurement',
        href: '#',
    },
    {
        title: 'Purchase Order',
        href: '#',
    }
];

interface Props {
    purchaseOrders: PurchaseOrder[];
    branches: Branch[];
    selectedBranchId?: string;
}

type Branch = {
    id: number;
    name: string;
}

type PurchaseOrder = {
    id: number;
    code: string;
    date: string;
    branch: {
        id: number;
        name: string;
    };
    supplier: {
        id: number;
        name: string;
    }
    expected_delivery_date: string;
    status: string;
}

export default function Index({ purchaseOrders, branches, selectedBranchId = '' }: Props) {
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
                        only: ['purchaseOrders'],
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

            router.get(route('procurement.order.index'), params, {
                preserveState: true,
                preserveScroll: true,
                only: ['purchaseOrders', 'branches', 'selectedBranchId'],
            });
        }
    };

    const columns: ColumnDef<PurchaseOrder>[] = [
        createNumberColumn<PurchaseOrder>(),
        {
            accessorKey: "code",
            header: "Code",
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }: { row: Row<PurchaseOrder> }) => {
                const date = row.getValue("date") as string;

                const formatDate = (dateString: string): string => {
                    const date = new Date(dateString);
                    const [year, month, day] = date.toISOString().split('T')[0].split('-');
                    return `${year}-${month}-${day}`;
                };

                return formatDate(date);
            }
        },
        {
            accessorKey: "branch.name",
            header: "Branch",
        },
        {
            accessorKey: "supplier.name",
            header: "Supplier",
        },
        {
            accessorKey: "expected_delivery_date",
            header: "Expected Delivery",
            cell: ({ row }: { row: Row<PurchaseOrder> }) => {
                const expected_delivery_date = row.getValue("expected_delivery_date") as string;

                const formatDate = (dateString: string): string => {
                    const date = new Date(dateString);
                    const [year, month, day] = date.toISOString().split('T')[0].split('-');
                    return `${year}-${month}-${day}`;
                };

                return formatDate(expected_delivery_date);
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }: { row: Row<PurchaseOrder> }) => {
                const status = row.getValue("status") as string;

                const capitalizeWords = (str: string): string => {
                    return str.split(' ').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ');
                };

                let bgColor = "";
                let textColor = "";

                if (status === "pending") {
                    bgColor = "bg-yellow-100";
                    textColor = "text-yellow-800";
                } else if (status === "partially_received") {
                    bgColor = "bg-blue-100";
                    textColor = "text-blue-800";
                } else if (status === "received") {
                    bgColor = "bg-green-100";
                    textColor = "text-green-800";
                }

                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${bgColor} ${textColor}`}>
                        {capitalizeWords(status)}
                    </span>
                );
            }
        },
        (hasPermission('update_stock_audit') || hasPermission('delete_stock_audit')) && (
            ActionColumn<PurchaseOrder>({
                hasPermission: hasPermission,
                actions: (purchaseOrder) => [
                    {
                        label: "View Detail",
                        icon: <Eye className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('procurement.order.show', data.id)),
                        permission: 'read_purchase_order',
                    },
                    {
                        label: "Edit",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('procurement.order.edit', data.id)),
                        permission: 'update_purchase_order',
                        isHidden: (data) => (data.status !== "pending"),
                    },
                    {
                        label: "Print PDF",
                        icon: <Printer className="h-4 w-4" />,
                        onClick: (data) => {
                            window.open(route('procurement.order.generate-pdf', data.id), '_blank');
                        },
                        permission: 'read_purchase_order',
                    },
                    {
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        className: "text-red-600",
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: "Delete Purchase Order",
                            description: `This action cannot be undone. This will permanently delete purchase order ${purchaseOrder.code}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('procurement.order.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_purchase_order',
                        isHidden: (data) => (data.status !== "pending"),
                    },
                ],
            })
        )
    ].filter(Boolean) as ColumnDef<PurchaseOrder>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Order" />

            <div className="bg-white rounded-lg px-8 py-6">
                <Heading title="Purchase Order" description="Manage your purchase orders." />

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

                    {hasPermission('create_purchase_order') && (
                        <Link href={route('procurement.order.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Purchase Order
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable columns={columns} data={purchaseOrders} />
            </div>
        </AppLayout>
    );
}
