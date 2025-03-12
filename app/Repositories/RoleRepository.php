<?php

namespace App\Repositories;

use App\Interface\RoleInterface;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleRepository implements RoleInterface
{
    public function __construct(private Role $role) {}

    public function getAll()
    {
        return $this->role->all();
    }

    public function getById(int $id)
    {
        return $this->role->with('permissions')->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $role = $this->role->create([
                'name' => $data['name'],
            ]);

            foreach ($data['permissions'] as $permission) {
                $role->givePermissionTo($permission);
            }
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $role = $this->getById($id);

            $role->update([
                'name' => $data['name'],
            ]);

            $role->syncPermissions($data['permissions']);
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $this->getById($id)->delete();

        });
    }
}
