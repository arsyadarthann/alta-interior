<?php

namespace App\Http\Requests\Stock;

use Illuminate\Foundation\Http\FormRequest;

class StockAuditRequest extends FormRequest
{
    protected function prepareForValidation()
    {
        $data = $this->all();

        if (isset($data['stock_audit_details']) && is_array($data['stock_audit_details'])) {
            foreach ($data['stock_audit_details'] as $key => $detail) {
                if (isset($detail['discrepancy_quantity'])) {
                    $data['stock_audit_details'][$key]['discrepancy_quantity'] = abs($detail['discrepancy_quantity']);
                }
            }
        }

        $this->replace($data);
    }

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
            'code' => 'required|string|max:255|unique:stock_audits,code',
            'date' => 'required|date',
            'source_able_id' => 'required|numeric',
            'source_able_type' => 'required|string',
            'stock_audit_details' => 'required|array|min:1',
            'stock_audit_details.*.item_id' => 'required|exists:items,id',
            'stock_audit_details.*.system_quantity' => 'required|numeric',
            'stock_audit_details.*.physical_quantity' => 'required|numeric',
            'stock_audit_details.*.discrepancy_quantity' => 'required|numeric',
            'stock_audit_details.*.reason' => 'nullable|string',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'code' => 'required|string|max:255|unique:stock_audits,code,' . $this->route('id'),
            'date' => 'required|date',
            'source_able_id' => 'required|numeric',
            'source_able_type' => 'required|string',
            'stock_audit_details' => 'required|array|min:1',
            'stock_audit_details.*.id' => 'nullable|exists:stock_audit_details,id',
            'stock_audit_details.*.item_id' => 'required|exists:items,id',
            'stock_audit_details.*.system_quantity' => 'required|numeric',
            'stock_audit_details.*.physical_quantity' => 'required|numeric',
            'stock_audit_details.*.discrepancy_quantity' => 'required|numeric',
            'stock_audit_details.*.reason' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Stock audit code is required.',
            'code.unique' => 'Stock audit code is already taken.',
            'date.required' => 'Stock audit date is required.',
            'source_able_id' => 'Stock audit source is required.',
            'source_able_type' => 'Stock audit source is required.',
            'stock_audit_details.required' => 'Stock audit details is required.',
            'stock_audit_details.min' => 'Stock audit details is required.',
            'stock_audit_details.*.item_id.required' => 'Stock audit item is required.',
            'stock_audit_details.*.system_quantity.required' => 'Stock audit system quantity is required.',
            'stock_audit_details.*.physical_quantity.required' => 'Stock audit physical quantity is required.',
            'stock_audit_details.*.discrepancy_quantity.required' => 'Stock audit discrepancy quantity is required.',
            'stock_audit_details.*.item_id.exists' => 'Stock audit item is invalid.'
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
