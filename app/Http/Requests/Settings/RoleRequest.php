<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class RoleRequest extends FormRequest
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
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'required|array|min:1',
        ];
    }

    protected function updateRules(): array
    {
        return [
            'name' => 'required|string|max:255|unique:roles,name,' . $this->route('id'),
            'permissions' => 'required|array|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Role name is required.',
            'name.unique' => 'Role name is already taken.',
            'permissions.required' => 'Role permissions are required.',
        ];
    }

    public function authorize(): bool
    {
        return true;
    }
}
