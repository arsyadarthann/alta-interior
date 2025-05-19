import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';

interface Props {
    supplier: {
        id: number;
        name: string;
        contact_name: string;
        email: string;
        phone: string;
        address: string;
    };
}

export default function Edit({ supplier }: Props) {
    const { showErrorToast } = useToastNotification();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Suppliers',
            href: route('suppliers.index'),
        },
        {
            title: 'Edit',
            href: route('suppliers.edit', supplier.id),
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: supplier.name,
        contact_name: supplier.contact_name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
    });

    const handleSubmit = (e: { preventDefault: () => void }) => {
        e.preventDefault();

        put(route('suppliers.update', supplier.id), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Supplier" />
            <div className="rounded-lg bg-white px-8 py-6">
                <Heading title="Edit Supplier" description="Update supplier information using the form below." />
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <h3 className="text-sm font-medium text-gray-500">COMPANY DETAILS</h3>
                            <div className="h-px bg-gray-100" />
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Label htmlFor="name" className="mb-1.5 block">
                                    Company Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter company name"
                                    className={`${errors.name ? 'border-red-500 ring-red-100' : ''}`}
                                />
                            </div>

                            <div className="relative">
                                <Label htmlFor="contact_name" className="mb-1.5 block">
                                    Contact Person <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="contact_name"
                                    value={data.contact_name}
                                    onChange={(e) => setData('contact_name', e.target.value)}
                                    placeholder="Enter contact person name"
                                    className={`${errors.contact_name ? 'border-red-500 ring-red-100' : ''}`}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <h3 className="text-sm font-medium text-gray-500">CONTACT INFORMATION</h3>
                            <div className="h-px bg-gray-100" />
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="relative">
                                <Label htmlFor="email" className="mb-1.5 block">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="contact@company.com"
                                    className={`${errors.email ? 'border-red-500 ring-red-100' : ''}`}
                                />
                            </div>

                            <div className="relative">
                                <Label htmlFor="phone" className="mb-1.5 block">
                                    Phone Number <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                    className={`${errors.phone ? 'border-red-500 ring-red-100' : ''}`}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <h3 className="text-sm font-medium text-gray-500">ADDRESS</h3>
                            <div className="h-px bg-gray-100" />
                        </div>

                        <div className="relative">
                            <Label htmlFor="address" className="mb-1.5 block">
                                Complete Address
                            </Label>
                            <Textarea
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Enter complete address"
                                rows={4}
                                className={`${errors.address ? 'border-red-500 ring-red-100' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 py-4">
                        <Button variant="outline" type="button" onClick={() => router.visit(route('suppliers.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing} className="px-8">
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
