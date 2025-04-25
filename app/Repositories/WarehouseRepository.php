<?php

namespace App\Repositories;

use App\Interface\WarehouseInterface;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class WarehouseRepository implements WarehouseInterface
{
    public function __construct(private Warehouse $warehouse) {}

    public function getAll()
    {
        return $this->warehouse->orderByDesc('id')->get();
    }

    public function getById(int $id)
    {
        return $this->warehouse->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->warehouse->create([
                'name' => $data['name'],
                'description' => $data['description'],
            ]);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $warehouse = $this->getById($id);
            $warehouse->update([
                'name' => $data['name'],
                'description' => $data['description'],
            ]);
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $warehouse = $this->getById($id);
            $warehouse->delete();
        });
    }
}
