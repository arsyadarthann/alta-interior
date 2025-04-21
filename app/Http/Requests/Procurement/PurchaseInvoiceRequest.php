<?php

namespace App\Http\Requests\Procurement;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseInvoiceRequest extends FormRequest
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
            'code' => 'required|string|max:100|unique:purchase_invoices,code',
            'date' => 'required|date',
            'due_date' => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'total_amount' => 'required|numeric|min:1',
            'miscellaneous_cost' => 'required|numeric|min:0',
            'tax_amount' => 'required|numeric|min:0',
            'grand_total' => 'required|numeric|min:1',
            'purchase_invoice_goods_receipt' => 'required|array|min:1',
            'purchase_invoice_goods_receipt.*.goods_receipt_id' => 'required|exists:goods_receipts,id',
            'purchase_invoice_goods_receipt.*.purchase_invoice_details' => 'required|array',
            'purchase_invoice_goods_receipt.*.purchase_invoice_details.*.goods_receipt_detail_id' => 'required|exists:goods_receipt_details,id',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'code' => 'required|string|max:100|unique:purchase_invoices,code,' . $this->route('id'),
            'date' => 'required|date',
            'due_date' => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'total_amount' => 'required|numeric|min:1',
            'miscellaneous_cost' => 'required|numeric|min:0',
            'tax_amount' => 'required|numeric|min:0',
            'grand_total' => 'required|numeric|min:1',
            'purchase_invoice_goods_receipt' => 'required|array|min:1',
            'purchase_invoice_goods_receipt.*.goods_receipt_id' => 'required|exists:goods_receipts,id',
            'purchase_invoice_goods_receipt.*.purchase_invoice_details' => 'required|array',
            'purchase_invoice_goods_receipt.*.purchase_invoice_details.*.goods_receipt_detail_id' => 'required|exists:goods_receipt_details,id',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Purchase invoices code is required.',
            'code.unique' => 'Purchase invoices code is already taken.',
            'date.required' => 'Purchase invoices date is required.',
            'due_date.required' => 'Purchase invoices due date is required.',
            'supplier_id.required' => 'Purchase invoices supplier is required.',
            'total_amount.required' => 'Purchase invoices total amount is required.',
            'tax_rate_id.exists' => 'Purchase invoices tax rate is invalid.',
            'tax_amount.required' => 'Purchase invoices tax amount is required.',
            'grand_total.required' => 'Purchase invoices grand total is required.',
            'purchase_invoice_goods_receipt.required' => 'Purchase invoices goods receipt is required.',
            'purchase_invoice_goods_receipt.*.goods_receipt_id.required' => 'Purchase invoices goods receipt is required.',
            'purchase_invoice_goods_receipt.*.purchase_invoice_details.required' => 'Purchase invoices details are required.',
            'purchase_invoice_goods_receipt.*.purchase_invoice_details.*.goods_receipt_detail_id.required' => 'Purchase invoices details are required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
