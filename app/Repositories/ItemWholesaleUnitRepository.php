<?php

namespace App\Repositories;

use App\Interface\ItemWholesaleUnitInterface;
use App\Models\ItemWholesaleUnit;
use Illuminate\Support\Facades\DB;

class ItemWholesaleUnitRepository implements ItemWholesaleUnitInterface
{
    public function __construct(private ItemWholesaleUnit $itemUnit) {}

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
