import {Head, router, useForm} from '@inertiajs/react';
import React, {useEffect} from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { useToastNotification } from "@/hooks/use-toast-notification";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {CheckedState} from "@radix-ui/react-checkbox";

interface Props {
    permissions: {
        id: number;
        name: string;
    }[];
}

export default function CreateRole({ permissions }: Props) {
    const { showErrorToast } = useToastNotification();
    const [selectAll, setSelectAll] = React.useState(false);

    const formatPermissionName = (name: string): string => {
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const form = useForm({
        name: '',
        permissions: [] as number[],
    });

    // @ts-ignore
    useEffect(() => {
        const allSelected = form.data.permissions.length === permissions.length;
        setSelectAll(allSelected);
    }, [form.data.permissions]);

    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked);
        if (checked) {
            form.setData('permissions', permissions.map(p => p.id));
        } else {
            form.setData('permissions', []);
        }
    };

    const handlePermissionChange = (checked: CheckedState, permissionId: number) => {
        if (checked) {
            form.setData('permissions', [
                ...form.data.permissions,
                permissionId
            ]);
        } else {
            form.setData('permissions',
                form.data.permissions.filter(id => id !== permissionId)
            );
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('roles.store'), {
            onError: showErrorToast,
        });
    };


    return (
        <AppLayout>
            <Head title="Create Role" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Create Role"
                        description="Create a new role with permissions."
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="name">Role Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={form.data.name}
                                onChange={e => form.setData('name', e.target.value)}
                                className={form.errors.name ? "border-red-500" : ""}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <Label>Permissions</Label>
                                    <span className="text-sm text-muted-foreground">
                                        ({form.data.permissions.length} of {permissions.length} selected)
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="select-all"
                                        checked={selectAll}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <Label
                                        htmlFor="select-all"
                                        className="text-sm font-medium cursor-pointer hover:text-primary"
                                    >
                                        All Permissions
                                    </Label>
                                </div>
                            </div>


                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                {permissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`permission-${permission.id}`}
                                            checked={form.data.permissions.includes(permission.id)}
                                            onCheckedChange={(checked) => handlePermissionChange(checked, permission.id)}
                                        />
                                        <Label htmlFor={`permission-${permission.id}`}>
                                            {formatPermissionName(permission.name)}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 py-4">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => router.visit(route('roles.index'))}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing}
                            >
                                {form.processing ? 'Creating...' : 'Create Role'}
                            </Button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
