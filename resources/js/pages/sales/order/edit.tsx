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
import { cn, formatCurrency, formatDecimal } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, CheckCircle, Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: '#',
    },
    {
        title: 'Orders',
        href: route('sales.order.index'),
    },
    {
        title: 'Edit',
        href: '#',
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

type Customer = {
    id: number;
    name: string;
};

type TaxRate = {
    id: number;
    rate: number;
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

export default function EditSalesOrder({
    salesOrder,
    branches = [],
    warehouses = [],
    customers = [],
    taxRates = [],
}: {
    salesOrder: any;
    branches?: Branch[];
    warehouses?: Warehouse[];
    customers?: Customer[];
    taxRates?: TaxRate[];
}) {
    const { showErrorToast } = useToastNotification();
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItemNames, setSelectedItemNames] = useState<Record<number, string>>({});
    const [selectedItemUnits, setSelectedItemUnits] = useState<Record<number, string>>({});
    const [availableStocks, setAvailableStocks] = useState<Record<number, number>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [addingItem, setAddingItem] = useState<boolean>(false);
    const [initialized, setInitialized] = useState(false);
    const [selectedCustomerPrices, setSelectedCustomerPrices] = useState<Record<number, number>>({});

    const [, setFormState] = useState({
        selectedItem: null as Item | null,
        selectedLocation: null as { type: string; id: number } | null,
        availableStock: 0,
    });

    const isFetchingItems = useRef(false);
    const isFetchingCustomerPrices = useRef(false);

    // Pada bagian inisialisasi form
    const { data, setData, put, processing, errors } = useForm({
        id: salesOrder.id,
        code: salesOrder.code || '',
        date: salesOrder.date ? new Date(salesOrder.date) : new Date(),
        customer_id: salesOrder.customer_id || null,
        customer_name: salesOrder.customer_name || '',
        total_amount: salesOrder.total_amount || 0,
        tax_rate_id: salesOrder.tax_rate_id || null,
        tax_amount: salesOrder.tax_amount || 0,
        grand_total: salesOrder.grand_total || 0,
        branch_id: salesOrder.branch_id || null,
        sales_order_details: (salesOrder.sales_order_details || []).map((detail: any) => {
            let sourceType = detail.item_source_able_type;
            if (sourceType.includes('\\Warehouse')) {
                sourceType = 'warehouse';
            } else if (sourceType.includes('\\Branch')) {
                sourceType = 'branch';
            }

            return {
                id: detail.id,
                item_id: detail.item_id,
                item_source_able_id: detail.item_source_able_id,
                item_source_able_type: sourceType,
                quantity: detail.quantity,
                unit_price: detail.unit_price,
                total_price: detail.total_price,
            };
        }),
        new_item: {
            item_id: 0,
            item_source_able_id: 0,
            item_source_able_type: '',
            quantity: 0,
            unit_price: 0,
            total_price: 0,
            available_stock: 0,
        },
    });

    useEffect(() => {
        if (!initialized) {
            if (salesOrder.sales_order_details && salesOrder.sales_order_details.length > 0) {
                const itemNames: Record<number, string> = {};
                const itemUnits: Record<number, string> = {};

                salesOrder.sales_order_details.forEach((detail: any, index: number) => {
                    if (detail.item) {
                        itemNames[index] = `${detail.item.name} (${detail.item.code})`;
                        itemUnits[index] = detail.item.item_unit?.abbreviation || '';
                    }
                });

                setSelectedItemNames(itemNames);
                setSelectedItemUnits(itemUnits);
            }

            if (salesOrder.customer_id) {
                fetchCustomerPrices(salesOrder.customer_id);
            }

            setInitialized(true);
        }
    }, [initialized, salesOrder]);

    const fetchItems = useCallback(() => {
        if (isFetchingItems.current) return;

        isFetchingItems.current = true;

        fetch(route('item.getAllOnlyItems'), {
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
            })
            .catch((error) => {
                showErrorToast([error.message]);
            })
            .finally(() => {
                isFetchingItems.current = false;
            });
    }, []);

    const fetchCustomerPrices = useCallback(
        (customerId: number) => {
            if (isFetchingCustomerPrices.current) return;

            isFetchingCustomerPrices.current = true;
            fetch(
                route('customers.getPrices', {
                    customer_id: customerId,
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
                    const priceMap: Record<number, number> = {};

                    if (responseData && Array.isArray(responseData)) {
                        responseData.forEach((price: any) => {
                            priceMap[price.item_id] = price.price;
                        });
                    }

                    setSelectedCustomerPrices(priceMap);

                    if (Object.keys(priceMap).length > 0 && data.sales_order_details.length > 0) {
                        const updatedDetails = data.sales_order_details.map((detail) => {
                            if (priceMap[detail.item_id]) {
                                const newUnitPrice = priceMap[detail.item_id];
                                return {
                                    ...detail,
                                    unit_price: newUnitPrice,
                                    total_price: newUnitPrice * detail.quantity,
                                };
                            }
                            return detail;
                        });

                        setData('sales_order_details', updatedDetails);
                        calculateTotals(updatedDetails);
                    }
                })
                .catch((error) => {
                    showErrorToast(['Failed to get customer prices']);
                    console.error(error);
                })
                .finally(() => {
                    isFetchingCustomerPrices.current = false;
                });
        },
        [setData, data.sales_order_details, showErrorToast],
    );

    useEffect(() => {
        if (initialized && !items.length) {
            fetchItems();
        }
    }, [initialized, items.length, fetchItems]);

    useEffect(() => {
        calculateTotals(data.sales_order_details);
    }, [data.sales_order_details, data.tax_rate_id]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        put(route('sales.order.update', salesOrder.id), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    const calculateTotals = (details: typeof data.sales_order_details) => {
        const totalAmount = details.reduce((sum, item) => sum + item.total_price, 0);

        let taxAmount = 0;
        if (data.tax_rate_id) {
            const selectedTaxRate = taxRates.find((tax) => tax.id === data.tax_rate_id);
            if (selectedTaxRate) {
                taxAmount = totalAmount * (selectedTaxRate.rate / 100);
            }
        }

        const grandTotal = totalAmount + taxAmount;

        setData((prev) => ({
            ...prev,
            total_amount: totalAmount,
            tax_amount: taxAmount,
            grand_total: grandTotal,
        }));
    };

    const addOrderItem = () => {
        setAddingItem(true);
        setFormState({
            selectedItem: null,
            selectedLocation: null,
            availableStock: 0,
        });
        setData('new_item', {
            item_id: 0,
            item_source_able_id: 0,
            item_source_able_type: '',
            quantity: 0,
            unit_price: 0,
            total_price: 0,
            available_stock: 0,
        });
    };

    const saveOrderItem = () => {
        if (editingIndex !== null) {
            setEditingIndex(null);
        } else {
            setAddingItem(false);
            if (data.new_item.item_id !== 0 && data.new_item.item_source_able_id !== 0) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { available_stock, ...newItemData } = data.new_item;
                setData('sales_order_details', [...data.sales_order_details, newItemData]);

                setFormState({
                    selectedItem: null,
                    selectedLocation: null,
                    availableStock: 0,
                });

                setData('new_item', {
                    item_id: 0,
                    item_source_able_id: 0,
                    item_source_able_type: '',
                    quantity: 0,
                    unit_price: 0,
                    total_price: 0,
                    available_stock: 0,
                });
            } else {
                showErrorToast(['Please select an item and location']);
            }
        }
    };

    const removeOrderItem = (index: number) => {
        const updatedItems = [...data.sales_order_details];

        const newSelectedItemNames = { ...selectedItemNames };
        const newSelectedItemUnits = { ...selectedItemUnits };
        delete newSelectedItemNames[index];
        delete newSelectedItemUnits[index];

        updatedItems.splice(index, 1);
        setData('sales_order_details', updatedItems);

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

    const fetchItemStock = (itemId: number, sourceType: string, sourceId: number): Promise<number> => {
        return new Promise((resolve) => {
            const endpoint = sourceType.toLowerCase() === 'branch' ? 'item.getItemStockByBranch' : 'item.getItemStockByWarehouse';

            fetch(
                route(endpoint, {
                    item_id: itemId,
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
                .then((response) => response.json())
                .then((data) => {
                    resolve(data?.stock || 0);
                })
                .catch(() => {
                    resolve(0);
                });
        });
    };

    const handleItemSelection = (itemId: number, isAddingNew: boolean, index: number = -1) => {
        const selectedItem = items.find((item) => item.id === itemId);

        if (!selectedItem) return;

        let unitPrice = selectedItem.price;
        if (data.customer_id && selectedCustomerPrices[itemId]) {
            unitPrice = selectedCustomerPrices[itemId];
        }

        if (isAddingNew) {
            setFormState((prev) => ({
                ...prev,
                selectedItem: selectedItem,
            }));

            setData({
                ...data,
                new_item: {
                    ...data.new_item,
                    item_id: itemId,
                    unit_price: unitPrice,
                    quantity: 0,
                    total_price: 0,
                },
            });

            const newSelectedItemNames = { ...selectedItemNames };
            newSelectedItemNames[data.sales_order_details.length] = `${selectedItem.name} (${selectedItem.code})`;
            setSelectedItemNames(newSelectedItemNames);

            const newSelectedItemUnits = { ...selectedItemUnits };
            newSelectedItemUnits[data.sales_order_details.length] = selectedItem.item_unit?.abbreviation || '';
            setSelectedItemUnits(newSelectedItemUnits);

            if (data.new_item.item_source_able_id && data.new_item.item_source_able_type) {
                fetchItemStock(itemId, data.new_item.item_source_able_type, data.new_item.item_source_able_id).then((stockQty) => {
                    setFormState((prev) => ({
                        ...prev,
                        availableStock: stockQty,
                    }));

                    setData((prev) => ({
                        ...prev,
                        new_item: {
                            ...prev.new_item,
                            available_stock: stockQty,
                        },
                    }));
                });
            }
        } else if (index >= 0) {
            const updatedItems = [...data.sales_order_details];
            const currentItem = updatedItems[index];

            updatedItems[index] = {
                ...currentItem,
                item_id: itemId,
                unit_price: unitPrice,
                quantity: 0,
                total_price: 0,
            };

            setData('sales_order_details', updatedItems);

            const newSelectedItemNames = { ...selectedItemNames };
            newSelectedItemNames[index] = `${selectedItem.name} (${selectedItem.code})`;
            setSelectedItemNames(newSelectedItemNames);

            const newSelectedItemUnits = { ...selectedItemUnits };
            newSelectedItemUnits[index] = selectedItem.item_unit?.abbreviation || '';
            setSelectedItemUnits(newSelectedItemUnits);

            if (currentItem.item_source_able_id && currentItem.item_source_able_type) {
                fetchItemStock(itemId, currentItem.item_source_able_type, currentItem.item_source_able_id).then((stockQty) => {
                    const newAvailableStocks = { ...availableStocks };
                    newAvailableStocks[index] = stockQty;
                    setAvailableStocks(newAvailableStocks);
                });
            }
        }
    };

    const handleLocationSelection = (locationValue: string, isAddingNew: boolean, index: number = -1) => {
        const [locationType, locationIdStr] = locationValue.split(':');
        const locationId = parseInt(locationIdStr, 10);

        if (isAddingNew) {
            setFormState((prev) => ({
                ...prev,
                selectedLocation: { type: locationType, id: locationId },
            }));

            const itemId = data.new_item.item_id;

            if (itemId) {
                setData({
                    ...data,
                    new_item: {
                        ...data.new_item,
                        item_source_able_type: locationType,
                        item_source_able_id: locationId,
                        quantity: 0,
                        total_price: 0,
                    },
                });

                fetchItemStock(itemId, locationType, locationId).then((stockQty) => {
                    setFormState((prev) => ({
                        ...prev,
                        availableStock: stockQty,
                    }));

                    setData((prev) => ({
                        ...prev,
                        new_item: {
                            ...prev.new_item,
                            available_stock: stockQty,
                        },
                    }));
                });
            }
        } else if (index >= 0) {
            const updatedItems = [...data.sales_order_details];
            const itemId = updatedItems[index].item_id;

            updatedItems[index] = {
                ...updatedItems[index],
                item_source_able_type: locationType,
                item_source_able_id: locationId,
                quantity: 0,
                total_price: 0,
            };

            setData('sales_order_details', updatedItems);

            if (itemId) {
                fetchItemStock(itemId, locationType, locationId).then((stockQty) => {
                    const newAvailableStocks = { ...availableStocks };
                    newAvailableStocks[index] = stockQty;
                    setAvailableStocks(newAvailableStocks);
                });
            }
        }
    };

    const handleQuantityChange = (qty: number, isAddingNew: boolean, index: number = -1) => {
        if (isAddingNew) {
            const maxStock = data.new_item.available_stock;
            const finalQty = qty > maxStock ? maxStock : qty;

            if (finalQty > maxStock) {
                showErrorToast([`Quantity can't exceed available stock (${maxStock})`]);
            }

            const unitPrice = data.new_item.unit_price;
            setData({
                ...data,
                new_item: {
                    ...data.new_item,
                    quantity: finalQty,
                    total_price: finalQty * unitPrice,
                },
            });
        } else if (index >= 0) {
            const updatedItems = [...data.sales_order_details];
            const maxStock = availableStocks[index] || 0;
            const finalQty = qty > maxStock ? maxStock : qty;

            if (finalQty > maxStock) {
                showErrorToast([`Quantity can't exceed available stock (${maxStock})`]);
            }

            const unitPrice = updatedItems[index].unit_price;
            updatedItems[index] = {
                ...updatedItems[index],
                quantity: finalQty,
                total_price: finalQty * unitPrice,
            };

            setData('sales_order_details', updatedItems);
        }
    };

    const handleUnitPriceChange = (price: number, isAddingNew: boolean, index: number = -1) => {
        if (isAddingNew) {
            const qty = data.new_item.quantity;
            setData({
                ...data,
                new_item: {
                    ...data.new_item,
                    unit_price: price,
                    total_price: price * qty,
                },
            });
        } else if (index >= 0) {
            const updatedItems = [...data.sales_order_details];
            const qty = updatedItems[index].quantity;

            updatedItems[index] = {
                ...updatedItems[index],
                unit_price: price,
                total_price: price * qty,
            };

            setData('sales_order_details', updatedItems);
        }
    };

    const getLocationOptions = () => {
        const branchOptions = branches.map((branch) => ({
            value: `branch:${branch.id}`,
            label: `${branch.name}`,
        }));

        const warehouseOptions = warehouses.map((warehouse) => ({
            value: `warehouse:${warehouse.id}`,
            label: `${warehouse.name}`,
        }));

        return [...warehouseOptions, ...branchOptions];
    };

    const getAvailableItems = (currentIndex: number) => {
        return items.filter((item) => {
            return !data.sales_order_details.some((orderItem, i) => i !== currentIndex && orderItem.item_id === item.id);
        });
    };

    const handleCustomerChange = (value: string) => {
        setData('sales_order_details', []);
        setSelectedItemNames({});
        setSelectedItemUnits({});
        setAvailableStocks({});
        setAddingItem(false);
        setEditingIndex(null);

        if (value === 'new') {
            setData({
                ...data,
                customer_id: null,
                customer_name: '',
                sales_order_details: [],
            });
        } else if (value) {
            const customerId = parseInt(value, 10);
            const customer = customers.find((c) => c.id === customerId);

            setData({
                ...data,
                customer_id: customerId,
                customer_name: customer?.name || '',
                sales_order_details: [],
            });

            fetchCustomerPrices(customerId);
        }
    };

    const handleTaxRateChange = (value: string) => {
        if (!value) {
            setData('tax_rate_id', null);
        } else {
            setData('tax_rate_id', parseInt(value, 10));
        }
    };

    const startEditing = (index: number) => {
        const orderItem = data.sales_order_details[index];
        if (orderItem.item_id && orderItem.item_source_able_id && orderItem.item_source_able_type) {
            fetchItemStock(orderItem.item_id, orderItem.item_source_able_type, orderItem.item_source_able_id).then((stockQty) => {
                const newAvailableStocks = { ...availableStocks };
                newAvailableStocks[index] = stockQty;
                setAvailableStocks(newAvailableStocks);

                setEditingIndex(index);
            });
        } else {
            setEditingIndex(index);
        }
    };

    const renderOrderItemForm = (
        orderItem: {
            item_id: number;
            item_source_able_id: number;
            item_source_able_type: string;
            quantity: number;
            unit_price: number;
            total_price: number;
            available_stock?: number;
        } | null = null,
        index: number = -1,
        isAddingNew: boolean = false,
    ) => {
        const item = orderItem || data.new_item;
        const selectedItemId = isAddingNew ? data.new_item.item_id : item.item_id;

        const availableStock = isAddingNew ? data.new_item.available_stock : availableStocks[index] || 0;

        return (
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-md border bg-gray-50 p-4">
                <div className="relative grid min-w-[200px] flex-1 gap-2">
                    <Label htmlFor={`item_id_${index}`}>
                        Item <span className="text-red-500">*</span>
                    </Label>
                    <Combobox
                        value={selectedItemId ? String(selectedItemId) : ''}
                        onValueChange={(value) => handleItemSelection(Number(value), isAddingNew, index)}
                        options={getAvailableItems(isAddingNew ? -1 : index).map((itm) => ({
                            value: String(itm.id),
                            label: `${itm.name} (${itm.code})`,
                        }))}
                        placeholder="Select an item"
                        searchPlaceholder="Search items..."
                        initialDisplayCount={5}
                        className={cn(
                            'w-full max-w-xs truncate',
                            isAddingNew && errors[`new_item.item_id` as keyof typeof errors]
                                ? 'border-red-500 ring-red-100'
                                : !isAddingNew && errors[`sales_order_details.${index}.item_id` as keyof typeof errors]
                                  ? 'border-red-500 ring-red-100'
                                  : '',
                        )}
                    />
                </div>

                {selectedItemId > 0 && (
                    <>
                        <div className="relative grid min-w-[240px] flex-1 gap-2">
                            <Label htmlFor={`location_${index}`}>
                                Item Location <span className="text-red-500">*</span>
                            </Label>
                            <Combobox
                                value={
                                    item.item_source_able_id && item.item_source_able_type
                                        ? `${item.item_source_able_type}:${item.item_source_able_id}`
                                        : ''
                                }
                                onValueChange={(value) => handleLocationSelection(value, isAddingNew, index)}
                                options={getLocationOptions()}
                                placeholder="Select location"
                                searchPlaceholder="Search locations..."
                                initialDisplayCount={5}
                                className={
                                    isAddingNew &&
                                    (errors[`new_item.item_source_able_id` as keyof typeof errors] ||
                                        errors[`new_item.item_source_able_type` as keyof typeof errors])
                                        ? 'border-red-500 ring-red-100'
                                        : !isAddingNew &&
                                            (errors[`sales_order_details.${index}.item_source_able_id` as keyof typeof errors] ||
                                                errors[`sales_order_details.${index}.item_source_able_type` as keyof typeof errors])
                                          ? 'border-red-500 ring-red-100'
                                          : ''
                                }
                            />
                        </div>

                        {item.item_source_able_id > 0 && (
                            <>
                                <div className="relative grid min-w-[100px] flex-1 gap-2">
                                    <Label htmlFor={`available_stock_${index}`}>Available Stock</Label>
                                    <div className="relative">
                                        <Input
                                            id={`available_stock_${index}`}
                                            type="number"
                                            value={formatDecimal(availableStock)}
                                            readOnly
                                            className="bg-gray-50 pr-10"
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                                            {isAddingNew ? selectedItemUnits[data.sales_order_details.length] || '' : selectedItemUnits[index] || ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="relative grid min-w-[100px] flex-1 gap-2">
                                    <Label htmlFor={`quantity_${index}`}>
                                        Quantity <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id={`quantity_${index}`}
                                            type="number"
                                            min="0"
                                            max={availableStock}
                                            value={item.quantity === 0 ? '' : formatDecimal(item.quantity)}
                                            onChange={(e) => handleQuantityChange(Number(e.target.value), isAddingNew, index)}
                                            placeholder="Enter quantity"
                                            className={`[appearance:textfield] pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                                                isAddingNew && errors[`new_item.quantity` as keyof typeof errors]
                                                    ? 'border-red-500 ring-red-100'
                                                    : !isAddingNew && errors[`sales_order_details.${index}.quantity` as keyof typeof errors]
                                                      ? 'border-red-500 ring-red-100'
                                                      : ''
                                            }`}
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500">
                                            {isAddingNew ? selectedItemUnits[data.sales_order_details.length] || '' : selectedItemUnits[index] || ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="relative grid min-w-[140px] flex-1 gap-2">
                                    <Label htmlFor={`unit_price_${index}`}>
                                        Unit Price <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id={`unit_price_${index}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unit_price === 0 ? '' : formatDecimal(item.unit_price)}
                                        readOnly
                                        className="bg-gray-50 pr-10"
                                        onChange={(e) => handleUnitPriceChange(Number(e.target.value), isAddingNew, index)}
                                    />
                                </div>

                                <div className="relative grid min-w-[140px] flex-1 gap-2">
                                    <Label htmlFor={`total_price_${index}`}>Total Price</Label>
                                    <Input
                                        id={`total_price_${index}`}
                                        type="text"
                                        value={formatCurrency(item.total_price)}
                                        readOnly
                                        className="bg-gray-50"
                                    />
                                </div>
                            </>
                        )}
                    </>
                )}

                <div className="flex items-end gap-2 pb-[2px]">
                    <Button
                        type="button"
                        variant="default"
                        size="icon"
                        onClick={saveOrderItem}
                        className="h-9 w-9 bg-green-600 hover:bg-green-700"
                        disabled={!selectedItemId || !item.item_source_able_id || !item.item_source_able_type || item.quantity <= 0}
                    >
                        <CheckCircle className="h-4 w-4 text-white" />
                    </Button>
                </div>
            </div>
        );
    };

    const renderOrderItemList = (
        orderItem: {
            item_id: number;
            item_source_able_id: number;
            item_source_able_type: string;
            quantity: number;
            unit_price: number;
            total_price: number;
        },
        index: number,
    ) => {
        const selectedItem = items.find((itm) => itm.id === orderItem.item_id);
        const itemName = selectedItemNames[index] || (selectedItem ? `${selectedItem.name} (${selectedItem.code})` : 'Unknown Item');
        const itemUnit = selectedItemUnits[index] || selectedItem?.item_unit?.abbreviation || '';

        let sourceName = 'Unknown';
        if (orderItem.item_source_able_type === 'branch') {
            const branch = branches.find((b) => b.id === orderItem.item_source_able_id);
            sourceName = branch?.name || 'Unknown Branch';
        } else {
            const warehouse = warehouses.find((w) => w.id === orderItem.item_source_able_id);
            sourceName = warehouse?.name || 'Unknown Warehouse';
        }

        return (
            <div key={index} className="flex items-center justify-between border-b border-gray-100 py-3">
                <div className="flex-1">
                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
                        <p className="font-medium text-gray-900">{itemName}</p>
                        <span>Location: {sourceName}</span>
                        <span>
                            Quantity: {orderItem.quantity} {itemUnit}
                        </span>
                        <span>Unit Price: {formatCurrency(orderItem.unit_price)}</span>
                        <span className="font-medium">Total: {formatCurrency(orderItem.total_price)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => startEditing(index)} className="h-9 w-9">
                        <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeOrderItem(index)} className="h-9 w-9">
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Sales Order" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Edit Sales Order" description="Update existing sales order details." />
                    <div className="flex gap-3">
                        <Link href={route('sales.order.index')}>
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
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Order Information</h2>
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
                                                        <span className="text-sm text-gray-600">Code will be generated automatically</span>
                                                    </div>
                                                )}
                                            </div>
                                            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="date">
                                                Order Date <span className="text-red-500">*</span>
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
                                                <PopoverContent className="w-auto p-0" align="start">
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

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="customer">Customer</Label>
                                            <Combobox
                                                value={data.customer_id ? String(data.customer_id) : ''}
                                                onValueChange={handleCustomerChange}
                                                options={[
                                                    { value: 'new', label: '+ Add new customer' },
                                                    ...customers.map((customer) => ({
                                                        value: String(customer.id),
                                                        label: customer.name,
                                                    })),
                                                ]}
                                                placeholder="Select customer"
                                                searchPlaceholder="Search customers..."
                                                initialDisplayCount={5}
                                                disabled={true} // Disable customer change in edit mode
                                            />
                                            <p className="text-xs text-gray-500">Customer cannot be changed in edit mode</p>
                                        </div>

                                        {!data.customer_id && (
                                            <div className="relative grid gap-2 space-y-2">
                                                <Label htmlFor="customer_name">
                                                    Customer Name <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="customer_name"
                                                    value={data.customer_name}
                                                    onChange={(e) => setData('customer_name', e.target.value)}
                                                    placeholder="Enter customer name"
                                                    className={errors.customer_name ? 'border-red-500 ring-red-100' : ''}
                                                    readOnly={true} // Make read-only in edit mode
                                                />
                                                {errors.customer_name && <p className="mt-1 text-xs text-red-500">{errors.customer_name}</p>}
                                            </div>
                                        )}

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="tax_rate">Tax Rate</Label>
                                            <Combobox
                                                value={data.tax_rate_id ? String(data.tax_rate_id) : ''}
                                                onValueChange={handleTaxRateChange}
                                                options={[
                                                    { value: '', label: 'No Tax' },
                                                    ...taxRates.map((tax) => ({
                                                        value: String(tax.id),
                                                        label: `${formatDecimal(tax.rate)}%`,
                                                    })),
                                                ]}
                                                placeholder="Select tax rate"
                                                searchPlaceholder="Search tax rates..."
                                                initialDisplayCount={5}
                                            />
                                        </div>

                                        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Subtotal:</span>
                                                <span className="font-medium">{formatCurrency(data.total_amount)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Tax:</span>
                                                <span className="font-medium">{formatCurrency(data.tax_amount)}</span>
                                            </div>
                                            <div className="flex justify-between text-base font-semibold">
                                                <span>Total:</span>
                                                <span>{formatCurrency(data.grand_total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-gray-900">Order Items</h2>
                                        <div className="flex items-center">
                                            <span className="mr-2 text-sm text-gray-500">{data.sales_order_details.length} items</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="max-h-[calc(70vh-260px)] overflow-y-auto pr-2 pl-1">
                                            {addingItem && renderOrderItemForm(null, -1, true)}

                                            {data.sales_order_details.map((orderItem, index) => (
                                                <div key={index}>
                                                    {editingIndex === index
                                                        ? renderOrderItemForm(orderItem, index)
                                                        : renderOrderItemList(orderItem, index)}
                                                </div>
                                            ))}
                                        </div>

                                        {data.sales_order_details.length === 0 && !addingItem && (
                                            <div className="flex items-center justify-center py-8 text-center text-gray-500">
                                                <p>No items added yet. Click the button below to add items to the order.</p>
                                            </div>
                                        )}

                                        {!addingItem && editingIndex === null && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addOrderItem}
                                                className="mt-2"
                                                disabled={!items.length}
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
                        <Button variant="outline" type="button" onClick={() => router.visit(route('sales.order.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || data.sales_order_details.length === 0 || !data.code} className="px-8">
                            {processing ? 'Updating...' : 'Update Order'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
