<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class WaybillRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'code' => 'required|string|max:100|unique:waybills,code',
            'date' => 'required|date',
            'sales_order_id' => 'required|exists:sales_orders,id',
            'waybill_details' => 'required|array',
            'waybill_details.*.sales_order_detail_id' => 'required|exists:sales_order_details,id',
            'waybill_details.*.quantity' => 'required|numeric',
            'waybill_details.*.description' => 'nullable|string'
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Waybill Code is required.',
            'code.string' => 'Waybill Code must be a string.',
            'code.unique' => 'Waybill Code already exists.',
            'date.required' => 'Waybill Date is required.',
            'date.date' => 'Waybill Date must be a date.',
            'sales_order_id.required' => 'Sales Order is required.',
            'sales_order_id.exists' => 'Sales Order does not exist.',
            'waybill_details.required' => 'Waybill Details is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
