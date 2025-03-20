import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: route('customers.index'),
    },
    {
        title: 'Create',
        href: route('customers.create'),
    },
];

interface Item {
    id: number;
    name: string;
}

export default function Create({ items = [] }: { items?: Item[] }) {
    const { showErrorToast } = useToastNotification();
    const [showSpecialPrices, setShowSpecialPrices] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        customer_prices: [] as { item_id: number; price: string }[],
    });

    const handleSubmit = (e: { preventDefault: () => void }) => {
        e.preventDefault();

        post(route('customers.store'), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    const addSpecialPrice = () => {
        setData('customer_prices', [...data.customer_prices, { item_id: 0, price: '' }]);
    };

    const removeSpecialPrice = (index: number) => {
        const updatedPrices = [...data.customer_prices];
        updatedPrices.splice(index, 1);
        setData('customer_prices', updatedPrices);
    };

    const updateSpecialPrice = (index: number, field: 'item_id' | 'price', value: string | number) => {
        const updatedPrices = [...data.customer_prices];
        updatedPrices[index] = {
            ...updatedPrices[index],
            [field]: field === 'item_id' ? Number(value) : value,
        };
        setData('customer_prices', updatedPrices);
    };

    const getAvailableItems = (currentIndex: number) => {
        return items.filter((item) => {
            // The item is either not selected anywhere or is selected in the current row
            return !data.customer_prices.some((priceItem, i) => i !== currentIndex && priceItem.item_id === item.id);
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Customer" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Customer" description="Fill out the form below to add a new customer to the system." />
                    <div className="flex gap-3">
                        <Link href={route('customers.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:sticky lg:top-6 lg:col-span-1 lg:self-start">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Customer Information</h2>
                                    <div className="space-y-4">
                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="name">
                                                Company Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Enter company name"
                                                className={`${errors.name ? 'border-red-500 ring-red-100' : ''}`}
                                            />
                                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="contact_name">
                                                Contact Person <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="contact_name"
                                                value={data.contact_name}
                                                onChange={(e) => setData('contact_name', e.target.value)}
                                                placeholder="Enter contact person name"
                                                className={`${errors.contact_name ? 'border-red-500 ring-red-100' : ''}`}
                                            />
                                            {errors.contact_name && <p className="mt-1 text-xs text-red-500">{errors.contact_name}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="contact@company.com"
                                                className={`${errors.email ? 'border-red-500 ring-red-100' : ''}`}
                                            />
                                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="phone">
                                                Phone Number <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                placeholder="6281234567890"
                                                className={`${errors.phone ? 'border-red-500 ring-red-100' : ''}`}
                                            />
                                            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="address">
                                                Complete Address <span className="text-red-500">*</span>
                                            </Label>
                                            <Textarea
                                                id="address"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                placeholder="Enter complete address"
                                                rows={4}
                                                className={`${errors.address ? 'border-red-500 ring-red-100' : ''}`}
                                            />
                                            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="border-0 shadow-sm">
                                <div className="p-6">
                                    <div className="mb-4 flex items-center">
                                        <h2 className="text-base font-semibold text-gray-900">Special Pricing</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="show_special_prices"
                                                checked={showSpecialPrices}
                                                onCheckedChange={(checked) => {
                                                    setShowSpecialPrices(checked === true);
                                                    if (!checked) {
                                                        setData('customer_prices', []);
                                                    }
                                                }}
                                            />
                                            <Label htmlFor="show_special_prices">Set special prices for this customer</Label>
                                        </div>

                                        {showSpecialPrices ? (
                                            <div className="space-y-4">
                                                <p className="text-sm text-gray-500">Add special pricing for specific items for this customer.</p>

                                                <div className="max-h-[calc(70vh-260px)] overflow-y-auto pr-2 pl-1">
                                                    {data.customer_prices.map((priceItem, index) => (
                                                        <div
                                                            key={index}
                                                            className="mb-4 flex flex-wrap items-end gap-3 border-b border-gray-100 pb-4"
                                                        >
                                                            <div className="relative grid min-w-[200px] flex-1 gap-2">
                                                                <Label htmlFor={`item_id_${index}`}>
                                                                    Item <span className="text-red-500">*</span>
                                                                </Label>
                                                                <Combobox
                                                                    value={priceItem.item_id ? String(priceItem.item_id) : ''}
                                                                    onValueChange={(value) => updateSpecialPrice(index, 'item_id', value)}
                                                                    options={getAvailableItems(index).map((item) => ({
                                                                        value: String(item.id),
                                                                        label: item.name,
                                                                    }))}
                                                                    placeholder="Select an item"
                                                                    searchPlaceholder="Search items..."
                                                                    className={
                                                                        errors[`customer_prices.${index}.item_id` as keyof typeof errors]
                                                                            ? 'border-red-500 ring-red-100'
                                                                            : ''
                                                                    }
                                                                />
                                                                {errors[`customer_prices.${index}.item_id` as keyof typeof errors] && (
                                                                    <p className="mt-1 text-xs text-red-500">
                                                                        {errors[`customer_prices.${index}.item_id` as keyof typeof errors]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="relative grid min-w-[200px] flex-1 gap-2">
                                                                <Label htmlFor={`price_${index}`}>
                                                                    Special Price <span className="text-red-500">*</span>
                                                                </Label>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-muted-foreground text-sm">Rp</span>
                                                                    <Input
                                                                        id={`price_${index}`}
                                                                        type="number"
                                                                        value={priceItem.price}
                                                                        onChange={(e) => updateSpecialPrice(index, 'price', e.target.value)}
                                                                        placeholder="Enter price"
                                                                        className={`${errors[`customer_prices.${index}.price` as keyof typeof errors] ? 'border-red-500 ring-red-100' : ''}`}
                                                                    />
                                                                </div>
                                                                {errors[`customer_prices.${index}.price` as keyof typeof errors] && (
                                                                    <p className="mt-1 text-xs text-red-500">
                                                                        {errors[`customer_prices.${index}.price` as keyof typeof errors]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-end pb-[2px]">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeSpecialPrice(index)}
                                                                    className="h-9 w-9"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-gray-500" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <Button type="button" variant="outline" size="sm" onClick={addSpecialPrice} className="mt-2">
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Special Price
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center py-8 text-center text-gray-500">
                                                <p>Check the box above to set special pricing for this customer</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 py-4">
                        <Button variant="outline" type="button" onClick={() => router.visit(route('customers.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing} className="px-8">
                            {processing ? 'Creating...' : 'Create Customer'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
