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
            'from_branch_id' => 'required|exists:branches,id',
            'to_branch_id' => 'required|exists:branches,id',
            'stock_transfer_details' => 'required|array',
            'stock_transfer_details.*.item_id' => 'required|exists:items,id',
            'stock_transfer_details.*.quantity' => 'required|numeric',
            'stock_transfer_details.*.from_branch_before_quantity' => 'required|numeric',
            'stock_transfer_details.*.to_branch_before_quantity' => 'required|numeric',
            'stock_transfer_details.*.from_branch_after_quantity' => 'required|numeric',
            'stock_transfer_details.*.to_branch_after_quantity' => 'required|numeric',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Stock transfer code is required.',
            'code.unique' => 'Stock transfer code is already taken.',
            'date.required' => 'Stock transfer date is required.',
            'from_branch_id.required' => 'From branch is required.',
            'from_branch_id.exists' => 'From branch is invalid.',
            'to_branch_id.required' => 'To branch is required.',
            'to_branch_id.exists' => 'To branch is invalid.',
            'stock_transfer_details.required' => 'Stock transfer details are required.',
            'stock_transfer_details.*.item_id.required' => 'Item is required.',
            'stock_transfer_details.*.item_id.exists' => 'Item is invalid.',
            'stock_transfer_details.*.quantity.required' => 'Quantity is required.',
            'stock_transfer_details.*.from_branch_before_quantity.required' => 'From branch before quantity is required.',
            'stock_transfer_details.*.to_branch_before_quantity.required' => 'To branch before quantity is required.',
            'stock_transfer_details.*.from_branch_after_quantity.required' => 'From branch after quantity is required.',
            'stock_transfer_details.*.to_branch_after_quantity.required' => 'To branch after quantity is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
