<?php

namespace App\Repositories;

use App\Interface\ItemUnitInterface;
use App\Models\ItemUnit;
use Illuminate\Support\Facades\DB;

class ItemUnitRepository implements ItemUnitInterface
{
    public function __construct(private ItemUnit $itemUnit) {}

    public function getAll()
    {
        return $this->itemUnit->orderBy('id')->get();
    }

    public function getById(int $id)
    {
        return $this->itemUnit->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->itemUnit->create([
                'name' => $data['name'],
                'abbreviation' => $data['abbreviation'],
            ]);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $itemUnit = $this->getById($id);
            $itemUnit->update([
                'name' => $data['name'],
                'abbreviation' => $data['abbreviation'],
            ]);
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $itemUnit = $this->getById($id);
            $itemUnit->delete();
        });
    }
}
