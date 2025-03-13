<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class ItemRequest extends FormRequest
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
            'name' => 'required|string|max:255|unique:items,name,NULL,id,deleted_at,NULL',
            'code' => 'required|string|max:10|unique:items,code,NULL,id,deleted_at,NULL',
            'item_category_id' => 'required|exists:item_categories,id',
            'item_unit_id' => 'required|exists:item_units,id',
            'price' => 'required|numeric',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:items,name,' . $this->route('id') . ',id,deleted_at,NULL',
            'code' => 'required|string|max:10|unique:items,code,' . $this->route('id') . ',id,deleted_at,NULL',
            'item_category_id' => 'required|exists:item_categories,id',
            'item_unit_id' => 'required|exists:item_units,id',
            'price' => 'required|numeric',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Item name is required.',
            'name.unique' => 'Item name is already taken.',
            'code.required' => 'Item code is required.',
            'code.unique' => 'Item code is already taken.',
            'item_category_id.required' => 'Item category is required.',
            'item_category_id.exists' => 'Item category is invalid.',
            'item_unit_id.required' => 'Item unit is required.',
            'item_unit_id.exists' => 'Item unit is invalid.',
            'price.required' => 'Item price is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
