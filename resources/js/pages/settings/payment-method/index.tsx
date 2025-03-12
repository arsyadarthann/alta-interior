import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { useToastNotification } from "@/hooks/use-toast-notification";
import { ColumnDef, Row } from "@tanstack/react-table";
import { createNumberColumn } from "@/components/data-table/columns";
import { ActionColumn } from "@/components/data-table/action-column";
import { Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/use-permissions";

type PaymentMethod = {
    id: number;
    name: string;
    charge_percentage: number;
}

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
    });

    const editForm = useForm({
        name: '',
        charge_percentage: '',
    });

    const handleCreateSubmit = (e: { preventDefault: () => void }) => {
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

    const handleEditSubmit = (e: { preventDefault: () => void }) => {
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

            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall title="Payment Methods" description="Manage your payment methods." />

                        {hasPermission('create_payment_method') && <Button onClick={() => setIsCreateModalOpen(true)}>Create Payment Method</Button>}
                    </div>

                    <DataTable columns={columns} data={paymentMethods} />

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Payment Method</DialogTitle>
                                <DialogDescription>
                                    Create a new payment method to your system.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="create-name">Name</Label>
                                    <Input
                                        id="create-name"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="create-charge">Charge Percentage (%)</Label>
                                    <Input
                                        id="create-charge"
                                        type="number"
                                        step="0.01"
                                        value={createForm.data.charge_percentage}
                                        onChange={(e) => createForm.setData('charge_percentage', e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end gap-x-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createForm.processing}>
                                        Create Payment Method
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Payment Method</DialogTitle>
                                <DialogDescription>
                                    Modify your payment method.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input id="edit-name" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="edit-charge">Charge Percentage (%)</Label>
                                    <Input
                                        id="edit-charge"
                                        type="number"
                                        step="0.01"
                                        value={editForm.data.charge_percentage}
                                        onChange={(e) => editForm.setData('charge_percentage', e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end gap-x-2">
                                    <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={editForm.processing}>
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payment Method',
        href: route('payment-methods.index'),
    }
];
