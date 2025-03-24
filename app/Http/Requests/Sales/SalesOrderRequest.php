<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class SalesOrderRequest extends FormRequest
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
            'code' => 'required|string|unique:sales_orders,code',
            'date' => 'required|date',
            'branch_id' => 'required|exists:branches,id',
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:100',
            'total_amount' => 'required|numeric',
            'tax_rate_id' => 'nullable|exists:tax_rates,id',
            'tax_amount' => 'required|numeric',
            'grand_total' => 'required|numeric',
            'sales_order_details' => 'required|array',
            'sales_order_details.*.item_id' => 'required|exists:items,id',
            'sales_order_details.*.item_source_able_id' => 'required|numeric',
            'sales_order_details.*.item_source_able_type' => 'required|string',
            'sales_order_details.*.quantity' => 'required|numeric',
            'sales_order_details.*.unit_price' => 'required|numeric',
            'sales_order_details.*.total_price' => 'required|numeric',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'code' => 'required|string|unique:sales_orders,code,' . $this->route('id'),
            'date' => 'required|date',
            'branch_id' => 'required|exists:branches,id',
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:100',
            'total_amount' => 'required|numeric',
            'tax_rate_id' => 'nullable|exists:tax_rates,id',
            'tax_amount' => 'required|numeric',
            'grand_total' => 'required|numeric',
            'sales_order_details' => 'required|array',
            'sales_order_details.*.item_id' => 'required|exists:items,id',
            'sales_order_details.*.item_source_able_id' => 'required|numeric',
            'sales_order_details.*.item_source_able_type' => 'required|string',
            'sales_order_details.*.quantity' => 'required|numeric',
            'sales_order_details.*.unit_price' => 'required|numeric',
            'sales_order_details.*.total_price' => 'required|numeric',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Sales order code is required.',
            'code.unique' => 'Sales order code is already taken.',
            'date.required' => 'Sales order date is required.',
            'branch_id.required' => 'Branch is required.',
            'customer_id.exists' => 'Customer is not found.',
            'customer_name.string' => 'Customer name must be a string.',
            'customer_name.max' => 'Customer name must not be greater than 100 characters.',
            'total_amount.required' => 'Total amount is required.',
            'tax_rate_id.exists' => 'Tax rate is not found.',
            'tax_amount.required' => 'Tax amount is required.',
            'grand_total.required' => 'Grand total is required.',
            'sales_order_details.required' => 'Sales order details is required.',
            'sales_order_details.*.item_id.required' => 'Item is required.',
            'sales_order_details.*.item_source_able_id.required' => 'Item source is required.',
            'sales_order_details.*.item_source_able_type.required' => 'Item source type is required.',
            'sales_order_details.*.quantity.required' => 'Quantity is required.',
            'sales_order_details.*.unit_price.required' => 'Unit price is required.',
            'sales_order_details.*.total_price.required' => 'Total price is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
