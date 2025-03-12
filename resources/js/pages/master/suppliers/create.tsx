import React from 'react';
import {Head, router, useForm} from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import Heading from "@/components/heading";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {useToastNotification} from "@/hooks/use-toast-notification";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Suppliers',
        href: route('suppliers.index'),
    },
    {
        title: 'Create',
        href: route('suppliers.create')
    }
];

export default function Create() {
    const { showErrorToast } = useToastNotification()
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
    });

    const handleSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        post(route('suppliers.store'), {
            preserveScroll: true,
            onError: showErrorToast
        })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create" />
            <div className="bg-white rounded-lg px-8 py-6">
                <Heading title="Create Supplier" description="Fill out the form below to add a new supplier to the system." />
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <h3 className="text-sm font-medium text-gray-500">COMPANY DETAILS</h3>
                            <div className="h-px bg-gray-100" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative grid gap-2">
                                <Label htmlFor="name" className="mb-1.5 block">
                                    Company Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Enter company name"
                                    className={`${errors.name ? "border-red-500 ring-red-100" : ""}`}
                                />
                            </div>

                            <div className="relative grid gap-2">
                                <Label htmlFor="contact_name" className="mb-1.5 block">
                                    Contact Person <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="contact_name"
                                    value={data.contact_name}
                                    onChange={e => setData('contact_name', e.target.value)}
                                    placeholder="Enter contact person name"
                                    className={`${errors.contact_name ? "border-red-500 ring-red-100" : ""}`}
                                />
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-1.5 pt-2">
                            <h3 className="text-sm font-medium text-gray-500">CONTACT INFORMATION</h3>
                            <div className="h-px bg-gray-100" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative grid gap-2">
                                <Label htmlFor="email" className="mb-1.5 block">
                                    Email Address <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="contact@company.com"
                                    className={`${errors.email ? "border-red-500 ring-red-100" : ""}`}
                                />
                            </div>

                            <div className="relative grid gap-2">
                                <Label htmlFor="phone" className="mb-1.5 block">
                                    Phone Number <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phone"
                                    type="phone"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    placeholder="6281234567890"
                                    className={`${errors.phone ? "border-red-500 ring-red-100" : ""}`}
                                />
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="space-y-1.5 pt-2">
                            <h3 className="text-sm font-medium text-gray-500">ADDRESS</h3>
                            <div className="h-px bg-gray-100" />
                        </div>

                        <div className="relative grid gap-2">
                            <Label htmlFor="address" className="mb-1.5 block">
                                Complete Address <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="address"
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
                                placeholder="Enter complete address"
                                rows={4}
                                className={`${errors.address ? "border-red-500 ring-red-100" : ""}`}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 py-4">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => router.visit(route('suppliers.index'))}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="px-8"
                        >
                            {processing ? 'Creating...' : 'Create Supplier'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
