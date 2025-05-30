import { DataTable } from '@/components/data-table';
import { ActionColumn } from '@/components/data-table/action-column';
import { createNumberColumn } from '@/components/data-table/columns';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: route('roles.index'),
    },
];

type Role = {
    id: number;
    name: string;
};

interface Props {
    roles: Role[];
}

export default function Role({ roles }: Props) {
    useToastNotification();
    const { hasPermission } = usePermissions();

    // @ts-ignore
    const columns: ColumnDef<Role>[] = [
        createNumberColumn<Role>(),
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }: { row: Row<Role> }) => row.original.name,
        },
        (hasPermission('update_role') || hasPermission('delete_role')) &&
            ActionColumn<Role>({
                hasPermission: hasPermission,
                actions: (role) => [
                    {
                        label: 'Edit',
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: (data) => router.visit(route('roles.edit', data.id)),
                        permission: 'update_role',
                    },
                    {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4" />,
                        className: 'text-red-600',
                        showConfirmDialog: true,
                        confirmDialogProps: {
                            title: 'Delete Role',
                            description: `This action cannot be undone. This will permanently delete ${role.name}.`,
                        },
                        onClick: (data) => {
                            router.delete(route('roles.destroy', data.id), {
                                preserveScroll: true,
                            });
                        },
                        permission: 'delete_role',
                    },
                ],
            }),
    ].filter(Boolean) as ColumnDef<Role>[];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall title="Roles" description="Manage your roles." />

                        {hasPermission('create_role') && (
                            <Button onClick={() => router.visit(route('roles.create'))}>
                                <Plus className="h-4 w-4" />
                                Add Role
                            </Button>
                        )}
                    </div>

                    <DataTable columns={columns} data={roles} searchable={false} />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
