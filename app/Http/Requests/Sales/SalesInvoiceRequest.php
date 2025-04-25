<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class SalesInvoiceRequest extends FormRequest
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
            'code' => 'required|string|max:100|unique:sales_invoices,code',
            'date' => 'required|date',
            'due_date' => 'required|date',
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'total_amount' => 'required|numeric',
            'discount_type' => 'required|in:percentage,amount',
            'discount_percentage' => 'required_if:discount_type,percentage|numeric|between:0,100',
            'discount_amount' => 'required|numeric',
            'tax_rate_id' => 'nullable|exists:tax_rates,id',
            'tax_amount' => 'required|numeric',
            'grand_total' => 'required|numeric',
            'sales_invoice_details' => 'required|array',
            'sales_invoice_details.*.waybill_id' => 'required|exists:waybills,id',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'code' => 'required|string|max:100|unique:sales_invoices,code,' . $this->route('id'),
            'date' => 'required|date',
            'due_date' => 'required|date',
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'total_amount' => 'required|numeric',
            'discount_type' => 'required|in:percentage,amount',
            'discount_percentage' => 'required_if:discount_type,percentage|numeric|between:0,100',
            'discount_amount' => 'required|numeric',
            'tax_rate_id' => 'nullable|exists:tax_rates,id',
            'tax_amount' => 'required|numeric',
            'grand_total' => 'required|numeric',
            'sales_invoice_details' => 'required|array',
            'sales_invoice_details.*.waybill_id' => 'required|exists:waybills,id',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
