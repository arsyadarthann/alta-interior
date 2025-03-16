<?php

namespace App\Http\Requests\Stock;

use Illuminate\Foundation\Http\FormRequest;

class StockTransferRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'code' => 'required|string|max:255|unique:stock_transfers,code',
            'date' => 'required|date',
            'source_able_id' => 'required|numeric',
            'source_able_type' => 'required|string',
            'destination_able_id' => 'required|numeric',
            'destination_able_type' => 'required|string',
            'stock_transfer_details' => 'required|array',
            'stock_transfer_details.*.item_id' => 'required|exists:items,id',
            'stock_transfer_details.*.quantity' => 'required|numeric',
            'stock_transfer_details.*.source_before_quantity' => 'required|numeric',
            'stock_transfer_details.*.destination_before_quantity' => 'required|numeric',
            'stock_transfer_details.*.source_after_quantity' => 'required|numeric',
            'stock_transfer_details.*.destination_after_quantity' => 'required|numeric',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Stock transfer code is required.',
            'code.unique' => 'Stock transfer code is already taken.',
            'date.required' => 'Stock transfer date is required.',
            'source_able_id.required' => 'Source is required.',
            'source_able_type.required' => 'Source is required.',
            'destination_able_id.required' => 'Destination is required.',
            'destination_able_type.required' => 'Destination is required.',
            'stock_transfer_details.required' => 'Stock transfer details are required.',
            'stock_transfer_details.*.item_id.required' => 'Item is required.',
            'stock_transfer_details.*.item_id.exists' => 'Item is invalid.',
            'stock_transfer_details.*.quantity.required' => 'Quantity is required.',
            'stock_transfer_details.*.source_before_quantity.required' => 'Source before quantity is required.',
            'stock_transfer_details.*.destination_before_quantity.required' => 'Destination before quantity is required.',
            'stock_transfer_details.*.source_after_quantity.required' => 'Source after quantity is required.',
            'stock_transfer_details.*.destination_after_quantity.required' => 'Destination after quantity is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
