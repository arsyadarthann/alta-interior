import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import { FormDialog } from '@/components/form-dialog';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

type TaxRate = {
    id: number;
    rate: number;
};

interface Props {
    taxRates: TaxRate[];
}

export default function TaxRate({ taxRates }: Props) {
    const { hasPermission } = usePermissions();
    const { showErrorToast } = useToastNotification();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | undefined>();

    const createForm = useForm({
        rate: '',
    });

    const editForm = useForm({
        rate: selectedTaxRate ? (selectedTaxRate.rate % 1 === 0 ? Math.floor(selectedTaxRate.rate).toString() : selectedTaxRate.rate.toString()) : '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('tax-rates.store'), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset('rate');
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTaxRate) return;

        editForm.put(route('tax-rates.update', selectedTaxRate.id), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedTaxRate(undefined);
            },
        });
    };

    const columns: ColumnDef<TaxRate>[] = [
        createNumberColumn<TaxRate>(),
        {
            accessorKey: 'rate',
            header: 'Rate (%)',
            cell: ({ row }: { row: Row<TaxRate> }) => {
                const rate = row.original.rate;
                const formattedRate = rate % 1 === 0 ? Math.floor(rate) : rate;
                return `${formattedRate}%`;
            },
        },
        (hasPermission('update_tax_rate') || hasPermission('delete_tax_rate')) &&
            ActionColumn<TaxRate>({
                hasPermission: hasPermission,
                actions: (taxRate) => [
                    {
                        label: 'Edit',
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => {
                            setSelectedTaxRate(data);
                            editForm.setData('rate', data.rate % 1 === 0 ? Math.floor(data.rate).toString() : data.rate.toString());
                            setIsEditModalOpen(true);
                        },
                        permission: 'update_tax_rate',
                    },
                    {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4" />,
                        className: 'text-red-600',
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Delete Tax Rate',
                            description: `This action cannot be undone. This will permanently delete ${taxRate.rate}% tax rate.`,
                        },
                        onClick: (data) => {
                            router.delete(route('tax-rates.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_tax_rate',
                    },
                ],
            }),
    ].filter(Boolean) as ColumnDef<TaxRate>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tax Rate" />

            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall title="Tax Rate" description="Manage your tax rate." />
                        {hasPermission('create_tax_rate') && (
                            <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Add Tax Rate
                            </Button>
                        )}
                    </div>

                    <DataTable columns={columns} data={taxRates} searchable={false} />

                    <FormDialog
                        title="Add Tax Rate"
                        description="Create a new tax rate for your products."
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateSubmit}
                        isProcessing={createForm.processing}
                        submitLabel="Create"
                        processingLabel="Creating..."
                    >
                        <div className="relative grid gap-2 space-y-2">
                            <Label htmlFor="rate">
                                Tax Rate (%) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="rate"
                                type="number"
                                step="0.01"
                                value={createForm.data.rate}
                                onChange={(e) => createForm.setData('rate', e.target.value)}
                                placeholder="Enter tax rate percentage"
                                className={createForm.errors.rate ? 'border-red-500 ring-red-100' : ''}
                            />
                        </div>
                    </FormDialog>

                    <FormDialog
                        title="Edit Tax Rate"
                        description="Update the tax rate value."
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSubmit={handleEditSubmit}
                        isProcessing={editForm.processing}
                        submitLabel="Save Changes"
                        processingLabel="Saving..."
                    >
                        <div className="relative grid gap-2 space-y-2">
                            <Label htmlFor="edit_rate">Tax Rate (%)</Label>
                            <Input
                                id="edit_rate"
                                type="number"
                                step="0.01"
                                value={editForm.data.rate}
                                onChange={(e) => editForm.setData('rate', e.target.value)}
                                placeholder="Enter tax rate percentage"
                                className={editForm.errors.rate ? 'border-red-500 ring-red-100' : ''}
                            />
                        </div>
                    </FormDialog>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tax Rate',
        href: route('tax-rates.index'),
    },
];
