<?php

namespace App\Repositories;

use App\Interface\ItemCategoryInterface;
use App\Models\ItemCategory;
use Illuminate\Support\Facades\DB;

class ItemCategoryRepository implements ItemCategoryInterface
{
    public function __construct(private ItemCategory $itemCategory) {}

    public function getAll()
    {
        return $this->itemCategory->orderBy('id')->get();
    }

    public function getById(int $id)
    {
        return $this->itemCategory->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->itemCategory->create([
                'name' => $data['name'],
            ]);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $itemCategory = $this->getById($id);
            $itemCategory->update([
                'name' => $data['name'],
            ]);
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $itemCategory = $this->getById($id);
            $itemCategory->delete();
        });
    }
}
