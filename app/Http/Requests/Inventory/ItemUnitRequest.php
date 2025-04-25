<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class ItemUnitRequest extends FormRequest
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
            'name' => 'required|string|max:255|unique:item_units,name,NULL,id,deleted_at,NULL',
            'abbreviation' => 'required|string|max:255|unique:item_units,abbreviation,NULL,id,deleted_at,NULL',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:item_units,name,' . $this->route('id') . ',id,deleted_at,NULL',
            'abbreviation' => 'required|string|max:255|unique:item_units,abbreviation,' . $this->route('id') . ',id,deleted_at,NULL',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Item unit name is required.',
            'name.unique' => 'Item unit name is already taken.',
            'abbreviation.required' => 'Item unit abbreviation is required.',
            'abbreviation.unique' => 'Item unit abbreviation is already taken.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
