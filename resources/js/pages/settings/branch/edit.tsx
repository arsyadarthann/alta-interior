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
import { Textarea } from "@/components/ui/textarea";

interface Props {
    branch: {
        id: number;
        name: string;
        initial: string;
        contact: string;
        address: string;
    }
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Branch',
        href: route('branches.index'),
    },
    {
        title: 'Edit',
        href: '#',
    }
]

export default function EditBranch({ branch }: Props) {
    const { data, setData, put, processing } = useForm({
        name: branch.name,
        initial: branch.initial,
        contact: branch.contact,
        address: branch.address,
    })

    const { showErrorToast } = useToastNotification();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('branches.update', branch.id), {
            onError: showErrorToast
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Branch" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Edit Branch"
                        description="Modify branch information."
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative grid gap-2">
                                <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Enter branch name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative grid gap-2">
                                    <Label htmlFor="initial">
                                        Initial <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="initial"
                                        value={data.initial}
                                        onChange={e => setData('initial', e.target.value)}
                                        placeholder="Enter initial branch"
                                    />
                                </div>

                                <div className="relative grid gap-2">
                                    <Label htmlFor="contact">
                                        Contact <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="contact"
                                        value={data.contact}
                                        onChange={e => setData('contact', e.target.value)}
                                        placeholder="6281234567890"
                                    />
                                </div>
                            </div>

                            <div className="relative grid gap-2">
                                <Label htmlFor="address">
                                    Address <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                    placeholder="Enter complete address"
                                />
                            </div>

                            <div className="flex justify-end gap-3 py-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(route('branches.index'))}
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
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    )
}
