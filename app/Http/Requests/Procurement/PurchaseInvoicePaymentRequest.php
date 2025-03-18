<?php

namespace App\Http\Requests\Procurement;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseInvoicePaymentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'code' => 'required|string|max:100|unique:purchase_invoices,code',
            'date' => 'required|date',
            'purchase_invoice_id' => 'required|integer|exists:purchase_invoices,id',
            'payment_method_id' => 'required|integer|exists:payment_methods,id',
            'amount' => 'required|numeric'
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Purchase Invoice Payment Code is required.',
            'code.string' => 'Purchase Invoice Payment Code must be a string.',
            'code.unique' => 'Purchase Invoice Payment Code already exists.',
            'date.required' => 'Purchase Invoice Payment Date is required.',
            'date.date' => 'Purchase Invoice Payment Date must be a date.',
            'purchase_invoice_id.required' => 'Purchase Invoice ID is required.',
            'payment_method_id.required' => 'Purchase Invoice Payment Method is required.',
            'payment_method_id.exists' => 'Purchase Invoice Payment Method does not exist.',
            'amount.required' => 'Purchase Invoice Payment Amount is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
