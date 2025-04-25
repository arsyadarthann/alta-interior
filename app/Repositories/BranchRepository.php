<?php

namespace App\Repositories;

use App\Interface\BranchInterface;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;

class BranchRepository implements BranchInterface
{
    public function __construct(private Branch $branch) {}

    public function getAll()
    {
        return $this->branch->orderBy('id')->get();
    }

    public function getById(int $id)
    {
        return $this->branch->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->branch->create([
                'name' => $data['name'],
                'initial' => $data['initial'],
                'contact' => $data['contact'],
                'address' => $data['address'],
            ]);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $branch = $this->getById($id);
            $branch->update([
                'name' => $data['name'],
                'initial' => $data['initial'],
                'contact' => $data['contact'],
                'address' => $data['address'],
            ]);
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $branch = $this->getById($id);
            $branch->delete();
        });
    }
}
