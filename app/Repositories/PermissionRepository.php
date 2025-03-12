<?php

namespace App\Repositories;

use App\Interface\PermissionInterface;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

class PermissionRepository implements PermissionInterface
{
    public function __construct(private Permission $permission) {}

    public function getAll()
    {
        return $this->permission->orderByDesc('id')->get();
    }

    public function getById(int $id)
    {
        return $this->permission->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->permission->create([
                'name' => $data['name']
            ]);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $permission = $this->getById($id);

            $permission->update([
                'name' => $data['name']
            ]);
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $permission = $this->getById($id);
            $permission->delete();
        });
    }
}
