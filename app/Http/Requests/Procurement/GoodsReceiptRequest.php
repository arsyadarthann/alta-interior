<?php

namespace App\Http\Requests\Procurement;

use Illuminate\Foundation\Http\FormRequest;

class GoodsReceiptRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'code' => 'required|string|max:100|unique:goods_receipts,code',
            'date' => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'received_by' => 'required|string|max:100',
            'total_amount' => 'required|numeric',
            'miscellaneous_cost' => 'required|numeric',
            'tax_rate_id' => 'nullable|exists:tax_rates,id',
            'tax_amount' => 'required|numeric',
            'grand_total' => 'required|numeric',
            'goods_receipt_purchase_order' => 'required|array|min:1',
            'goods_receipt_purchase_order.*.purchase_order_id' => 'required|exists:purchase_orders,id',
            'goods_receipt_purchase_order.*.goods_receipt_details' => 'required|array',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.purchase_order_detail_id' => 'required|exists:purchase_order_details,id',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.received_quantity' => 'required|numeric|min:1',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.price_per_unit' => 'required|numeric|min:1',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.total_price' => 'required|numeric|min:1',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.miscellaneous_cost' => 'required|numeric|min:0',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.tax_amount' => 'required|numeric|min:0',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.total_amount' => 'required|numeric|min:1',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.cogs' => 'required|numeric',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Goods receipt code is required.',
            'date.required' => 'Goods receipt date is required.',
            'supplier_id.required' => 'Supplier is required.',
            'received_by.required' => 'Received by is required.',
            'total_amount.required' => 'Total amount is required.',
            'tax_rate_id.exists' => 'Tax rate is not found.',
            'tax_amount.required' => 'Tax amount is required.',
            'grand_total.required' => 'Grand total is required.',
            'goods_receipt_purchase_order.required' => 'Goods receipt purchase order is required.',
            'goods_receipt_purchase_order.*.purchase_order_id.required' => 'Goods receipt purchase order id is required.',
            'goods_receipt_purchase_order.*.goods_receipt_details.required' => 'Goods receipt purchase order details is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
