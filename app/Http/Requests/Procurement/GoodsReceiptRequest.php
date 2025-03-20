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
            'goods_receipt_purchase_order' => 'required|array|min:1',
            'goods_receipt_purchase_order.*.purchase_order_id' => 'required|exists:purchase_orders,id',
            'goods_receipt_purchase_order.*.goods_receipt_details' => 'required|array',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.purchase_order_detail_id' => 'required|exists:purchase_order_details,id',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.received_quantity' => 'required|numeric|min:1',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.price_per_unit' => 'required|numeric|min:1',
            'goods_receipt_purchase_order.*.goods_receipt_details.*.total_price' => 'required|numeric|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Goods receipt code is required.',
            'date.required' => 'Goods receipt date is required.',
            'supplier_id.required' => 'Supplier is required.',
            'received_by.required' => 'Received by is required.',
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
