<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class CustomerRequest extends FormRequest
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
            'phone' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255',
            'address' => 'required|string|max:255',
            'customer_prices' => 'nullable|array',
            'customer_prices.*.item_id' => 'required|exists:items,id',
            'customer_prices.*.price' => 'required|numeric',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255',
            'address' => 'required|string|max:255',
            'customer_prices' => 'nullable|array',
            'customer_prices.*.id' => 'nullable|exists:customer_prices,id',
            'customer_prices.*.item_id' => 'required|exists:items,id',
            'customer_prices.*.price' => 'required|numeric',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Customer name is required.',
            'contact_name.required' => 'Customer contact name is required.',
            'phone.required' => 'Customer phone is required.',
            'address.required' => 'Customer address is required.',
            'customer_prices.*.item_id.required' => 'Customer price item is required.',
            'customer_prices.*.price.required' => 'Customer price is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
