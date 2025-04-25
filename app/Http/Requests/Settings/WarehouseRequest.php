<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class WarehouseRequest extends FormRequest
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
            'name' => 'required|string|max:100|unique:warehouses,name',
            'description' => 'nullable|string|max:255',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'name' => 'required|string|max:100|unique:warehouses,name,' . $this->route('id'),
            'description' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Warehouse name is required.',
            'name.unique' => 'Warehouse name is already taken.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
