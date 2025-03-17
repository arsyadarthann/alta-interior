import { DataTable } from '@/components/data-table';
import { createNumberColumn } from '@/components/data-table/columns';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Edit } from 'lucide-react';
import { useState } from 'react';

interface CustomerPrice {
    id: number;
    item_id: number;
    price: number;
    item: {
        id: number;
        name: string;
    };
}

// Updated interface with paginated customer_prices
interface CustomerProps {
    customer: {
        id: number;
        name: string;
        contact_name: string;
        email: string;
        phone: string;
        address: string;
        customer_prices: {
            data: CustomerPrice[];
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
}

export default function Show({ customer }: CustomerProps) {
    const { hasPermission } = usePermissions();
    const [isLoading, setIsLoading] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Customers',
            href: route('customers.index'),
        },
        {
            title: customer.name,
            href: route('customers.show', customer.id),
        },
    ];

    const handleEdit = () => {
        router.visit(route('customers.edit', customer.id));
    };

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        router.get(
            route('customers.show', customer.id),
            { page },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['customer'],
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const columns: ColumnDef<CustomerPrice>[] = [
        createNumberColumn<CustomerPrice>(),
        {
            accessorKey: 'item.name',
            header: 'Item Name',
        },
        {
            accessorKey: 'price',
            header: 'Special Price',
            cell: ({ row }) => {
                const price = parseFloat(row.getValue('price'));
                return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(price);
            },
            meta: {
                className: 'text-center',
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={customer.name} />

            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title={customer.name} description="Customer details and information" />
                    <div className="flex gap-3">
                        <Link href={route('customers.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                        {hasPermission('update_customer') && (
                            <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2">
                                <Edit className="h-4 w-4" /> Edit
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <Card className="h-full border-0 shadow-sm">
                            <div className="p-6">
                                <h2 className="mb-4 text-base font-semibold text-gray-900">Customer Information</h2>
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
                        <Card className="h-full border-0 shadow-sm">
                            <div className="p-6">
                                <div className="mb-4 flex items-center">
                                    <h2 className="text-base font-semibold text-gray-900">Special Pricing</h2>
                                    <Badge variant="secondary" className="ml-2">
                                        {customer.customer_prices.total} items
                                    </Badge>
                                </div>

                                {customer.customer_prices.data && customer.customer_prices.data.length > 0 ? (
                                    <DataTable
                                        data={customer.customer_prices.data}
                                        columns={columns}
                                        serverPagination={{
                                            pageCount: customer.customer_prices.last_page,
                                            currentPage: customer.customer_prices.current_page,
                                            totalItems: customer.customer_prices.total,
                                            onPageChange: handlePageChange,
                                            isLoading: isLoading,
                                        }}
                                    />
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No special pricing found for this customer</p>
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
