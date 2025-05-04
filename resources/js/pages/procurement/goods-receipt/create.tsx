import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToastNotification } from '@/hooks/use-toast-notification';
import AppLayout from '@/layouts/app-layout';
import { cn, formatCurrency, formatDate, formatDateToYmd, formatDecimal } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CalendarIcon, Edit, Loader2, Plus, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Procurement',
        href: '#',
    },
    {
        title: 'Goods Receipt',
        href: route('procurement.receipt.index'),
    },
    {
        title: 'Create',
        href: route('procurement.receipt.create'),
    },
];

type Supplier = {
    id: number;
    name: string;
};

type TaxRate = {
    id: number;
    rate: number;
};

type UnreceivedPurchaseOrderDetail = {
    purchase_order_detail_id: number;
    purchase_order_id: number;
    purchase_order_code: string;
    item_id: number;
    item_name: string;
    item_code: string;
    item_abbreviation: string;
    item_wholesale_abbreviation: string | null;
    wholesale_unit_conversion: string | null;
    ordered_quantity: number;
    received_quantity: string | number;
    remaining_quantity: number;
};

type GroupedPurchaseOrder = {
    id: number;
    code: string;
    details: UnreceivedPurchaseOrderDetail[];
};

// New type for miscellaneous cost details
type MiscellaneousCostDetail = {
    id: string;
    name: string;
    amount: string;
};

interface Props {
    suppliers?: Supplier[];
    taxRates?: TaxRate[];
}

export default function Create({ suppliers = [], taxRates = [] }: Props) {
    const { showErrorToast } = useToastNotification();
    const [loading, setLoading] = useState(false);
    const [, setUnreceivedDetails] = useState<UnreceivedPurchaseOrderDetail[]>([]);
    const [groupedPurchaseOrders, setGroupedPurchaseOrders] = useState<GroupedPurchaseOrder[]>([]);
    const [selectedPO, setSelectedPO] = useState<string>('');
    const [receiptQuantities, setReceiptQuantities] = useState<Record<number, string>>({});
    const [receiptPrices, setReceiptPrices] = useState<Record<number, string>>({});
    const [receiptTotals, setReceiptTotals] = useState<Record<number, string>>({});
    const [selectedTaxRate, setSelectedTaxRate] = useState<number | null>(null);
    const [miscellaneousCost, setMiscellaneousCost] = useState<string>('0');
    const isDistributing = useRef(false);
    const isRemoving = useRef(false);

    // New states for miscellaneous cost dialog
    const [miscDialogOpen, setMiscDialogOpen] = useState(false);
    const [miscCostDetails, setMiscCostDetails] = useState<MiscellaneousCostDetail[]>([]);
    const [currentMiscDetail, setCurrentMiscDetail] = useState<MiscellaneousCostDetail>({
        id: '',
        name: '',
        amount: '',
    });
    const [editingMiscIndex, setEditingMiscIndex] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        date: '',
        supplier_id: '',
        received_by: '',
        total_amount: '0',
        miscellaneous_cost: '0',
        tax_rate_id: '',
        tax_amount: '0',
        grand_total: '0',
        miscellaneous_cost_details: [] as MiscellaneousCostDetail[],
        goods_receipt_purchase_order: [] as {
            purchase_order_id: number;
            purchase_order_code: string;
            goods_receipt_details: {
                purchase_order_detail_id: number;
                item_name: string;
                item_code: string;
                ordered_quantity: number;
                remaining_quantity: number;
                received_quantity: number;
                price_per_unit: number;
                total_price: number;
                item_unit: string;
                item_wholesale_unit: string | null;
                wholesale_unit_conversion: number | null;
                converted_quantity: number | null;
                miscellaneous_cost: number;
                tax_amount: number;
                total_amount: number;
                cogs: number;
            }[];
        }[],
    });

    const calculateItemTotals = (quantity: string, price: string) => {
        const qty = parseFloat(quantity || '0');
        const prc = parseFloat(price || '0');
        const subtotal = qty * prc;

        if (isNaN(qty) || isNaN(prc)) return { subtotal: '0' };

        return {
            subtotal: subtotal.toString(),
        };
    };

    const distributeFeesAndCalculateTotals = (forceUpdate = false) => {
        if ((isDistributing.current || isRemoving.current) && !forceUpdate) return;
        if (data.goods_receipt_purchase_order.length === 0) return;

        isDistributing.current = true;

        try {
            const currentPOs = JSON.parse(JSON.stringify(data.goods_receipt_purchase_order));
            const totalMiscCost = parseFloat(miscellaneousCost || '0');
            let totalItemsPrice = 0;

            currentPOs.forEach((po) => {
                po.goods_receipt_details.forEach((detail) => {
                    totalItemsPrice += detail.total_price;
                });
            });

            if (totalItemsPrice === 0) {
                isDistributing.current = false;
                return;
            }

            let totalTaxAmount = 0;
            let sumOfAllocatedMiscCosts = 0;

            for (let poIndex = 0; poIndex < currentPOs.length; poIndex++) {
                for (let detailIndex = 0; detailIndex < currentPOs[poIndex].goods_receipt_details.length; detailIndex++) {
                    const detail = currentPOs[poIndex].goods_receipt_details[detailIndex];
                    const isLastItem = poIndex === currentPOs.length - 1 && detailIndex === currentPOs[poIndex].goods_receipt_details.length - 1;

                    const proportion = detail.total_price / totalItemsPrice;
                    let allocatedMiscCost;

                    if (isLastItem) {
                        allocatedMiscCost = totalMiscCost - sumOfAllocatedMiscCosts;
                    } else {
                        allocatedMiscCost = Math.ceil(proportion * totalMiscCost);
                        sumOfAllocatedMiscCosts += allocatedMiscCost;
                    }

                    currentPOs[poIndex].goods_receipt_details[detailIndex].miscellaneous_cost = allocatedMiscCost;

                    // Calculate tax based on item price only (excluding misc cost)
                    let taxAmount = 0;
                    if (selectedTaxRate) {
                        const taxRate = taxRates.find((t) => t.id === selectedTaxRate);
                        if (taxRate) {
                            // Calculate tax on item price only, not including miscellaneous cost
                            const itemTotal = detail.total_price;
                            taxAmount = itemTotal * (taxRate.rate / 100);
                            totalTaxAmount += taxAmount;
                        }
                    }

                    currentPOs[poIndex].goods_receipt_details[detailIndex].tax_amount = taxAmount;

                    const totalAmount = detail.total_price + allocatedMiscCost + taxAmount;
                    currentPOs[poIndex].goods_receipt_details[detailIndex].total_amount = totalAmount;

                    // Calculate COGS and ceiling the result
                    const quantity = detail.received_quantity || 1;
                    if (detail.wholesale_unit_conversion && detail.item_wholesale_unit) {
                        // For items with wholesale unit
                        currentPOs[poIndex].goods_receipt_details[detailIndex].cogs = Math.ceil(
                            totalAmount / (quantity * detail.wholesale_unit_conversion),
                        );
                    } else {
                        // For regular items
                        currentPOs[poIndex].goods_receipt_details[detailIndex].cogs = Math.ceil(totalAmount / quantity);
                    }
                }
            }

            const updatedState = {
                ...data,
                goods_receipt_purchase_order: currentPOs,
                miscellaneous_cost: totalMiscCost.toString(),
                tax_amount: totalTaxAmount.toString(),
                grand_total: (totalItemsPrice + totalMiscCost + totalTaxAmount).toString(),
                total_amount: totalItemsPrice.toString(),
            };

            setData(updatedState);
        } finally {
            setTimeout(() => {
                isDistributing.current = false;
            }, 100);
        }
    };

    useEffect(() => {
        if (isDistributing.current || isRemoving.current) return;

        let totalAmount = 0;

        data.goods_receipt_purchase_order.forEach((po) => {
            po.goods_receipt_details.forEach((detail) => {
                totalAmount += detail.total_price;
            });
        });

        if (totalAmount.toString() !== data.total_amount) {
            setData((prevData) => ({
                ...prevData,
                total_amount: totalAmount.toString(),
            }));
        }
    }, [data.goods_receipt_purchase_order]);

    useEffect(() => {
        if (data.goods_receipt_purchase_order.length > 0 && !isRemoving.current) {
            distributeFeesAndCalculateTotals();
        }
    }, [selectedTaxRate, miscellaneousCost]);

    const handleTaxRateChange = (taxRateId: string) => {
        setData('tax_rate_id', taxRateId);
        setSelectedTaxRate(taxRateId ? parseInt(taxRateId) : null);

        if (data.goods_receipt_purchase_order.length > 0) {
            setTimeout(() => {
                distributeFeesAndCalculateTotals(true);
            }, 50);
        }
    };

    // Modified to update both the form data and sync with miscellaneous cost details
    const handleMiscCostChange = (value: string) => {
        setMiscellaneousCost(value);

        if (!data.goods_receipt_purchase_order.length) {
            setData('miscellaneous_cost', value);
        } else {
            setTimeout(() => {
                distributeFeesAndCalculateTotals(true);
            }, 50);
        }
    };

    // Updates the total miscellaneous cost from the details
    const updateTotalMiscCost = (details: MiscellaneousCostDetail[]) => {
        const total = details.reduce((sum, item) => {
            const amount = parseFloat(item.amount) || 0;
            return sum + amount;
        }, 0);

        setMiscellaneousCost(total.toString());
        setData('miscellaneous_cost', total.toString());
        setData('miscellaneous_cost_details', details);

        if (data.goods_receipt_purchase_order.length > 0) {
            setTimeout(() => {
                distributeFeesAndCalculateTotals(true);
            }, 50);
        }
    };

    // Handler for adding new miscellaneous cost detail
    const handleAddMiscCostDetail = () => {
        if (!currentMiscDetail.name || !currentMiscDetail.amount || parseFloat(currentMiscDetail.amount) <= 0) {
            showErrorToast(['Please enter a valid name and amount']);
            return;
        }

        let updatedDetails;

        if (editingMiscIndex !== null) {
            // Update existing detail
            updatedDetails = [...miscCostDetails];
            updatedDetails[editingMiscIndex] = {
                ...currentMiscDetail,
                id: currentMiscDetail.id || crypto.randomUUID(),
            };
        } else {
            // Add new detail
            updatedDetails = [
                ...miscCostDetails,
                {
                    ...currentMiscDetail,
                    id: crypto.randomUUID(),
                },
            ];
        }

        setMiscCostDetails(updatedDetails);
        updateTotalMiscCost(updatedDetails);

        // Reset form
        setCurrentMiscDetail({ id: '', name: '', amount: '' });
        setEditingMiscIndex(null);
    };

    // Handler to edit a miscellaneous cost detail
    const handleEditMiscCostDetail = (index: number) => {
        setCurrentMiscDetail(miscCostDetails[index]);
        setEditingMiscIndex(index);
    };

    // Handler to remove a miscellaneous cost detail
    const handleRemoveMiscCostDetail = (index: number) => {
        const updatedDetails = [...miscCostDetails];
        updatedDetails.splice(index, 1);
        setMiscCostDetails(updatedDetails);
        updateTotalMiscCost(updatedDetails);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const filteredPOs = data.goods_receipt_purchase_order
            .map((po) => ({
                ...po,
                goods_receipt_details: po.goods_receipt_details.filter((detail) => detail.received_quantity > 0),
            }))
            .filter((po) => po.goods_receipt_details.length > 0);

        const submitData = {
            ...data,
            goods_receipt_purchase_order: filteredPOs,
            miscellaneous_cost_details: miscCostDetails,
        };

        post(route('procurement.receipt.store', submitData), {
            preserveScroll: true,
            onError: showErrorToast,
        });
    };

    const fetchUnreceivedPurchaseOrders = useCallback(
        async (supplierId: string) => {
            if (!supplierId) return;

            setLoading(true);
            try {
                const response = await fetch(
                    route('procurement.receipt.getUnreceivedPurchaseOrderDetails', {
                        supplier_id: supplierId,
                    }),
                    {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const responseData = await response.json();
                let responseItems = responseData;

                if (responseData && responseData.data && Array.isArray(responseData.data)) {
                    responseItems = responseData.data;
                }

                if (Array.isArray(responseItems)) {
                    setUnreceivedDetails(responseItems);

                    const groupedByPO: Record<number, GroupedPurchaseOrder> = {};

                    responseItems.forEach((item: UnreceivedPurchaseOrderDetail) => {
                        const poId = item.purchase_order_id;

                        if (!groupedByPO[poId]) {
                            groupedByPO[poId] = {
                                id: poId,
                                code: item.purchase_order_code,
                                details: [],
                            };
                        }

                        groupedByPO[poId].details.push(item);
                    });

                    const purchaseOrders = Object.values(groupedByPO);
                    setGroupedPurchaseOrders(purchaseOrders);

                    setSelectedPO('');
                    setReceiptQuantities({});
                    setReceiptPrices({});
                    setReceiptTotals({});
                    setMiscellaneousCost('0');
                    setMiscCostDetails([]); // Reset misc cost details

                    setData({
                        ...data,
                        supplier_id: supplierId,
                        goods_receipt_purchase_order: [],
                        total_amount: '0',
                        miscellaneous_cost: '0',
                        miscellaneous_cost_details: [],
                        tax_amount: '0',
                        grand_total: '0',
                    });
                } else {
                    showErrorToast(['Invalid response format']);
                }
            } catch (error) {
                showErrorToast([(error as Error).message]);
            } finally {
                setLoading(false);
            }
        },
        [data, setData, showErrorToast],
    );

    const handleSupplierChange = (supplierId: string) => {
        setData('supplier_id', supplierId);
        fetchUnreceivedPurchaseOrders(supplierId);
    };

    const handleSelectedPOChange = (poId: string) => {
        setSelectedPO(poId);

        if (poId) {
            const po = groupedPurchaseOrders.find((p) => p.id.toString() === poId);
            if (po) {
                const newQuantities = { ...receiptQuantities };
                const newPrices = { ...receiptPrices };
                const newTotals = { ...receiptTotals };

                po.details.forEach((detail) => {
                    newQuantities[detail.purchase_order_detail_id] = '';
                    newPrices[detail.purchase_order_detail_id] = '';
                    newTotals[detail.purchase_order_detail_id] = '';
                });

                setReceiptQuantities(newQuantities);
                setReceiptPrices(newPrices);
                setReceiptTotals(newTotals);
            }
        }
    };

    const handleReceiptQuantityChange = (poDetailId: number, value: string, maxQuantity: number) => {
        if (value === '') {
            setReceiptQuantities({
                ...receiptQuantities,
                [poDetailId]: value,
            });
            const { subtotal } = calculateItemTotals(value, receiptPrices[poDetailId] || '0');
            setReceiptTotals({
                ...receiptTotals,
                [poDetailId]: subtotal,
            });
            return;
        }

        let quantity = Number(value);
        if (isNaN(quantity) || quantity < 0) return;

        if (quantity > maxQuantity) {
            quantity = maxQuantity;
            value = quantity.toString();
        }

        setReceiptQuantities({
            ...receiptQuantities,
            [poDetailId]: value,
        });

        const { subtotal } = calculateItemTotals(value, receiptPrices[poDetailId] || '0');
        setReceiptTotals({
            ...receiptTotals,
            [poDetailId]: subtotal,
        });
    };

    const handleReceiptPriceChange = (poDetailId: number, value: string) => {
        if (value === '') {
            setReceiptPrices({
                ...receiptPrices,
                [poDetailId]: value,
            });
            const { subtotal } = calculateItemTotals(receiptQuantities[poDetailId] || '0', value);
            setReceiptTotals({
                ...receiptTotals,
                [poDetailId]: subtotal,
            });
            return;
        }

        const price = Number(value);
        if (isNaN(price) || price < 0) return;

        setReceiptPrices({
            ...receiptPrices,
            [poDetailId]: value,
        });

        const { subtotal } = calculateItemTotals(receiptQuantities[poDetailId] || '0', value);
        setReceiptTotals({
            ...receiptTotals,
            [poDetailId]: subtotal,
        });
    };

    const addItemToReceipt = (detail: UnreceivedPurchaseOrderDetail) => {
        const poId = detail.purchase_order_id;
        const poDetailId = detail.purchase_order_detail_id;
        const quantityStr = receiptQuantities[poDetailId] || '';
        const priceStr = receiptPrices[poDetailId] || '';

        if (quantityStr === '' || Number(quantityStr) <= 0) {
            showErrorToast(['Please enter a valid quantity']);
            return;
        }

        if (priceStr === '' || Number(priceStr) <= 0) {
            showErrorToast(['Please enter a valid price']);
            return;
        }

        const quantity = Number(quantityStr);
        const price = Number(priceStr);

        const { subtotal } = calculateItemTotals(quantityStr, priceStr);

        let convertedQuantity = null;
        if (detail.item_wholesale_abbreviation && detail.wholesale_unit_conversion) {
            convertedQuantity = quantity * Number(detail.wholesale_unit_conversion);
        }

        const updatedPOs = [...data.goods_receipt_purchase_order];

        let poIndex = updatedPOs.findIndex((po) => po.purchase_order_id === poId);

        if (poIndex === -1) {
            const newPO = {
                purchase_order_id: poId,
                purchase_order_code: detail.purchase_order_code,
                goods_receipt_details: [],
            };

            updatedPOs.push(newPO);
            poIndex = updatedPOs.length - 1;
        }

        const updatedPO = updatedPOs[poIndex];

        // Calculate COGS with ceiling
        let cogs;
        const misc = parseFloat(miscellaneousCost || '0');
        const subtotalNum = Number(subtotal);

        if (detail.item_wholesale_abbreviation && detail.wholesale_unit_conversion) {
            // For items with wholesale units
            cogs = Math.ceil((subtotalNum + misc) / (quantity * Number(detail.wholesale_unit_conversion)));
        } else {
            // For regular items
            cogs = Math.ceil((subtotalNum + misc) / quantity);
        }

        // Calculate tax based on item price only, not including misc cost
        let taxAmount = 0;
        if (selectedTaxRate) {
            const taxRate = taxRates.find((t) => t.id === selectedTaxRate);
            if (taxRate) {
                taxAmount = subtotalNum * (taxRate.rate / 100);
            }
        }

        const newDetail = {
            purchase_order_detail_id: poDetailId,
            item_name: `${detail.item_name} (${detail.item_code})`,
            item_code: detail.item_code,
            ordered_quantity: Number(detail.ordered_quantity),
            remaining_quantity: Number(detail.remaining_quantity),
            received_quantity: Math.min(quantity, Number(detail.remaining_quantity)),
            price_per_unit: price,
            total_price: Number(subtotal),
            miscellaneous_cost: parseFloat(miscellaneousCost || '0'),
            tax_amount: taxAmount,
            total_amount: Number(subtotal) + parseFloat(miscellaneousCost || '0') + taxAmount,
            cogs: cogs,
            item_unit: detail.item_abbreviation,
            item_wholesale_unit: detail.item_wholesale_abbreviation,
            wholesale_unit_conversion: detail.wholesale_unit_conversion ? Number(detail.wholesale_unit_conversion) : null,
            converted_quantity: convertedQuantity,
        };

        const detailIndex = updatedPO.goods_receipt_details.findIndex((d) => d.purchase_order_detail_id === poDetailId);

        if (detailIndex !== -1) {
            updatedPO.goods_receipt_details[detailIndex] = {
                ...updatedPO.goods_receipt_details[detailIndex],
                received_quantity: Math.min(quantity, Number(detail.remaining_quantity)),
                price_per_unit: price,
                total_price: Number(subtotal),
                converted_quantity: convertedQuantity,
                tax_amount: taxAmount,
                total_amount: Number(subtotal) + parseFloat(miscellaneousCost || '0') + taxAmount,
                cogs: cogs,
            };
        } else {
            updatedPO.goods_receipt_details.push(newDetail);
        }

        if (updatedPOs.length === 1 && updatedPO.goods_receipt_details.length === 1) {
            setData({
                ...data,
                goods_receipt_purchase_order: updatedPOs,
                total_amount: subtotal,
                miscellaneous_cost: miscellaneousCost,
                tax_amount: taxAmount.toString(),
                grand_total: (Number(subtotal) + parseFloat(miscellaneousCost || '0') + taxAmount).toString(),
            });
        } else {
            setData({
                ...data,
                goods_receipt_purchase_order: updatedPOs,
            });
        }

        setSelectedPO(selectedPO);

        if (!(updatedPOs.length === 1 && updatedPO.goods_receipt_details.length === 1)) {
            setTimeout(() => {
                distributeFeesAndCalculateTotals(true);
            }, 10);
        }
    };

    const removeItemFromReceipt = (poDetailId: number) => {
        if (isRemoving.current) return;
        isRemoving.current = true;

        const newPurchaseOrders = [];

        for (const po of data.goods_receipt_purchase_order) {
            const newDetails = po.goods_receipt_details.filter((detail) => detail.purchase_order_detail_id !== poDetailId);

            if (newDetails.length > 0) {
                newPurchaseOrders.push({
                    purchase_order_id: po.purchase_order_id,
                    purchase_order_code: po.purchase_order_code,
                    goods_receipt_details: newDetails,
                });
            }
        }

        let newTotalAmount = 0;
        newPurchaseOrders.forEach((po) => {
            po.goods_receipt_details.forEach((detail) => {
                newTotalAmount += detail.total_price;
            });
        });

        const newState = {
            ...data,
            goods_receipt_purchase_order: newPurchaseOrders,
            total_amount: newTotalAmount.toString(),
        };

        setData(newState);

        setTimeout(() => {
            if (newPurchaseOrders.length === 0) {
                setData({
                    ...data,
                    goods_receipt_purchase_order: [],
                    total_amount: '0',
                    tax_amount: '0',
                    grand_total: '0',
                });
            } else {
                isDistributing.current = true;

                const currentPOs = JSON.parse(JSON.stringify(newPurchaseOrders));
                const totalMiscCost = parseFloat(miscellaneousCost || '0');
                let totalItemsPrice = 0;

                currentPOs.forEach((po) => {
                    po.goods_receipt_details.forEach((detail) => {
                        totalItemsPrice += detail.total_price;
                    });
                });

                let totalTaxAmount = 0;
                let sumOfAllocatedMiscCosts = 0;

                for (let poIndex = 0; poIndex < currentPOs.length; poIndex++) {
                    for (let detailIndex = 0; detailIndex < currentPOs[poIndex].goods_receipt_details.length; detailIndex++) {
                        const detail = currentPOs[poIndex].goods_receipt_details[detailIndex];
                        const isLastItem = poIndex === currentPOs.length - 1 && detailIndex === currentPOs[poIndex].goods_receipt_details.length - 1;

                        const proportion = detail.total_price / totalItemsPrice;
                        let allocatedMiscCost;

                        if (isLastItem) {
                            allocatedMiscCost = totalMiscCost - sumOfAllocatedMiscCosts;
                        } else {
                            allocatedMiscCost = Math.ceil(proportion * totalMiscCost);
                            sumOfAllocatedMiscCosts += allocatedMiscCost;
                        }

                        currentPOs[poIndex].goods_receipt_details[detailIndex].miscellaneous_cost = allocatedMiscCost;

                        // Calculate tax based on item price only (not including misc cost)
                        let taxAmount = 0;
                        if (selectedTaxRate) {
                            const taxRate = taxRates.find((t) => t.id === selectedTaxRate);
                            if (taxRate) {
                                taxAmount = detail.total_price * (taxRate.rate / 100);
                                totalTaxAmount += taxAmount;
                            }
                        }

                        currentPOs[poIndex].goods_receipt_details[detailIndex].tax_amount = taxAmount;

                        const totalAmount = detail.total_price + allocatedMiscCost + taxAmount;
                        currentPOs[poIndex].goods_receipt_details[detailIndex].total_amount = totalAmount;

                        const quantity = detail.received_quantity || 1;

                        // Calculate and ceiling COGS
                        if (detail.wholesale_unit_conversion && detail.item_wholesale_unit) {
                            currentPOs[poIndex].goods_receipt_details[detailIndex].cogs = Math.ceil(
                                totalAmount / (quantity * detail.wholesale_unit_conversion),
                            );
                        } else {
                            currentPOs[poIndex].goods_receipt_details[detailIndex].cogs = Math.ceil(totalAmount / quantity);
                        }
                    }
                }

                const completeUpdatedState = {
                    ...data,
                    goods_receipt_purchase_order: currentPOs,
                    miscellaneous_cost: totalMiscCost.toString(),
                    tax_amount: totalTaxAmount.toString(),
                    grand_total: (totalItemsPrice + totalMiscCost + totalTaxAmount).toString(),
                    total_amount: totalItemsPrice.toString(),
                };

                setData(completeUpdatedState);
            }

            setTimeout(() => {
                isRemoving.current = false;
                isDistributing.current = false;
            }, 200);
        }, 200);
    };

    const isItemInReceipt = (poDetailId: number): boolean => {
        return data.goods_receipt_purchase_order.some((po) =>
            po.goods_receipt_details.some((detail) => detail.purchase_order_detail_id === poDetailId),
        );
    };

    // Open miscellaneous cost dialog
    const openMiscCostDialog = () => {
        setMiscDialogOpen(true);
    };

    // Close miscellaneous cost dialog
    const closeMiscCostDialog = () => {
        setCurrentMiscDetail({ id: '', name: '', amount: '' });
        setEditingMiscIndex(null);
        setMiscDialogOpen(false);
    };

    const getCurrentPOWithFilteredItems = () => {
        if (!selectedPO) return null;

        const po = groupedPurchaseOrders.find((p) => p.id.toString() === selectedPO);
        if (!po) return null;

        return {
            ...po,
            details: po.details.filter((detail) => !isItemInReceipt(detail.purchase_order_detail_id)),
        };
    };

    const filteredCurrentPO = getCurrentPOWithFilteredItems();

    const getReceiptItems = () => {
        return data.goods_receipt_purchase_order.flatMap((po) =>
            po.goods_receipt_details.map((detail) => ({
                ...detail,
                purchase_order_code: po.purchase_order_code,
            })),
        );
    };

    const hasItemsToReceive = data.goods_receipt_purchase_order.some((po) => po.goods_receipt_details.some((detail) => detail.received_quantity > 0));

    const canSubmit = data.code && data.supplier_id && data.received_by && hasItemsToReceive;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Goods Receipt" />
            <div className="rounded-lg bg-white px-8 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Heading title="Create Goods Receipt" description="Record received items from purchase orders." />
                    <div className="flex gap-3">
                        <Link href={route('procurement.receipt.index')}>
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
                                    <h2 className="mb-4 text-base font-semibold text-gray-900">Goods Receipt Information</h2>
                                    <div className="space-y-4">
                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="code">
                                                Receipt Code <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="code"
                                                value={data.code}
                                                onChange={(e) => setData('code', e.target.value)}
                                                placeholder="Enter receipt code from supplier"
                                                className={errors.code ? 'border-red-500 ring-red-100' : ''}
                                            />
                                            {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="supplier_id">
                                                Supplier <span className="text-red-500">*</span>
                                            </Label>
                                            <Combobox
                                                value={data.supplier_id ? data.supplier_id.toString() : ''}
                                                onValueChange={handleSupplierChange}
                                                options={suppliers.map((supplier) => ({
                                                    value: supplier.id.toString(),
                                                    label: supplier.name,
                                                }))}
                                                placeholder="Select supplier"
                                                searchPlaceholder="Search suppliers..."
                                                initialDisplayCount={5}
                                                className={errors.supplier_id ? 'border-red-500' : ''}
                                            />
                                            {errors.supplier_id && <p className="text-sm text-red-500">{errors.supplier_id}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="date">
                                                Receipt Date <span className="text-red-500">*</span>
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
                                                        onSelect={(date) => date && setData('date', formatDateToYmd(date))}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                                        </div>

                                        <div className="relative grid gap-2 space-y-2">
                                            <Label htmlFor="received_by">
                                                Received By <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="received_by"
                                                value={data.received_by}
                                                onChange={(e) => setData('received_by', e.target.value)}
                                                placeholder="Enter name of receiver"
                                                className={errors.received_by ? 'border-red-500 ring-red-100' : ''}
                                            />
                                            {errors.received_by && <p className="mt-1 text-xs text-red-500">{errors.received_by}</p>}
                                        </div>

                                        <div className="grid grid-cols-5 gap-4">
                                            <div className="col-span-3">
                                                <div className="mb-2">
                                                    <Label htmlFor="miscellaneous_cost">Miscellaneous Cost</Label>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="miscellaneous_cost"
                                                        type="number"
                                                        min="0"
                                                        value={miscellaneousCost}
                                                        readOnly
                                                        placeholder="Total miscellaneous cost"
                                                        className={cn(errors.miscellaneous_cost ? 'border-red-500 ring-red-100' : '', 'flex-1')}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={openMiscCostDialog}
                                                        disabled={data.goods_receipt_purchase_order.length > 0}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                {errors.miscellaneous_cost && (
                                                    <p className="mt-1 text-xs text-red-500">{errors.miscellaneous_cost}</p>
                                                )}
                                                {errors.miscellaneous_cost_details && (
                                                    <p className="mt-1 text-xs text-red-500">Miscellaneous cost details are required</p>
                                                )}
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {data.goods_receipt_purchase_order.length > 0
                                                        ? 'Misc cost is locked after items are added to the list.'
                                                        : 'This cost will be distributed proportionally across all items.'}
                                                </p>

                                                {miscCostDetails.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="mb-1 text-xs font-medium text-gray-700">Cost breakdown:</p>
                                                        <div className="ml-2 text-xs text-gray-600">
                                                            {miscCostDetails.map((detail, index) => (
                                                                <div key={detail.id} className="mb-0.5 flex justify-between">
                                                                    <span>{detail.name}:</span>
                                                                    <span>{formatCurrency(detail.amount)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="col-span-2">
                                                <div className="mb-2">
                                                    <Label htmlFor="tax_rate_id">Tax Rate</Label>
                                                </div>
                                                <Combobox
                                                    value={data.tax_rate_id ? data.tax_rate_id.toString() : ''}
                                                    onValueChange={handleTaxRateChange}
                                                    options={[
                                                        { value: '', label: 'No Tax' },
                                                        ...taxRates.map((tax) => ({
                                                            value: tax.id.toString(),
                                                            label: `${formatDecimal(tax.rate)}%`,
                                                        })),
                                                    ]}
                                                    placeholder="Select tax rate"
                                                    searchPlaceholder="Search tax rates..."
                                                    initialDisplayCount={5}
                                                    className={errors.tax_rate_id ? 'border-red-500' : ''}
                                                    disabled={data.goods_receipt_purchase_order.length > 0}
                                                />
                                                {errors.tax_rate_id && <p className="mt-1 text-xs text-red-500">{errors.tax_rate_id}</p>}
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <div className="mb-2 flex justify-between">
                                                <span className="text-sm text-gray-600">Total Amount:</span>
                                                <span className="font-medium">{formatCurrency(data.total_amount)}</span>
                                            </div>
                                            <div className="mb-2 flex justify-between">
                                                <span className="text-sm text-gray-600">Miscellaneous Costs:</span>
                                                <span className="font-medium">{formatCurrency(data.miscellaneous_cost)}</span>
                                            </div>
                                            <div className="mb-2 flex justify-between">
                                                <span className="text-sm text-gray-600">Tax Amount:</span>
                                                <span className="font-medium">{formatCurrency(data.tax_amount)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="text-sm font-medium">Grand Total:</span>
                                                <span className="font-bold">{formatCurrency(data.grand_total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="h-full border-0 shadow-sm">
                                <div className="p-6">
                                    <div className="mb-4">
                                        <h2 className="text-base font-semibold text-gray-900">Items Selection</h2>
                                        <p className="text-sm text-gray-500">Select items to include in this receipt</p>
                                    </div>

                                    {data.supplier_id && (
                                        <div className="mb-6 space-y-4">
                                            {loading ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                                    <span className="ml-2 text-gray-500">Loading purchase orders...</span>
                                                </div>
                                            ) : groupedPurchaseOrders.length === 0 ? (
                                                <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center text-gray-500">
                                                    No pending purchase orders found for this supplier.
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="purchase_order">Purchase Order</Label>
                                                        <Combobox
                                                            value={selectedPO ? selectedPO.toString() : ''}
                                                            onValueChange={handleSelectedPOChange}
                                                            options={groupedPurchaseOrders.map((po) => ({
                                                                value: po.id.toString(),
                                                                label: `${po.code} (${po.details.length} items)`,
                                                            }))}
                                                            placeholder="Select purchase order"
                                                            searchPlaceholder="Search purchase orders..."
                                                            initialDisplayCount={5}
                                                        />
                                                    </div>

                                                    {filteredCurrentPO && (
                                                        <div className="rounded-md border p-4">
                                                            <h3 className="mb-2 font-medium">Items from PO: {filteredCurrentPO.code}</h3>

                                                            <div className="max-h-[300px] overflow-y-auto">
                                                                <table className="w-full border-collapse text-sm">
                                                                    <thead>
                                                                        <tr className="border-b">
                                                                            <th className="px-2 py-2 text-left">Item</th>
                                                                            <th className="px-2 py-2 text-center">Ordered</th>
                                                                            <th className="px-2 py-2 text-center">Remaining</th>
                                                                            <th className="px-2 py-2 text-center">Quantity</th>
                                                                            <th className="px-2 py-2 text-center">Price</th>
                                                                            <th className="px-2 py-2 text-center">Total</th>
                                                                            <th className="px-2 py-2 text-center">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {filteredCurrentPO.details.map((detail) => {
                                                                            const isAdded = isItemInReceipt(detail.purchase_order_detail_id);
                                                                            const hasWholesale =
                                                                                detail.item_wholesale_abbreviation &&
                                                                                detail.wholesale_unit_conversion;

                                                                            return (
                                                                                <tr
                                                                                    key={detail.purchase_order_detail_id}
                                                                                    className={`border-b ${isAdded ? 'bg-green-50' : ''}`}
                                                                                >
                                                                                    <td className="px-2 py-2">
                                                                                        {detail.item_name} ({detail.item_code})
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        {hasWholesale
                                                                                            ? `${formatDecimal(detail.ordered_quantity)} ${detail.item_wholesale_abbreviation} (${formatDecimal(Number(detail.ordered_quantity) * Number(detail.wholesale_unit_conversion))} ${detail.item_abbreviation})`
                                                                                            : `${formatDecimal(detail.ordered_quantity)} ${detail.item_abbreviation}`}
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        {hasWholesale
                                                                                            ? `${formatDecimal(detail.remaining_quantity)} ${detail.item_wholesale_abbreviation} (${formatDecimal(Number(detail.remaining_quantity) * Number(detail.wholesale_unit_conversion))} ${detail.item_abbreviation})`
                                                                                            : `${formatDecimal(detail.remaining_quantity)} ${detail.item_abbreviation}`}
                                                                                    </td>
                                                                                    <td className="px-2 py-2">
                                                                                        <div className="flex items-center justify-center">
                                                                                            <Input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                max={Number(detail.remaining_quantity)}
                                                                                                value={
                                                                                                    receiptQuantities[
                                                                                                        detail.purchase_order_detail_id
                                                                                                    ] || ''
                                                                                                }
                                                                                                onChange={(e) =>
                                                                                                    handleReceiptQuantityChange(
                                                                                                        detail.purchase_order_detail_id,
                                                                                                        e.target.value,
                                                                                                        Number(detail.remaining_quantity),
                                                                                                    )
                                                                                                }
                                                                                                placeholder="Enter qty"
                                                                                                className="w-20 [appearance:textfield] text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                                            />
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-2 py-2">
                                                                                        <div className="flex items-center justify-center">
                                                                                            <Input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                step="1"
                                                                                                value={
                                                                                                    receiptPrices[detail.purchase_order_detail_id] ||
                                                                                                    ''
                                                                                                }
                                                                                                onChange={(e) =>
                                                                                                    handleReceiptPriceChange(
                                                                                                        detail.purchase_order_detail_id,
                                                                                                        e.target.value,
                                                                                                    )
                                                                                                }
                                                                                                placeholder="Enter price"
                                                                                                className="w-24 [appearance:textfield] text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                                            />
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-right">
                                                                                        {formatCurrency(
                                                                                            receiptTotals[detail.purchase_order_detail_id] || '0',
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        <Button
                                                                                            type="button"
                                                                                            size="sm"
                                                                                            variant="default"
                                                                                            onClick={() => addItemToReceipt(detail)}
                                                                                        >
                                                                                            <>
                                                                                                <Plus className="mr-1 h-4 w-4" />
                                                                                                Add
                                                                                            </>
                                                                                        </Button>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Items to be Received</h3>

                                        {getReceiptItems().length === 0 ? (
                                            <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                                                No items added yet. Use the selection panel above to add items.
                                            </div>
                                        ) : (
                                            <div className="max-h-[300px] overflow-y-auto rounded-md border p-4">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead>
                                                        <tr className="border-b">
                                                            <th className="px-2 py-2 text-left">Item</th>
                                                            <th className="px-2 py-2 text-left">PO</th>
                                                            <th className="px-2 py-2 text-center">Quantity</th>
                                                            <th className="px-2 py-2 text-right">Price</th>
                                                            <th className="px-2 py-2 text-right">Misc Cost</th>
                                                            <th className="px-2 py-2 text-right">Tax</th>
                                                            <th className="px-2 py-2 text-right">Total</th>
                                                            <th className="px-2 py-2 text-right">Cogs</th>
                                                            <th className="px-2 py-2 text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {getReceiptItems().map((item) => (
                                                            <tr key={item.purchase_order_detail_id} className="border-b">
                                                                <td className="px-2 py-2">{item.item_name}</td>
                                                                <td className="px-2 py-2">{item.purchase_order_code}</td>
                                                                <td className="px-2 py-2 text-center">
                                                                    {item.item_wholesale_unit &&
                                                                    item.wholesale_unit_conversion &&
                                                                    item.converted_quantity
                                                                        ? `${formatDecimal(item.received_quantity)} ${item.item_wholesale_unit} (${formatDecimal(item.converted_quantity)} ${item.item_unit})`
                                                                        : `${formatDecimal(item.received_quantity)} ${item.item_unit}`}
                                                                </td>
                                                                <td className="px-2 py-2 text-right">{formatCurrency(item.price_per_unit)}</td>
                                                                <td className="px-2 py-2 text-right">{formatCurrency(item.miscellaneous_cost)}</td>
                                                                <td className="px-2 py-2 text-right">{formatCurrency(item.tax_amount)}</td>
                                                                <td className="px-2 py-2 text-right">{formatCurrency(item.total_amount)}</td>
                                                                <td className="px-2 py-2 text-right">{formatCurrency(item.cogs)}</td>
                                                                <td className="px-2 py-2 text-center">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeItemFromReceipt(item.purchase_order_detail_id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="sticky bottom-0 mt-6 border-t bg-white pt-4 pb-2">
                        <div className="flex items-center justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => router.visit(route('procurement.receipt.index'))}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || !canSubmit} className="px-8">
                                {processing ? 'Processing...' : 'Create Receipt'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Miscellaneous Cost Dialog */}
            <Dialog open={miscDialogOpen} onOpenChange={setMiscDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Miscellaneous Costs</DialogTitle>
                        <DialogDescription>Add detailed breakdown of miscellaneous costs.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-12 items-end gap-4">
                            <div className="col-span-6">
                                <Label htmlFor="cost-name">Cost Name</Label>
                                <Input
                                    id="cost-name"
                                    value={currentMiscDetail.name}
                                    onChange={(e) => setCurrentMiscDetail({ ...currentMiscDetail, name: e.target.value })}
                                    placeholder="e.g. Shipping, Handling, etc."
                                    className="mt-1"
                                />
                            </div>
                            <div className="col-span-5">
                                <Label htmlFor="cost-amount">Amount</Label>
                                <Input
                                    id="cost-amount"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={currentMiscDetail.amount}
                                    onChange={(e) => setCurrentMiscDetail({ ...currentMiscDetail, amount: e.target.value })}
                                    placeholder="Enter amount"
                                    className="mt-1"
                                />
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <Button type="button" variant="ghost" onClick={handleAddMiscCostDetail} className="px-2">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {miscCostDetails.length > 0 && (
                            <div>
                                <h4 className="mb-2 text-sm font-medium">Cost Breakdown</h4>
                                <div className="max-h-[200px] space-y-2 overflow-y-auto">
                                    {miscCostDetails.map((detail, index) => (
                                        <div key={detail.id} className="flex items-center justify-between rounded bg-gray-50 p-2">
                                            <div>
                                                <span className="text-sm font-medium">{detail.name}</span>
                                                <span className="ml-2 text-gray-500">{formatCurrency(detail.amount)}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => handleEditMiscCostDetail(index)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveMiscCostDetail(index)}>
                                                    <X className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t pt-2">
                                    <span className="font-medium">Total:</span>
                                    <span className="font-bold">{formatCurrency(miscellaneousCost)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={closeMiscCostDialog}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={closeMiscCostDialog}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
