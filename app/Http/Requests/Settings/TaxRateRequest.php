<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class TaxRateRequest extends FormRequest
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
            'rate' => 'required|numeric|min:0|max:100|unique:tax_rates,rate,NULL,id,deleted_at,NULL',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'rate' => 'required|numeric|min:0|max:100|unique:tax_rates,rate,' . $this->route('id') . ',id,deleted_at,NULL',
        ];
    }

    public function authorize()
    {
        return true;
    }
}
