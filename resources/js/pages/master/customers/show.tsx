import React from 'react';
import { Head, router, Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import Heading from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Edit, ArrowLeft } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { createNumberColumn } from '@/components/data-table/columns';

interface CustomerPrice {
    id: number;
    item_id: number;
    price: number;
    item: {
        id: number;
        name: string;
    };
}

interface CustomerProps {
    customer: {
        id: number;
        name: string;
        contact_name: string;
        email: string;
        phone: string;
        address: string;
        customer_prices?: CustomerPrice[];
    }
}

export default function Show({ customer }: CustomerProps) {
    const { hasPermission } = usePermissions();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Customers',
            href: route('customers.index'),
        },
        {
            title: customer.name,
            href: route('customers.show', customer.id)
        }
    ];

    const handleEdit = () => {
        router.visit(route('customers.edit', customer.id));
    };

    const columns: ColumnDef<CustomerPrice>[] = [
        createNumberColumn<CustomerPrice>(),
        {
            accessorKey: "item.name",
            header: "Item Name",
        },
        {
            accessorKey: "price",
            header: "Special Price",
            cell: ({ row }) => {
                const price = parseFloat(row.getValue("price"));
                return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR'
                }).format(price);
            },
            meta: {
                className: "text-center",
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={customer.name} />

            <div className="bg-white rounded-lg px-8 py-6">
                <div className="flex justify-between items-center mb-6">
                    <Heading
                        title={customer.name}
                        description="Customer details and information"
                    />
                    <div className="flex gap-3">
                        <Link href={route('customers.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                        {hasPermission('update_customer') && (
                            <Button
                                onClick={handleEdit}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Edit className="h-4 w-4" /> Edit
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <Card className="border-0 shadow-sm h-full">
                            <div className="p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Customer Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
                                        <p className="mt-1 text-sm text-gray-900">{customer.contact_name}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                                        <p className="mt-1 text-sm text-gray-900">{customer.email || '-'}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                                        <p className="mt-1 text-sm text-gray-900">{customer.phone}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Address</h3>
                                        <p className="mt-1 text-sm text-gray-900">{customer.address}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        {customer.customer_prices && customer.customer_prices.length > 0 ? (
                            <Card className="border-0 shadow-sm h-full">
                                <div className="p-6">
                                    <div className="flex items-center mb-4">
                                        <h2 className="text-base font-semibold text-gray-900">Special Pricing</h2>
                                        <Badge variant="secondary" className="ml-2">
                                            {customer.customer_prices.length} items
                                        </Badge>
                                    </div>

                                    <DataTable
                                        data={customer.customer_prices}
                                        columns={columns}
                                        pageSize={5}
                                    />
                                </div>
                            </Card>
                        ) : (
                            <Card className="border-0 shadow-sm h-full flex items-center justify-center p-6">
                                <div className="text-center text-gray-500">
                                    <p>No special pricing found for this customer</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
