<?php

namespace App\Http\Requests\Procurement;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseOrderRequest extends FormRequest
{
    public function rules(): array
    {
        if ($this->method() === 'PUT' || $this->method() === 'PATCH') {
            return $this->updateRules();
        }

        return $this->createRules();
    }

    protected function createRules(): array
    {
        return [
            'code' => 'required|string|max:255|unique:purchase_orders,code',
            'date' => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'expected_delivery_date' => 'required|date',
            'total_amount' => 'required|numeric|min:1',
            'tax_rate_id' => 'nullable|exists:tax_rates,id',
            'tax_amount' => 'required|numeric|min:0',
            'grand_total' => 'required|numeric|min:1',
            'purchase_order_details' => 'required|array|min:1',
            'purchase_order_details.*.item_id' => 'required|exists:items,id',
            'purchase_order_details.*.quantity' => 'required|numeric|min:1',
            'purchase_order_details.*.unit_price' => 'required|numeric|min:1',
            'purchase_order_details.*.total_price' => 'required|numeric|min:1',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'code' => 'required|string|max:255|unique:purchase_orders,code,' . $this->route('id'),
            'date' => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'expected_delivery_date' => 'required|date',
            'total_amount' => 'required|numeric|min:1',
            'tax_rate_id' => 'nullable|exists:tax_rates,id',
            'tax_amount' => 'required|numeric|min:0',
            'grand_total' => 'required|numeric|min:1',
            'purchase_order_details' => 'required|array|min:1',
            'purchase_order_details.*.id' => 'nullable|exists:purchase_order_details,id',
            'purchase_order_details.*.item_id' => 'required|exists:items,id',
            'purchase_order_details.*.quantity' => 'required|numeric|min:1',
            'purchase_order_details.*.unit_price' => 'required|numeric|min:1',
            'purchase_order_details.*.total_price' => 'required|numeric|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Purchase order code is required.',
            'code.unique' => 'Purchase order code is already taken.',
            'date.required' => 'Purchase order date is required.',
            'branch_id.required' => 'Purchase order branch is required.',
            'supplier_id.required' => 'Purchase order supplier is required.',
            'expected_delivery_date.required' => 'Purchase order expected delivery date is required.',
            'total_amount.required' => 'Purchase order total amount is required.',
            'tax_rate_id.exists' => 'Purchase order tax rate is invalid.',
            'tax_amount.required' => 'Purchase order tax amount is required.',
            'grand_total.required' => 'Purchase order grand total is required.',
            'purchase_order_details.required' => 'Purchase order details are required.',
            'purchase_order_details.*.item_id.required' => 'Purchase order details item is required.',
            'purchase_order_details.*.quantity.required' => 'Purchase order details quantity is required.',
            'purchase_order_details.*.unit_price.required' => 'Purchase order details unit price is required.',
            'purchase_order_details.*.total_price.required' => 'Purchase order details total price is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
