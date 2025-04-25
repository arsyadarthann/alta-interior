<?php

namespace App\Http\Requests\Stock;

use Illuminate\Foundation\Http\FormRequest;

class StockAdjustmentRequest extends FormRequest
{
    protected function prepareForValidation()
    {
        $data = $this->all();

        if (isset($data['stock_adjustment_details']) && is_array($data['stock_adjustment_details'])) {
            foreach ($data['stock_adjustment_details'] as $key => $detail) {
                if (isset($detail['adjustment_quantity'])) {
                    $data['stock_adjustment_details'][$key]['adjustment_quantity'] = abs($detail['adjustment_quantity']);
                }
            }
        }

        $this->replace($data);
    }

    public function rules(): array
    {
        return [
            'code' => 'required|string|max:255|unique:stock_adjustments,code',
            'date' => 'required|date',
            'source_able_id' => 'required|numeric',
            'source_able_type' => 'required|string',
            'stock_adjustment_details' => 'required|array',
            'stock_adjustment_details.*.item_id' => 'required|exists:items,id',
            'stock_adjustment_details.*.type' => 'required|in:increased,decreased,balanced',
            'stock_adjustment_details.*.before_adjustment_quantity' => 'required|numeric',
            'stock_adjustment_details.*.adjustment_quantity' => 'required|numeric',
            'stock_adjustment_details.*.after_adjustment_quantity' => 'required|numeric',
            'stock_adjustment_details.*.reason' => 'nullable|string'
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Stock adjustment code is required.',
            'code.unique' => 'Stock adjustment code is already taken.',
            'date.required' => 'Date is required.',
            'source_able_id.required' => 'Source is required.',
            'source_able_type.required' => 'Source is required.',
            'stock_adjustment_details.*.item_id.required' => 'Item is required.',
            'stock_adjustment_details.*.type.required' => 'Type is required.',
            'stock_adjustment_details.*.before_adjustment_quantity.required' => 'Before adjustment quantity is required.',
            'stock_adjustment_details.*.adjustment_quantity.required' => 'Adjustment quantity is required.',
            'stock_adjustment_details.*.after_adjustment_quantity.required' => 'After adjustment quantity is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
