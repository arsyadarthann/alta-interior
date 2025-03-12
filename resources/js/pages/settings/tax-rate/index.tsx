import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { useToastNotification } from "@/hooks/use-toast-notification";
import { ColumnDef, Row } from "@tanstack/react-table";
import { createNumberColumn } from "@/components/data-table/columns";
import { ActionColumn } from "@/components/data-table/action-column";
import { Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/use-permissions";

type TaxRate = {
    id: number;
    rate: number;
}

interface Props {
    taxRates: TaxRate[];
    editingTaxRate?: TaxRate;
}

export default function TaxRate({ taxRates, editingTaxRate }: Props) {
    const { hasPermission } = usePermissions();
    const { showErrorToast } = useToastNotification();

    const createForm = useForm({
        rate: '',
    });

    const editForm = useForm({
        rate: editingTaxRate ?
            (editingTaxRate.rate % 1 === 0 ?
                    Math.floor(editingTaxRate.rate).toString() :
                    editingTaxRate.rate.toString()
            ) : '',
    });

    const handleCreateSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        createForm.post(route('tax-rates.store'), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                createForm.reset('rate');
            }
        });
    };

    const handleEditSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        if (!editingTaxRate) return;

        editForm.put(route('tax-rates.update', editingTaxRate.id), {
            preserveScroll: true,
            onError: showErrorToast
        });
    };

    const orderedTaxRates = [...taxRates].sort((a, b) => {
        if (a.id === editingTaxRate?.id) return -1;
        if (b.id === editingTaxRate?.id) return 1;
        return 0;
    });

    const columns: ColumnDef<TaxRate>[] = [
        createNumberColumn<TaxRate>(),
        {
            accessorKey: "rate",
            header: "Rate (%)",
            cell: ({ row }: { row: Row<TaxRate> }) => {
                const rate = row.original.rate;
                // Check if the decimal part is .00
                const formattedRate = rate % 1 === 0 ? Math.floor(rate) : rate;
                return `${formattedRate}%`;
            }
        },
        (hasPermission('update_tax_rate') || hasPermission('delete_tax_rate')) && (
            ActionColumn<TaxRate>({
                hasPermission: hasPermission,
                isHighlighted: (taxRate) => taxRate.id === editingTaxRate?.id,
                actions: (taxRate) => [
                    {
                        label: "Edit",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('tax-rates.index', {
                            id: data.id
                        }), {
                            preserveScroll: true
                        }),
                        permission: 'update_tax_rate',
                    },
                    {
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        className: "text-red-600",
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: "Delete Tax Rate",
                            description: `This action cannot be undone. This will permanently delete ${taxRate.rate}% tax rate.`,
                        },
                        onClick: (data) => {
                            router.delete(route('tax-rates.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_tax_rate',
                    }
                ],
            })
        )
    ].filter(Boolean) as ColumnDef<TaxRate>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tax Rate" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Tax Rate"
                        description="Manage your tax rate."
                    />

                    {editingTaxRate ? (
                        <form onSubmit={handleEditSubmit} className="mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex-grow">
                                    <Label htmlFor="edit_rate" className="sr-only">
                                        Tax Rate
                                    </Label>
                                    <Input
                                        id="edit_rate"
                                        type="number"
                                        step="0.01"
                                        value={editForm.data.rate}
                                        onChange={e => editForm.setData('rate', e.target.value)}
                                        placeholder="Enter tax rate percentage"
                                        className={editForm.errors.rate ? "border-red-500 ring-red-100" : ""}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="px-8"
                                    >
                                        {editForm.processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit(route('tax-rates.index'))}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        hasPermission('create_tax_rate') && (
                            <form onSubmit={handleCreateSubmit} className="mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex-grow">
                                        <Label htmlFor="rate" className="sr-only">
                                            Tax Rate
                                        </Label>
                                        <Input
                                            id="rate"
                                            type="number"
                                            step="0.01"
                                            value={createForm.data.rate}
                                            onChange={e => createForm.setData('rate', e.target.value)}
                                            placeholder="Enter tax rate percentage"
                                            className={createForm.errors.rate ? "border-red-500 ring-red-100" : ""}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="px-8"
                                    >
                                        {createForm.processing ? 'Creating...' : 'Create Tax Rate'}
                                    </Button>
                                </div>
                            </form>
                        )
                    )}

                    <DataTable
                        columns={columns}
                        data={orderedTaxRates}
                        rowClassName={(row) =>
                            row.original.id === editingTaxRate?.id ?
                                "bg-gray-200" : ""
                        }
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tax Rate',
        href: route('tax-rates.index'),
    }
];
