<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class TransactionPrefixRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'prefixes' => 'required|array',
            'prefixes.*.id' => 'required|exists:transaction_prefixes,id',
            'prefixes.*.prefix_code' => 'required|string|max:10',
        ];
    }

    public function messages(): array
    {
        return [
            'prefixes.required' => 'Transaction prefixes are required.',
            'prefixes.*.id.required' => 'Transaction prefix id is required.',
            'prefixes.*.prefix_code.required' => 'Transaction prefix code is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
