<?php

namespace App\Http\Requests\Expense;

use Illuminate\Foundation\Http\FormRequest;

class ExpenseRequest extends FormRequest
{
    public function rules(): array
    {
        if ($this->method() === 'PUT' || $this->method() === 'PATCH') {
            return $this->updateRules();
        }
        return $this->createRules();
    }

    private function createRules(): array
    {
        return [
            'code' => 'required|string|max:100|unique:expenses,code',
            'date' => 'required|date',
            'source_able_id' => 'required|numeric',
            'source_able_type' => 'required|string',
            'total_amount' => 'required|numeric',
            'expense_details' => 'required|array',
            'expense_details.*.name' => 'required|string|max:255',
            'expense_details.*.amount' => 'required|numeric',
        ];
    }

    private function updateRules(): array
    {
        return [
            'code' => 'required|string|max:100|unique:expenses,code,' . $this->route('id'),
            'date' => 'required|date',
            'source_able_id' => 'required|numeric',
            'source_able_type' => 'required|string',
            'total_amount' => 'required|numeric',
            'expense_details' => 'required|array',
            'expense_details.*.id' => 'nullable|exists:expense_details,id',
            'expense_details.*.name' => 'required|string|max:255',
            'expense_details.*.amount' => 'required|numeric',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Expense code is required.',
            'code.unique' => 'Expense code is already taken.',
            'date.required' => 'Expense date is required.',
            'total_amount.required' => 'Expense total amount is required.',
            'expense_details.required' => 'Expense details are required.',
            'expense_details.*.name.required' => 'Expense detail name is required.',
            'expense_details.*.amount.required' => 'Expense detail amount is required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
