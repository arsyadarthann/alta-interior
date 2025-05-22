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

type PaymentMethod = {
    id: number;
    name: string;
    charge_percentage: number;
    account_number?: string;
    account_name?: string;
};

interface Props {
    paymentMethods: PaymentMethod[];
}

export default function PaymentMethod({ paymentMethods }: Props) {
    const { hasPermission } = usePermissions();
    const { showErrorToast } = useToastNotification();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

    const createForm = useForm({
        name: '',
        charge_percentage: '',
        account_number: '',
        account_name: '',
    });

    const editForm = useForm({
        name: '',
        charge_percentage: '',
        account_number: '',
        account_name: '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('payment-methods.store'), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPaymentMethod) return;

        editForm.put(route('payment-methods.update', selectedPaymentMethod.id), {
            preserveScroll: true,
            onError: showErrorToast,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedPaymentMethod(null);
                editForm.reset();
            },
        });
    };

    const handleEditClick = (paymentMethod: PaymentMethod) => {
        setSelectedPaymentMethod(paymentMethod);
        editForm.setData({
            name: paymentMethod.name,
            charge_percentage:
                paymentMethod.charge_percentage % 1 === 0
                    ? Math.floor(paymentMethod.charge_percentage).toString()
                    : paymentMethod.charge_percentage.toString(),
            account_number: paymentMethod.account_number || '',
            account_name: paymentMethod.account_name || '',
        });
        setIsEditModalOpen(true);
    };

    const columns: ColumnDef<PaymentMethod>[] = [
        createNumberColumn<PaymentMethod>(),
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            accessorKey: 'charge_percentage',
            header: 'Charge (%)',
            cell: ({ row }: { row: Row<PaymentMethod> }) => {
                const charge = row.original.charge_percentage;
                const formattedCharge = charge % 1 === 0 ? Math.floor(charge) : charge;
                return `${formattedCharge}%`;
            },
        },
        {
            accessorKey: 'account_number',
            header: 'Account Number',
            cell: ({ row }: { row: Row<PaymentMethod> }) => {
                return row.original.account_number ?? '-';
            },
        },
        {
            accessorKey: 'account_name',
            header: 'Account Name',
            cell: ({ row }: { row: Row<PaymentMethod> }) => {
                return row.original.account_name ?? '-';
            },
        },
        (hasPermission('update_payment_method') || hasPermission('delete_payment_method')) &&
            ActionColumn<PaymentMethod>({
                hasPermission: hasPermission,
                actions: (paymentMethod) => [
                    {
                        label: 'Edit',
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: handleEditClick,
                        permission: 'update_payment_method',
                    },
                    {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4" />,
                        className: 'text-red-600',
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Delete Payment Method',
                            description: `This action cannot be undone. This will permanently delete ${paymentMethod.name}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('payment-methods.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_payment_method',
                    },
                ],
            }),
    ].filter(Boolean) as ColumnDef<PaymentMethod>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Methods" />

            <SettingsLayout fullWidth>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall title="Payment Methods" description="Manage your payment methods." />

                        {hasPermission('create_payment_method') && (
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Payment Method
                            </Button>
                        )}
                    </div>

                    <DataTable columns={columns} data={paymentMethods} searchable={false} />

                    <FormDialog
                        title="Add Payment Method"
                        description="Create a new payment method to your system."
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateSubmit}
                        isProcessing={createForm.processing}
                        submitLabel="Create"
                        processingLabel="Creating..."
                    >
                        <div className="space-y-4">
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="create-name">Name</Label>
                                <Input
                                    id="create-name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="Enter payment method name"
                                    className={createForm.errors.name ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="create-charge">Charge Percentage (%)</Label>
                                <Input
                                    id="create-charge"
                                    type="number"
                                    step="0.01"
                                    value={createForm.data.charge_percentage}
                                    onChange={(e) => createForm.setData('charge_percentage', e.target.value)}
                                    placeholder="Enter payment method charge percentage"
                                    min="0"
                                    max="100"
                                    className={createForm.errors.charge_percentage ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="create-account-number">Account Number (Optional)</Label>
                                <Input
                                    id="create-account-number"
                                    value={createForm.data.account_number}
                                    onChange={(e) => createForm.setData('account_number', e.target.value)}
                                    placeholder="Enter account number"
                                    className={createForm.errors.account_number ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="create-account-name">Account Name (Optional)</Label>
                                <Input
                                    id="create-account-name"
                                    value={createForm.data.account_name}
                                    onChange={(e) => createForm.setData('account_name', e.target.value)}
                                    placeholder="Enter account name"
                                    className={createForm.errors.account_name ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                        </div>
                    </FormDialog>

                    <FormDialog
                        title="Edit Payment Method"
                        description="Modify your payment method."
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSubmit={handleEditSubmit}
                        isProcessing={editForm.processing}
                        submitLabel="Save Changes"
                        processingLabel="Saving..."
                    >
                        <div className="space-y-4">
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    placeholder="Enter payment method name"
                                    className={editForm.errors.name ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="edit-charge">Charge Percentage (%)</Label>
                                <Input
                                    id="edit-charge"
                                    type="number"
                                    step="0.01"
                                    value={editForm.data.charge_percentage}
                                    onChange={(e) => editForm.setData('charge_percentage', e.target.value)}
                                    placeholder="Enter payment method charge percentage"
                                    min="0"
                                    max="100"
                                    className={editForm.errors.charge_percentage ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="edit-account-number">Account Number (Optional)</Label>
                                <Input
                                    id="edit-account-number"
                                    value={editForm.data.account_number}
                                    onChange={(e) => editForm.setData('account_number', e.target.value)}
                                    placeholder="Enter account number"
                                    className={editForm.errors.account_number ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                            <div className="relative grid gap-2 space-y-2">
                                <Label htmlFor="edit-account-name">Account Name (Optional)</Label>
                                <Input
                                    id="edit-account-name"
                                    value={editForm.data.account_name}
                                    onChange={(e) => editForm.setData('account_name', e.target.value)}
                                    placeholder="Enter account name"
                                    className={editForm.errors.account_name ? 'border-red-500 ring-red-100' : ''}
                                />
                            </div>
                        </div>
                    </FormDialog>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payment Method',
        href: route('payment-methods.index'),
    },
];
