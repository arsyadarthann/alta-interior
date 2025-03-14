import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { useToastNotification } from "@/hooks/use-toast-notification";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        branch_id: string;
        roles: [{
            id: number;
            name: string;
        }];
        branch : {
            id: number;
            name: string;
        }
    };
    roles: {
        id: number;
        name: string;
    }[];
    branches: {
        id: number;
        name: string;
    }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Account',
        href: route('users.index'),
    },
    {
        title: 'Edit',
        href: '#',
    }
]

export default function EditUser({ user, roles, branches }: Props) {
    const { data, setData, put, processing } = useForm({
        name: user.name,
        email: user.email,
        role: user.roles[0].name,
        branch_id: user.branch_id ? user.branch_id.toString() : ""
    });

    const { showErrorToast } = useToastNotification();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('users.update', user.id), {
            onError: showErrorToast
        });
    };

    const formatRoleName = (name: string): string => {
        return name
            .split(/[_\s-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit User Account" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Edit User Account"
                        description="Modify user account information."
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="branch_id">Branch</Label>
                                <Select
                                    value={data.branch_id}
                                    onValueChange={(value) => setData('branch_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                {formatRoleName(branch.name)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">
                                    Role <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(value) => setData('role', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.name} value={role.name.toString()}>
                                                {formatRoleName(role.name)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
