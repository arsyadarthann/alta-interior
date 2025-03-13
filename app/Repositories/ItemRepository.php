<?php

namespace App\Repositories;

use App\Interface\ItemInterface;
use App\Models\Item;
use App\Models\ItemBatch;
use Illuminate\Support\Facades\DB;

class ItemRepository implements ItemInterface
{
    public function __construct(private Item $item, private ItemBatch $itemBatch) {}

    public function getAll($branchId = null)
    {
        $query = $this->item->with(['itemCategory:id,name', 'itemUnit:id,name,abbreviation']);

        $query->selectRaw('items.*, COALESCE((
        SELECT SUM(stock)
        FROM item_batches
        WHERE item_batches.item_id = items.id' .
            ($branchId ? ' AND item_batches.branch_id = ' . $branchId : '') .
            '), 0) as stock');

        return $query->orderBy('id')->get();

    }

    public function getById(int $id)
    {
        return $this->item->with(['itemCategory:id,name', 'itemUnit:id,name,abbreviation'])->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->item->create([
                'name' => $data['name'],
                'code' => $data['code'],
                'item_category_id' => $data['item_category_id'],
                'item_unit_id' => $data['item_unit_id'],
                'price' => $data['price'],
            ]);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $item = $this->getById($id);
            $item->update([
                'name' => $data['name'],
                'code' => $data['code'],
                'item_category_id' => $data['item_category_id'],
                'item_unit_id' => $data['item_unit_id'],
                'price' => $data['price'],
            ]);
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $item = $this->getById($id);
            $item->delete();
        });
    }
}
