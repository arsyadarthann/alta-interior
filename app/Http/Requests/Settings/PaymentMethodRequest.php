<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class PaymentMethodRequest extends FormRequest
{
    public function rules()
    {
        if ($this->method() === 'PUT' || $this->method() === 'PATCH') {
            return $this->updateRules();
        }

        return $this->createRules();
    }

    protected function createRules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:payment_methods,name,NULL,id,deleted_at,NULL',
            'charge_percentage' => 'required|numeric|min:0|max:100'
        ];
    }

    protected function updateRules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:payment_methods,name,' . $this->route('id') . ',id,deleted_at,NULL',
            'charge_percentage' => 'required|numeric|min:0|max:100'
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Payment method name is required.',
            'name.unique' => 'Payment method name is already taken.',
            'charge_percentage.required' => 'Charge percentage is required.',
            'charge_percentage.numeric' => 'Charge percentage must be a number.',
        ];
    }

    public function authorize()
    {
        return true;
    }
}
