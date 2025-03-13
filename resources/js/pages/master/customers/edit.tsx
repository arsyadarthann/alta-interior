import React, { useState } from 'react';
import { Head, router, useForm, Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import Heading from "@/components/heading";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Trash2, ArrowLeft } from "lucide-react";
import { useToastNotification } from "@/hooks/use-toast-notification";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Interfaces
interface Item {
    id: number;
    name: string;
}

interface CustomerPrice {
    id?: number;
    item_id: number;
    price: string;
}

interface Customer {
    id: number;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
    customer_prices: CustomerPrice[];
}

interface EditProps {
    customer: Customer;
    items: Item[];
}

export default function Edit({ customer, items = [] }: EditProps) {
    const { showErrorToast } = useToastNotification();
    const [showSpecialPrices, setShowSpecialPrices] = useState(customer.customer_prices.length > 0);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Customers',
            href: route('customers.index'),
        },
        {
            title: customer.name,
            href: route('customers.edit', customer.id)
        }
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: customer.name,
        contact_name: customer.contact_name,
        email: customer.email || '',
        phone: customer.phone,
        address: customer.address,
        customer_prices: customer.customer_prices.map(price => ({
            id: price.id,
            item_id: price.item_id,
            price: price.price
        })),
    });

    const handleSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        put(route('customers.update', customer.id), {
            preserveScroll: true,
            onError: showErrorToast
        });
    }

    const addSpecialPrice = () => {
        setData('customer_prices', [
            ...data.customer_prices,
            { id: undefined, item_id: 0, price: '' }
        ]);
    }

    const removeSpecialPrice = (index: number) => {
        const updatedPrices = [...data.customer_prices];
        updatedPrices.splice(index, 1);
        setData('customer_prices', updatedPrices);
    }

    const updateSpecialPrice = (
        index: number,
        field: 'item_id' | 'price',
        value: string | number
    ) => {
        const updatedPrices = [...data.customer_prices];
        updatedPrices[index] = {
            ...updatedPrices[index],
            [field]: field === 'item_id' ? Number(value) : value
        };
        setData('customer_prices', updatedPrices);
    }

    // Get available items for a specific row index
    const getAvailableItems = (currentIndex: number) => {
        return items.filter(item => {
            // The item is either not selected anywhere or is selected in the current row
            return !data.customer_prices.some(
                (priceItem, i) => i !== currentIndex && priceItem.item_id === item.id
            );
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Customer - ${customer.name}`} />
            <div className="bg-white rounded-lg px-8 py-6">
                <div className="flex justify-between items-center mb-6">
                    <Heading
                        title={`Edit Customer: ${customer.name}`}
                        description="Update customer information and special pricing."
                    />
                    <div className="flex gap-3">
                        <Link href={route('customers.index')}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Customer Information Card - Fixed position */}
                        <div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
                            <Card className="border-0 shadow-sm h-full">
                                <div className="p-6">
                                    <h2 className="text-base font-semibold text-gray-900 mb-4">Customer Information</h2>
                                    <div className="space-y-4">
                                        <div className="space-y-2 relative grid gap-2">
                                            <Label htmlFor="name">
                                                Company Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                placeholder="Enter company name"
                                                className={`${errors.name ? "border-red-500 ring-red-100" : ""}`}
                                            />
                                            {errors.name && (
                                                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2 relative grid gap-2">
                                            <Label htmlFor="contact_name">
                                                Contact Person <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="contact_name"
                                                value={data.contact_name}
                                                onChange={e => setData('contact_name', e.target.value)}
                                                placeholder="Enter contact person name"
                                                className={`${errors.contact_name ? "border-red-500 ring-red-100" : ""}`}
                                            />
                                            {errors.contact_name && (
                                                <p className="text-xs text-red-500 mt-1">{errors.contact_name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2 relative grid gap-2">
                                            <Label htmlFor="email">
                                                Email Address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                placeholder="contact@company.com"
                                                className={`${errors.email ? "border-red-500 ring-red-100" : ""}`}
                                            />
                                            {errors.email && (
                                                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2 relative grid gap-2">
                                            <Label htmlFor="phone">
                                                Phone Number <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={data.phone}
                                                onChange={e => setData('phone', e.target.value)}
                                                placeholder="6281234567890"
                                                className={`${errors.phone ? "border-red-500 ring-red-100" : ""}`}
                                            />
                                            {errors.phone && (
                                                <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2 relative grid gap-2">
                                            <Label htmlFor="address">
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
                                            {errors.address && (
                                                <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="border-0 shadow-sm">
                                <div className="p-6">
                                    <div className="flex items-center mb-4">
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
                                            <Label htmlFor="show_special_prices">
                                                Set special prices for this customer
                                            </Label>
                                        </div>

                                        {showSpecialPrices ? (
                                            <div className="space-y-4">
                                                <p className="text-sm text-gray-500">
                                                    Add special pricing for specific items for this customer.
                                                </p>

                                                <div className="max-h-[calc(70vh-260px)] overflow-y-auto pr-2 pl-1">
                                                    {data.customer_prices.map((priceItem, index) => (
                                                        <div key={index} className="flex flex-wrap items-end gap-3 border-b border-gray-100 pb-4 mb-4">
                                                            <div className="flex-1 min-w-[200px] relative grid gap-2">
                                                                <Label htmlFor={`item_id_${index}`}>
                                                                    Item <span className="text-red-500">*</span>
                                                                </Label>
                                                                <Select
                                                                    value={priceItem.item_id ? String(priceItem.item_id) : ""}
                                                                    onValueChange={(value) => updateSpecialPrice(index, 'item_id', value)}
                                                                >
                                                                    <SelectTrigger
                                                                        id={`item_id_${index}`}
                                                                        className={`w-full ${(errors as Record<string, string>)[`customer_prices.${index}.item_id`] ? "border-red-500 ring-red-100" : ""}`}
                                                                    >
                                                                        <SelectValue placeholder="Select an item" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {getAvailableItems(index).map((item) => (
                                                                            <SelectItem key={item.id} value={String(item.id)}>
                                                                                {item.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                {(errors as Record<string, string>)[`customer_prices.${index}.item_id`] && (
                                                                    <p className="text-xs text-red-500 mt-1">{(errors as Record<string, string>)[`customer_prices.${index}.item_id`]}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-[200px] relative grid gap-2">
                                                                <Label htmlFor={`price_${index}`}>
                                                                    Special Price <span className="text-red-500">*</span>
                                                                </Label>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-muted-foreground">Rp</span>
                                                                    <Input
                                                                        id={`price_${index}`}
                                                                        type="number"
                                                                        value={priceItem.price}
                                                                        onChange={(e) => updateSpecialPrice(index, 'price', e.target.value)}
                                                                        placeholder="Enter price"
                                                                        className={`${(errors as Record<string, string>)[`customer_prices.${index}.price`] ? "border-red-500 ring-red-100" : ""}`}
                                                                    />
                                                                </div>
                                                                {(errors as Record<string, string>)[`customer_prices.${index}.price`] && (
                                                                    <p className="text-xs text-red-500 mt-1">{(errors as Record<string, string>)[`customer_prices.${index}.price`]}</p>
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

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addSpecialPrice}
                                                    className="mt-2"
                                                >
                                                    <PlusCircle className="h-4 w-4 mr-2" /> Add Special Price
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

                    <div className="flex justify-end gap-3 py-4 mt-6">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => router.visit(route('customers.index'))}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="px-8"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
