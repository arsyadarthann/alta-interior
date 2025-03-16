<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'role' => 'required|string|exists:roles,name',
            'branch_id' => 'nullable|numeric|exists:branches,id'
        ];
    }

    protected function updateRules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$this->route('id'),
            'role' => 'required|string|exists:roles,name',
            'branch_id' => 'nullable|numeric|exists:branches,id'
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'User name is required.',
            'email.required' => 'User email is required.',
            'email.unique' => 'User email is already taken.',
            'role.required' => 'User roles are required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
