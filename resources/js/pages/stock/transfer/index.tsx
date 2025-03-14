import React from 'react';
import { Head, Link, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Eye, Plus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from "@/components/data-table";
import Heading from "@/components/heading";
import { useToastNotification } from "@/hooks/use-toast-notification";
import { createNumberColumn } from "@/components/data-table/columns";
import { ActionColumn } from "@/components/data-table/action-column";
import { usePermissions } from "@/hooks/use-permissions";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stock',
        href: '#',
    },
    {
        title: 'Transfer',
        href: '#',
    }
];

interface Props {
    stockTransfers: StockTransfer[];
}

type StockTransfer = {
    id: number;
    code: string;
    date: string;
    from_branch: {
        id: number;
        name: string;
    };
    to_branch: {
        id: number;
        name: string;
    }
    user: {
        id: number;
        name: string;
    }
}

export default function Index({ stockTransfers }: Props) {
    useToastNotification();

    const { hasPermission } = usePermissions();

    const columns: ColumnDef<StockTransfer>[] = [
        createNumberColumn<StockTransfer>(),
        {
            accessorKey: "code",
            header: "Code",
        },
        {
            accessorKey: "date",
            header: "Date",
        },
        {
            accessorKey: "from_branch.name",
            header: "From",
        },
        {
            accessorKey: "to_branch.name",
            header: "To",
        },
        {
            accessorKey: "user.name",
            header: "Created By",
        },
        ActionColumn<StockTransfer>({
            hasPermission: hasPermission,
            actions: () => [
                {
                    label: "View Detail",
                    icon: <Eye className="h-4 w-4" />,
                    onClick: (data) => router.visit(route('stock.transfer.show', data.id)),
                    permission: 'read_stock_transfer',
                }
            ],
        })
    ].filter(Boolean) as ColumnDef<StockTransfer>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Transfer" />

            <div className="bg-white rounded-lg px-8 py-6">
                <div className="flex justify-between items-center">
                    <Heading title="Stock Transfer" description="Manage your stock transfers." />

                    {hasPermission('create_stock_transfer') && (
                        <Link href={route('stock.transfer.create')}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Stock Transfer
                            </Button>
                        </Link>
                    )}
                </div>

                <DataTable columns={columns} data={stockTransfers} />
            </div>
        </AppLayout>
    );
}
