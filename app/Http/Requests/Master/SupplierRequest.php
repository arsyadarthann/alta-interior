<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SupplierRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:suppliers,email',
            'phone' => 'required|string|max:255',
            'address' => 'required|string|max:255',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('suppliers', 'email')->ignore($this->id)],
            'phone' => 'required|string|max:255',
            'address' => 'required|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Supplier name is required.',
            'contact_name.required' => 'Supplier contact name is required.',
            'email.required' => 'Supplier email is required.',
            'email.unique' => 'Supplier email is already taken.',
            'phone.required' => 'Supplier phone is required.',
            'address.required' => 'Supplier address is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
