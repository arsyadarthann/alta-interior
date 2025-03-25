<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class SalesInvoicePaymentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'code' => 'required|string|max:100|unique:sales_invoice_payments,code',
            'date' => 'required|date',
            'sales_invoice_id' => 'required|exists:sales_invoices,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'amount' => 'required|numeric',
            'note' => 'nullable|string'
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Sales Invoice Payment Code is required.',
            'code.string' => 'Sales Invoice Payment Code must be a string.',
            'code.unique' => 'Sales Invoice Payment Code already exists.',
            'date.required' => 'Sales Invoice Payment Date is required.',
            'date.date' => 'Sales Invoice Payment Date must be a date.',
            'sales_invoice_id.required' => 'Sales Invoice is required.',
            'sales_invoice_id.exists' => 'Sales Invoice does not exist.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
