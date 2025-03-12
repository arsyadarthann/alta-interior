import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { useToastNotification } from "@/hooks/use-toast-notification";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Account',
        href: route('users.index'),
    },
    {
        title: 'Create',
        href: route('users.create'),
    }
]

interface Props {
    roles: {
        id: number;
        name: string;
    }[];
}

export default function CreateUser({ roles }: Props) {
    const { data, setData, post, processing } = useForm({
        name: '',
        email: '',
        role: '',
    });

    const { showErrorToast } = useToastNotification();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('users.store'), {
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
            <Head title="Create User Account" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Create User Account"
                        description="Add a new user to the system."
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative grid gap-2">
                                <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="relative grid gap-2">
                                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="Enter email address"
                                />
                            </div>

                            <div className="relative grid gap-2">
                                <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
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

                            <div className="flex justify-end gap-3 py-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(route('users.index'))}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                >
                                    Create User
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
