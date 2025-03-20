import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, CheckCircle, Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stock',
        href: '#',
    },
    {
        title: 'Audit',
        href: route('stock.audit.index'),
    },
    {
        title: 'Create',
        href: route('stock.audit.create'),
    },
];

type ItemCategory = {
    id: number;
    name: string;
};

type ItemUnit = {
    id: number;
    name: string;
    abbreviation: string;
};

type Branch = {
    id: number;
    name: string;
};

type Warehouse = {
    id: number;
    name: string;
};

type Item = {
    id: number;
    name: string;
    code: string;
    item_category_id: number;
    item_unit_id: number;
    price: number;
    item_category?: ItemCategory;
    item_unit?: ItemUnit;
    stock?: number;
};

export default function Create({ branches = [], warehouses = [] }: { branches?: Branch[]; warehouses?: Warehouse[] }) {
    const { showErrorToast } = useToastNotification();
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItemNames, setSelectedItemNames] = useState<Record<number, string>>({});
    const [selectedItemUnits, setSelectedItemUnits] = useState<Record<number, string>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [addingItem, setAddingItem] = useState<boolean>(false);
    const { auth } = usePage().props as unknown as { auth: { user: { branch_id: number } } };
    const [initialized, setInitialized] = useState(false);

    // Add refs to track if a fetch is in progress
    const isFetchingItems = useRef(false);
    const isFetchingCode = useRef(false);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        date: new Date(),
        source_able_type: '',
        source_able_id: '',
        stock_audit_details: [] as {
            item_id: number;
            system_quantity: number;
            physical_quantity: number;
            discrepancy_quantity: number;
            reason: string;
        }[],
        new_item: {
            item_id: 0,
            system_quantity: 0,
            physical_quantity: 0,
            discrepancy_quantity: 0,
            reason: '',
        },
    });

    useEffect(() => {
        if (!initialized) {
            if (auth?.user?.branch_id) {
                const userBranchId = auth.user.branch_id.toString();
                setData('source_able_type', 'branch');
                setData('source_able_id', userBranchId);
            }
            setInitialized(true);
        }
    }, [initialized, auth?.user?.branch_id, setData]);

    const fetchItems = useCallback(
        (sourceType: string, sourceId: string) => {
            // Guard against multiple concurrent fetches
            if (isFetchingItems.current) return;

            isFetchingItems.current = true;
            const routeName = sourceType === 'branch' ? 'item.getItemByBranch' : 'item.getItemByWarehouse';

            fetch(route(routeName, sourceId), {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then((responseData) => {
                    let itemsData = [];

                    if (Array.isArray(responseData)) {
                        itemsData = responseData;
                    } else if (responseData && responseData.items && Array.isArray(responseData.items)) {
                        itemsData = responseData.items;
                    } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
                        itemsData = responseData.data;
                    } else {
                        itemsData = [];
                    }

                    setItems(itemsData);
                    setData('stock_audit_details', []);
                    setSelectedItemNames({});
                    setSelectedItemUnits({});
                })
                .catch((error) => {
                    showErrorToast([error.message]);
                })
                .finally(() => {
                    isFetchingItems.current = false;
                });
        },
        [setItems, setData, setSelectedItemNames, setSelectedItemUnits, showErrorToast],
    );

    const fetchAuditCode = useCallback(
        (sourceType: string, sourceId: string) => {
            if (isFetchingCode.current) return;

            isFetchingCode.current = true;
            fetch(
                route('stock.audit.getCode', {
                    source_able_type: sourceType,
                    source_able_id: sourceId,
                }),
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            )
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then((responseData) => {
                    if (responseData && responseData.code) {
                        setData('code', responseData.code);
                    }
                })
                .catch(() => {
                    showErrorToast(['Failed to get audit code']);
                })
                .finally(() => {
                    isFetchingCode.current = false;
                });
        },
        [setData, showErrorToast],
    );

    // Modified useEffect to prevent infinite loops
    useEffect(() => {
        if (initialized && data.source_able_type && data.source_able_id) {
            fetchItems(data.source_able_type, data.source_able_id);
            fetchAuditCode(data.source_able_type, data.source_able_id);
        }
        // Important: only run this effect when either initialized changes OR source changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialized, data.source_able_type + data.source_able_id]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        post(route('stock.audit.store'), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    const addAuditItem = () => {
        setAddingItem(true);
        setData('new_item', {
            item_id: 0,
            system_quantity: 0,
            physical_quantity: 0,
            discrepancy_quantity: 0,
            reason: '',
        });
    };

    const saveAuditItem = () => {
        if (editingIndex !== null) {
            setEditingIndex(null);
        } else {
            setAddingItem(false);
            if (data.new_item.item_id !== 0) {
                setData('stock_audit_details', [...data.stock_audit_details, data.new_item]);
                setData('new_item', {
                    item_id: 0,
                    system_quantity: 0,
                    physical_quantity: 0,
                    discrepancy_quantity: 0,
                    reason: '',
                });
            } else {
                showErrorToast(['Please select an item']);
            }
        }
    };

    const removeAuditItem = (index: number) => {
        const updatedItems = [...data.stock_audit_details];

        const newSelectedItemNames = { ...selectedItemNames };
        const newSelectedItemUnits = { ...selectedItemUnits };
        delete newSelectedItemNames[index];
        delete newSelectedItemUnits[index];

        updatedItems.splice(index, 1);
        setData('stock_audit_details', updatedItems);

        const updatedSelectedItemNames: Record<number, string> = {};
        const updatedSelectedItemUnits: Record<number, string> = {};

        Object.keys(newSelectedItemNames).forEach((key) => {
            const keyNum = parseInt(key, 10);
            if (keyNum > index) {
                updatedSelectedItemNames[keyNum - 1] = newSelectedItemNames[keyNum];
                updatedSelectedItemUnits[keyNum - 1] = newSelectedItemUnits[keyNum];
            } else {
                updatedSelectedItemNames[keyNum] = newSelectedItemNames[keyNum];
                updatedSelectedItemUnits[keyNum] = newSelectedItemUnits[keyNum];
            }
        });

        setSelectedItemNames(updatedSelectedItemNames);
        setSelectedItemUnits(updatedSelectedItemUnits);
    };

    const updateAuditItem = (
        index: number,
        field: 'item_id' | 'system_quantity' | 'physical_quantity' | 'discrepancy_quantity' | 'reason',
        value: string | number,
    ) => {
        const updatedItems = [...data.stock_audit_details];

        if (field === 'item_id') {
            const itemId = Number(value);
            const selectedItem = items.find((itm) => itm.id === itemId);

            if (selectedItem) {
                const newSelectedItemNames = { ...selectedItemNames };
                newSelectedItemNames[index] = `${selectedItem.name} (${selectedItem.code})`;
                setSelectedItemNames(newSelectedItemNames);

                const newSelectedItemUnits = { ...selectedItemUnits };
                newSelectedItemUnits[index] = selectedItem.item_unit?.abbreviation || '';
                setSelectedItemUnits(newSelectedItemUnits);

                const itemStock = selectedItem.stock ?? 0;
                updatedItems[index] = {
                    ...updatedItems[index],
                    item_id: itemId,
                    system_quantity: itemStock,
                    physical_quantity: 0,
                    discrepancy_quantity: 0 - itemStock,
                };
            }
        } else if (field === 'physical_quantity') {
            let physicalQty = Number(value);
            if (physicalQty < 0) {
                physicalQty = 0;
            }

            const systemQty = updatedItems[index].system_quantity;
            updatedItems[index] = {
                ...updatedItems[index],
                physical_quantity: physicalQty,
                discrepancy_quantity: physicalQty - systemQty,
            };
        } else if (field === 'system_quantity') {
            let systemQty = Number(value);
            if (systemQty < 0) {
                systemQty = 0;
            }

            const physicalQty = updatedItems[index].physical_quantity;
            updatedItems[index] = {
                ...updatedItems[index],
                system_quantity: systemQty,
                discrepancy_quantity: physicalQty - systemQty,
            };
        } else {
            updatedItems[index] = {
                ...updatedItems[index],
                [field]: field === 'reason' ? String(value) : Number(value),
            };
        }

        setData('stock_audit_details', updatedItems);
    };

    const getAvailableItems = (currentIndex: number) => {
        return items.filter((item) => {
            return !data.stock_audit_details.some((auditItem, i) => i !== currentIndex && auditItem.item_id === item.id);
        });
    };

    const renderAuditItemForm = (
        auditItem: {
            item_id: number;
            system_quantity: number;
            physical_quantity: number;
            discrepancy_quantity: number;
            reason: string;
        } | null = null,
        index: number = -1,
        isAddingNew: boolean = false,
    ) => {
        const item = auditItem || data.new_item;
        const selectedItemId = isAddingNew ? data.new_item.item_id : item.item_id;

        return (
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md border bg-gray-50 p-4">
                <div className="relative grid min-w-[200px] flex-1 gap-2">
                    <Label htmlFor={`item_id_${index}`}>
                        Item <span className="text-red-500">*</span>
                    </Label>
                    <Combobox
                        value={selectedItemId ? String(selectedItemId) : ''}
                        onValueChange={(value) => {
                            if (isAddingNew) {
                                const itemId = Number(value);
                                const selectedItem = items.find((itm) => itm.id === itemId);

                                if (selectedItem) {
                                    const tempItem = {
                                        item_id: itemId,
                                        system_quantity: selectedItem.stock ?? 0,
                                        physical_quantity: 0,
                                        discrepancy_quantity: -(selectedItem.stock ?? 0),
                                        reason: '',
                                    };

                                    const newSelectedItemNames = { ...selectedItemNames };
                                    newSelectedItemNames[data.stock_audit_details.length] = `${selectedItem.name} (${selectedItem.code})`;
                                    setSelectedItemNames(newSelectedItemNames);

                                    const newSelectedItemUnits = { ...selectedItemUnits };
                                    newSelectedItemUnits[data.stock_audit_details.length] = selectedItem.item_unit?.abbreviation || '';
                                    setSelectedItemUnits(newSelectedItemUnits);

                                    setData('new_item', tempItem);
                                }
                            } else {
                                updateAuditItem(index, 'item_id', value);
                            }
                        }}
                        options={getAvailableItems(isAddingNew ? -1 : index).map((itm) => ({
                            value: String(itm.id),
                            label: `${itm.name} (${itm.code})`,
                        }))}
                        placeholder="Select an item"
                        searchPlaceholder="Search items..."
                        initialDisplayCount={5}
                        className={
                            isAddingNew && errors[`new_item.item_id` as keyof typeof errors]
                                ? 'border-red-500 ring-red-100'
                                : !isAddingNew && errors[`stock_audit_details.${index}.item_id` as keyof typeof errors]
                                  ? 'border-red-500 ring-red-100'
                                  : ''
                        }
                    />
                </div>
                <div className="relative grid min-w-[140px] flex-1 gap-2">
                    <Label htmlFor={`system_quantity_${index}`}>System Quantity</Label>
                    <div className="relative">
                        <Input
                            id={`system_quantity_${index}`}
                            type="number"
                            value={
                                item.system_quantity === 0
                                    ? 0
                                    : item.system_quantity % 1 === 0
                                      ? Math.abs(Number(item.system_quantity))
                                      : Number(item.system_quantity.toFixed(2))
                            }
                            readOnly
                            className="bg-gray-50 pr-10"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                            {isAddingNew ? selectedItemUnits[data.stock_audit_details.length] || '' : selectedItemUnits[index] || ''}
                        </div>
                    </div>
                </div>
                <div className="relative grid min-w-[140px] flex-1 gap-2">
                    <Label htmlFor={`physical_quantity_${index}`}>
                        Physical Quantity <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Input
                            id={`physical_quantity_${index}`}
                            type="number"
                            min="0"
                            value={item.physical_quantity === 0 ? '' : item.physical_quantity}
                            onChange={(e) => {
                                if (isAddingNew) {
                                    const physicalQty = Number(e.target.value);
                                    const systemQty = data.new_item?.system_quantity || 0;
                                    setData('new_item', {
                                        ...data.new_item,
                                        physical_quantity: physicalQty,
                                        discrepancy_quantity: physicalQty - systemQty,
                                    });
                                } else {
                                    updateAuditItem(index, 'physical_quantity', e.target.value);
                                }
                            }}
                            placeholder="Count result"
                            className={`[appearance:textfield] pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                                isAddingNew && errors[`new_item.physical_quantity` as keyof typeof errors]
                                    ? 'border-red-500 ring-red-100'
                                    : !isAddingNew && errors[`stock_audit_details.${index}.physical_quantity` as keyof typeof errors]
                                      ? 'border-red-500 ring-red-100'
                                      : ''
                            }`}
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                            {isAddingNew ? selectedItemUnits[data.stock_audit_details.length] || '' : selectedItemUnits[index] || ''}
                        </div>
                    </div>
                    {!isAddingNew && errors[`stock_audit_details.${index}.physical_quantity` as keyof typeof errors] && (
                        <p className="mt-1 text-xs text-red-500">{errors[`stock_audit_details.${index}.physical_quantity` as keyof typeof errors]}</p>
                    )}
                </div>
                <div className="relative grid min-w-[140px] flex-1 gap-2">
                    <Label htmlFor={`discrepancy_quantity_${index}`}>Discrepancy</Label>
                    <div className="relative">
                        <Input
                            id={`discrepancy_quantity_${index}`}
                            type="number"
                            value={
                                item.discrepancy_quantity === 0
                                    ? 0
                                    : item.discrepancy_quantity < 0
                                      ? Math.abs(Number(item.discrepancy_quantity.toFixed(2)))
                                      : Number(item.discrepancy_quantity.toFixed(2))
                            }
                            readOnly
                            className={`bg-gray-50 pr-10 ${
                                item.discrepancy_quantity < 0 ? 'text-red-600' : item.discrepancy_quantity > 0 ? 'text-green-600' : ''
                            }`}
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                            {isAddingNew ? selectedItemUnits[data.stock_audit_details.length] || '' : selectedItemUnits[index] || ''}
                        </div>
                    </div>
                </div>
                <div className="relative grid min-w-[200px] flex-1 gap-2">
                    <Label htmlFor={`reason_${index}`}>Reason</Label>
                    <Input
                        id={`reason_${index}`}
                        type="text"
                        value={item.reason}
                        onChange={(e) => {
                            if (isAddingNew) {
                                setData('new_item', {
                                    ...data.new_item,
                                    reason: e.target.value,
                                });
                            } else {
                                updateAuditItem(index, 'reason', e.target.value);
                            }
                        }}
                        placeholder="Explain discrepancy"
                        className={`${
                            isAddingNew && errors['new_item.reason' as keyof typeof errors]
                                ? 'border-red-500 ring-red-100'
                                : !isAddingNew && errors[`stock_audit_details.${index}.reason` as keyof typeof errors]
                                  ? 'border-red-500 ring-red-100'
                                  : ''
                        }`}
                    />
                </div>
                <div className="flex items-end gap-2 pb-[2px]">
                    <Button type="button" variant="default" size="icon" onClick={saveAuditItem} className="h-9 w-9 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 text-white" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderAuditItemList = (
        auditItem: {
            item_id: number;
            system_quantity: number;
            physical_quantity: number;
            discrepancy_quantity: number;
            reason: string;
        },
        index: number,
    ) => {
        const selectedItem = items.find((itm) => itm.id === auditItem.item_id);
        const itemName = selectedItemNames[index] || (selectedItem ? `${selectedItem.name} (${selectedItem.code})` : 'Unknown Item');
        const itemUnit = selectedItemUnits[index] || selectedItem?.item_unit?.abbreviation || '';

        return (
            <div key={index} className="flex items-center justify-between border-b border-gray-100 py-3">
                <div className="flex-1">
                    <div className="mt-1 flex gap-4 text-sm text-gray-500">
                        <p className="font-medium text-gray-900">{itemName}</p>
                        <span>
                            System:{' '}
                            {auditItem.system_quantity === 0
                                ? 0
                                : auditItem.system_quantity % 1 === 0
                                  ? Math.abs(Number(auditItem.system_quantity))
                                  : Number(auditItem.system_quantity.toFixed(2))}{' '}
                            {itemUnit}
                        </span>
                        <span>
                            Physical: {auditItem.physical_quantity} {itemUnit}
                        </span>
                        <span
                            className={`${
                                auditItem.discrepancy_quantity < 0 ? 'text-red-600' : auditItem.discrepancy_quantity > 0 ? 'text-green-600' : ''
                            }`}
                        >
                            Discrepancy: {auditItem.discrepancy_quantity < 0 ? '-' : '+'}
                            {auditItem.discrepancy_quantity === 0
                                ? 0
                                : auditItem.discrepancy_quantity % 1 === 0
                                  ? Math.abs(Number(auditItem.discrepancy_quantity))
                                  : Number(auditItem.discrepancy_quantity.toFixed(2))}{' '}
                            {itemUnit}
                        </span>
                        {auditItem.reason && <span>Reason: {auditItem.reason}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => setEditingIndex(index)} className="h-9 w-9">
                        <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAuditItem(index)} className="h-9 w-9">
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Stock Audit" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Stock Audit" description="Create a new stock audit to verify inventory levels." />
                    <div className="flex gap-3">
                        <Link href={route('stock.audit.index')}>
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
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Audit Information</h2>
                                    <div className="space-y-4">
                                        <div className="py-2">
                                            <div className="border-b border-gray-100 pb-2">
                                                {data.code ? (
                                                    <div className="flex items-center justify-between">
                                                        <span className="px-3 py-1.5 text-sm font-medium">
                                                            {data.code}
                                                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                                                Generated
                                                            </span>
                                                        </span>
                                                        <input type="hidden" name="code" value={data.code} />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-block h-2 w-2 rounded-full bg-yellow-400"></span>
                                                        <span className="text-sm text-gray-600">Code will be generated after selecting a source</span>
                                                    </div>
                                                )}
                                            </div>
                                            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="source">
                                                Audit Source <span className="text-red-500">*</span>
                                            </Label>
                                            <Combobox
                                                value={
                                                    data.source_able_id && data.source_able_type
                                                        ? `${data.source_able_type}-${data.source_able_id}`
                                                        : ''
                                                }
                                                onValueChange={(value) => {
                                                    const [type, id] = value.split('-');
                                                    setData((prev) => ({
                                                        ...prev,
                                                        source_able_type: type,
                                                        source_able_id: id,
                                                        stock_audit_details: [],
                                                    }));
                                                }}
                                                options={
                                                    !auth?.user?.branch_id
                                                        ? [
                                                              ...warehouses.map((warehouse) => ({
                                                                  value: `warehouse-${warehouse.id}`,
                                                                  label: warehouse.name,
                                                              })),
                                                              ...branches.map((branch) => ({
                                                                  value: `branch-${branch.id}`,
                                                                  label: branch.name,
                                                              })),
                                                          ]
                                                        : branches
                                                              .filter((branch) => branch.id === auth.user.branch_id)
                                                              .map((branch) => ({
                                                                  value: `branch-${branch.id}`,
                                                                  label: branch.name,
                                                              }))
                                                }
                                                placeholder="Select audit source"
                                                searchPlaceholder="Search sources..."
                                                initialDisplayCount={5} // Menampilkan 5 item pertama
                                                disabled={!!auth?.user?.branch_id}
                                                className={errors.source_able_id || errors.source_able_type ? 'border-red-500' : ''}
                                            />
                                            {(errors.source_able_id || errors.source_able_type) && (
                                                <p className="text-sm text-red-500">{errors.source_able_id || errors.source_able_type}</p>
                                            )}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="date">
                                                Audit Date <span className="text-red-500">*</span>
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
                                                        {data.date ? format(data.date, 'PPP') : <span>Select date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={data.date}
                                                        onSelect={(date) => date && setData('date', date)}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-gray-900">Audit Items</h2>
                                        <div className="flex items-center">
                                            <span className="mr-2 text-sm text-gray-500">{data.stock_audit_details.length} items</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="max-h-[calc(70vh-260px)] overflow-y-auto pr-2 pl-1">
                                            {/* Render form when adding new item */}
                                            {addingItem && renderAuditItemForm(null, -1, true)}

                                            {/* Render list or edit form for each item */}
                                            {data.stock_audit_details.map((auditItem, index) => (
                                                <div key={index}>
                                                    {editingIndex === index
                                                        ? renderAuditItemForm(auditItem, index)
                                                        : renderAuditItemList(auditItem, index)}
                                                </div>
                                            ))}
                                        </div>

                                        {data.stock_audit_details.length === 0 && !addingItem && (
                                            <div className="flex items-center justify-center py-8 text-center text-gray-500">
                                                <p>No items added yet. Click the button below to add items to audit.</p>
                                            </div>
                                        )}

                                        {!addingItem && editingIndex === null && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addAuditItem}
                                                className="mt-2"
                                                disabled={!data.source_able_id || !items.length}
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Add Item
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 py-4">
                        <Button variant="outline" type="button" onClick={() => router.visit(route('stock.audit.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || data.stock_audit_details.length === 0} className="px-8">
                            {processing ? 'Creating...' : 'Create Audit'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
