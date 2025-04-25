<?php

namespace App\Repositories;

use App\Interface\UserInterface;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserRepository implements UserInterface
{
    public function __construct(private User $user) {}

    public function getAll()
    {
        return $this->user->with(['roles', 'branch:id,name'])->orderBy('id')->get();
    }

    public function getById(int $id)
    {
        return $this->user->with(['roles', 'branch:id,name'])->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $user = $this->user->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => bcrypt('password'),
                'branch_id' => $data['branch_id'] ?? null
            ]);

            $user->assignRole($data['role']);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $user = $this->getById($id);

            $user->update([
                'name' => $data['name'],
                'email' => $data['email'],
                'branch_id' => $data['branch_id'] ?? null,
            ]);

            $user->syncRoles($data['role']);
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $user = $this->getById($id);
            $user->delete();
        });
    }

    public function resetPassword(int $id)
    {
        return DB::transaction(function () use ($id) {
            $user = $this->getById($id);
            $user->update([
                'password' => bcrypt('password'),
            ]);
        });
    }
}
