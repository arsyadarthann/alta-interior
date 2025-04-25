<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class BranchRequest extends FormRequest
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
            'name' => 'required|string|max:100|unique:branches,name,NULL,id,deleted_at,NULL',
            'initial' => 'required|string|max:100|unique:branches,initial,NULL,id,deleted_at,NULL',
            'contact' => 'required|string|max:100',
            'address' => 'required|string|max:255',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'name' => 'required|string|max:100|unique:branches,name,' . $this->route('id') . ',id,deleted_at,NULL',
            'initial' => 'required|string|max:100|unique:branches,initial,' . $this->route('id') . ',id,deleted_at,NULL',
            'contact' => 'required|string|max:100',
            'address' => 'required|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Branch name is required.',
            'name.unique' => 'Branch name is already taken.',
            'initial.required' => 'Branch initial is required.',
            'initial.unique' => 'Branch initial is already taken.',
            'contact.required' => 'Branch contact is required.',
            'address.required' => 'Branch address is required.',
        ];
    }

    public function authorize()
    {
        return true;
    }
}
