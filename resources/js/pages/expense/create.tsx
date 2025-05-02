import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency, formatDate, formatDateToYmd } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarIcon, CheckCircle, Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Finance',
        href: '#',
    },
    {
        title: 'Expenses',
        href: route('expense.index'),
    },
    {
        title: 'Create',
        href: route('expense.create'),
    },
];

interface Props {
    transactionCode?: string;
    branches: {
        id: number;
        name: string;
    }[];
    warehouses: {
        id: number;
        name: string;
    }[];
}

export default function Create({ transactionCode = '', branches = [], warehouses = [] }: Props) {
    const { showErrorToast } = useToastNotification();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [addingItem, setAddingItem] = useState<boolean>(false);

    const { auth } = usePage().props as unknown as {
        auth: { user: { branch_id: number } };
    };

    // Get the default source value based on user's branch restriction
    const getDefaultSourceValue = () => {
        if (auth.user.branch_id) {
            return {
                id: auth.user.branch_id.toString(),
                type: 'App\\Models\\Branch',
            };
        }
        return {
            id: '',
            type: '',
        };
    };

    const defaultSource = getDefaultSourceValue();

    const { data, setData, post, processing, errors } = useForm({
        code: transactionCode,
        date: '',
        source_able_id: defaultSource.id,
        source_able_type: defaultSource.type,
        total_amount: 0,
        expense_details: [] as {
            name: string;
            amount: number;
        }[],
        new_item: {
            name: '',
            amount: 0,
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post(route('expense.store'), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    const addExpenseItem = () => {
        setAddingItem(true);
        setData('new_item', {
            name: '',
            amount: 0,
        });
    };

    const saveExpenseItem = () => {
        if (editingIndex !== null) {
            setEditingIndex(null);
        } else {
            setAddingItem(false);
            if (data.new_item.name && data.new_item.amount > 0) {
                const updatedDetails = [...data.expense_details, data.new_item];
                setData((prev) => ({
                    ...prev,
                    expense_details: updatedDetails,
                    total_amount: updatedDetails.reduce((sum, item) => sum + item.amount, 0),
                    new_item: {
                        name: '',
                        amount: 0,
                    },
                }));
            } else {
                showErrorToast(['Please fill in expense name and amount']);
            }
        }
    };

    const removeExpenseItem = (index: number) => {
        const updatedItems = [...data.expense_details];
        updatedItems.splice(index, 1);

        setData((prev) => ({
            ...prev,
            expense_details: updatedItems,
            total_amount: updatedItems.reduce((sum, item) => sum + item.amount, 0),
        }));
    };

    const updateExpenseItem = (index: number, field: 'name' | 'amount', value: string | number) => {
        const updatedItems = [...data.expense_details];

        if (field === 'amount') {
            let amount = Number(value);
            if (amount < 0) {
                amount = 0;
            }
            updatedItems[index] = {
                ...updatedItems[index],
                amount,
            };
        } else {
            updatedItems[index] = {
                ...updatedItems[index],
                [field]: field === 'name' ? String(value) : Number(value),
            };
        }

        setData((prev) => ({
            ...prev,
            expense_details: updatedItems,
            total_amount: updatedItems.reduce((sum, item) => sum + item.amount, 0),
        }));
    };

    // Handle source selection
    const handleSourceChange = (value: string) => {
        if (auth.user.branch_id) {
            // If user is branch-restricted, don't allow changing
            return;
        }

        const [type, id] = value.split(':');

        setData((prev) => ({
            ...prev,
            source_able_id: id,
            source_able_type: type,
        }));
    };

    // Format the current source value for the select component
    const getCurrentSourceValue = () => {
        if (data.source_able_id && data.source_able_type) {
            return `${data.source_able_type}:${data.source_able_id}`;
        }
        return 'placeholder'; // Use a non-empty placeholder value
    };

    const renderExpenseItemForm = (
        expenseItem: {
            name: string;
            amount: number;
        } | null = null,
        index: number = -1,
        isAddingNew: boolean = false,
    ) => {
        const item = expenseItem || data.new_item;

        return (
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md border bg-gray-50 p-4">
                <div className="relative grid min-w-[200px] flex-1 gap-2">
                    <Label htmlFor={`name_${index}`}>
                        Expense Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`name_${index}`}
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                            if (isAddingNew) {
                                setData('new_item', {
                                    ...data.new_item,
                                    name: e.target.value,
                                });
                            } else {
                                updateExpenseItem(index, 'name', e.target.value);
                            }
                        }}
                        placeholder="Example: Office Supplies"
                        className={
                            isAddingNew && errors[`new_item.name` as keyof typeof errors]
                                ? 'border-red-500 ring-red-100'
                                : !isAddingNew && errors[`expense_details.${index}.name` as keyof typeof errors]
                                  ? 'border-red-500 ring-red-100'
                                  : ''
                        }
                    />
                </div>
                <div className="relative grid min-w-[200px] flex-1 gap-2">
                    <Label htmlFor={`amount_${index}`}>
                        Amount <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id={`amount_${index}`}
                            type="number"
                            min="0"
                            value={item.amount === 0 ? '' : item.amount}
                            onChange={(e) => {
                                if (isAddingNew) {
                                    setData('new_item', {
                                        ...data.new_item,
                                        amount: Number(e.target.value),
                                    });
                                } else {
                                    updateExpenseItem(index, 'amount', e.target.value);
                                }
                            }}
                            placeholder="Expense amount"
                            className={`[appearance:textfield] pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                                isAddingNew && errors[`new_item.amount` as keyof typeof errors]
                                    ? 'border-red-500 ring-red-100'
                                    : !isAddingNew && errors[`expense_details.${index}.amount` as keyof typeof errors]
                                      ? 'border-red-500 ring-red-100'
                                      : ''
                            }`}
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">Rp</div>
                    </div>
                    {!isAddingNew && errors[`expense_details.${index}.amount` as keyof typeof errors] && (
                        <p className="mt-1 text-xs text-red-500">{errors[`expense_details.${index}.amount` as keyof typeof errors]}</p>
                    )}
                </div>
                <div className="flex items-end gap-2 pb-[2px]">
                    <Button type="button" variant="default" size="icon" onClick={saveExpenseItem} className="h-9 w-9 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 text-white" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderExpenseItemList = (
        expenseItem: {
            name: string;
            amount: number;
        },
        index: number,
    ) => {
        return (
            <div key={index} className="flex items-center justify-between border-b border-gray-100 py-3">
                <div className="flex-1">
                    <div className="mt-1 flex gap-4 text-sm text-gray-500">
                        <p className="font-medium text-gray-900">{expenseItem.name}</p>
                        <span className="font-medium text-gray-700">{formatCurrency(expenseItem.amount)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => setEditingIndex(index)} className="h-9 w-9">
                        <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeExpenseItem(index)} className="h-9 w-9">
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </div>
        );
    };

    // Find source name by ID and type
    const getSourceName = () => {
        if (data.source_able_type === 'App\\Models\\Branch') {
            const branch = branches.find((b) => b.id.toString() === data.source_able_id);
            return branch ? branch.name : 'Unknown Branch';
        } else if (data.source_able_type === 'App\\Models\\Warehouse') {
            const warehouse = warehouses.find((w) => w.id.toString() === data.source_able_id);
            return warehouse ? warehouse.name : 'Unknown Warehouse';
        }
        return 'Select location';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Expense" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Expense" description="Create a new expense record." />
                    <div className="flex gap-3">
                        <Link href={route('expense.index')}>
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
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Expense Information</h2>
                                    <div className="space-y-4">
                                        <div className="py-2">
                                            <div className="border-b border-gray-100 pb-2">
                                                {data.code ? (
                                                    <div className="flex items-center justify-between">
                                                        <span className="px-3 py-1.5 text-sm font-medium">
                                                            {data.code}
                                                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                                                Created
                                                            </span>
                                                        </span>
                                                        <input type="hidden" name="code" value={data.code} />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-block h-2 w-2 rounded-full bg-yellow-400"></span>
                                                        <span className="text-sm text-gray-600">Code will be generated automatically</span>
                                                    </div>
                                                )}
                                            </div>
                                            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="date">
                                                Date <span className="text-red-500">*</span>
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="date"
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal',
                                                            !data.date && 'text-muted-foreground',
                                                            errors.date && 'border-red-500 ring-red-100',
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {data.date ? formatDate(data.date) : <span>Select date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={data.date ? new Date(data.date) : undefined}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                setData('date', formatDateToYmd(date));
                                                            }
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="source">
                                                Location <span className="text-red-500">*</span>
                                            </Label>
                                            {auth.user.branch_id ? (
                                                <Input id="source" type="text" value={getSourceName()} readOnly className="bg-gray-50" />
                                            ) : (
                                                <Select value={getCurrentSourceValue()} onValueChange={handleSourceChange}>
                                                    <SelectTrigger
                                                        className={
                                                            errors.source_able_id || errors.source_able_type ? 'border-red-500 ring-red-100' : ''
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select location" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="placeholder" disabled>
                                                            Select location
                                                        </SelectItem>
                                                        {warehouses.map((warehouse) => (
                                                            <SelectItem
                                                                key={`warehouse-${warehouse.id}`}
                                                                value={`App\\Models\\Warehouse:${warehouse.id}`}
                                                            >
                                                                {warehouse.name}
                                                            </SelectItem>
                                                        ))}
                                                        {branches.map((branch) => (
                                                            <SelectItem key={`branch-${branch.id}`} value={`App\\Models\\Branch:${branch.id}`}>
                                                                {branch.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            {errors.source_able_id && <p className="mt-1 text-xs text-red-500">{errors.source_able_id}</p>}
                                            {errors.source_able_type && <p className="mt-1 text-xs text-red-500">{errors.source_able_type}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="total_amount">
                                                Total <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="total_amount"
                                                    type="text"
                                                    value={formatCurrency(data.total_amount)}
                                                    readOnly
                                                    className="bg-gray-50"
                                                />
                                            </div>
                                            {errors.total_amount && <p className="mt-1 text-xs text-red-500">{errors.total_amount}</p>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-gray-900">Expense Details</h2>
                                        <div className="flex items-center">
                                            <span className="mr-2 text-sm text-gray-500">{data.expense_details.length} items</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="max-h-[calc(70vh-260px)] overflow-y-auto pr-2 pl-1">
                                            {/* Render form when adding new item */}
                                            {addingItem && renderExpenseItemForm(null, -1, true)}

                                            {/* Render list or edit form for each item */}
                                            {data.expense_details.map((expenseItem, index) => (
                                                <div key={index}>
                                                    {editingIndex === index
                                                        ? renderExpenseItemForm(expenseItem, index)
                                                        : renderExpenseItemList(expenseItem, index)}
                                                </div>
                                            ))}
                                        </div>

                                        {data.expense_details.length === 0 && !addingItem && (
                                            <div className="flex items-center justify-center py-8 text-center text-gray-500">
                                                <p>No items yet. Click the button below to add expense details.</p>
                                            </div>
                                        )}

                                        {!addingItem && editingIndex === null && (
                                            <Button type="button" variant="outline" size="sm" onClick={addExpenseItem} className="mt-2">
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add Detail
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 py-4">
                        <Button variant="outline" type="button" onClick={() => router.visit(route('expense.index'))}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || data.expense_details.length === 0 || !data.source_able_id || !data.source_able_type}
                            className="px-8"
                        >
                            {processing ? 'Creating...' : 'Create Expense'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
