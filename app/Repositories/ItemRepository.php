<?php

namespace App\Repositories;

use App\Helpers\SKUCode;
use App\Interface\ItemInterface;
use App\Models\Item;
use App\Models\ItemBatch;
use App\Models\StockAdjustmentDetail;
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

    public function sumStock(int $itemId, int $branchId)
    {
        return $this->itemBatch
            ->where('item_id', $itemId)
            ->where('branch_id', $branchId)
            ->sum('stock');
    }

    public function getBatch(int $itemId, int $branchId, bool $withWhereStockGreaterThanZero = true)
    {
        return $this->itemBatch->with([
                'branch:id,name', 'item.itemCategory', 'item.itemUnit'
            ])
            ->where('item_id', $itemId)
            ->where('branch_id', $branchId)
            ->when($withWhereStockGreaterThanZero, fn($query) => $query->where('stock', '>', 0))
            ->orderBy('received_at')
            ->get();
    }

    public function addBatch(array $data)
    {
        return DB::transaction(function () use ($data) {
            $newBatch = $this->itemBatch->create([
                'sku' => $data['sku'],
                'branch_id' => $data['branch_id'],
                'item_id' => $data['item_id'],
                'received_at' => now(),
                'cogs' => $data['cogs'],
                'stock' => $data['stock'],
            ]);

            return $newBatch;
        });
    }

    public function reduceBatch(int $itemId, int $branchId, float $usedQuantity)
    {
        return DB::transaction(function () use ($itemId, $branchId, $usedQuantity) {
            $usedStock = $usedQuantity;

            $batchDetails = [];

            $batches = $this->getBatch($itemId, $branchId);

            foreach ($batches as $batch) {
                $previousQty = $this->sumStock($itemId, $branchId);

                if ($usedStock <= 0) {
                    break;
                }

                $deduction = min($usedStock, $batch->stock);

                $batchDetails[] = [
                    'item_batch_id' => $batch->id,
                    'data_quantity' => [
                        'previous_quantity' => $previousQty,
                        'movement_quantity' => $deduction,
                        'after_quantity' => $previousQty - $deduction,
                    ]
                ];

                $batch->stock -= $deduction;
                $usedStock -= $deduction;
                $batch->save();
            }

            return $batchDetails;
        });
    }

    public function adjustBatch(int $itemId, int $branchId, string $adjustmentType, float $adjustmentQuantity)
    {
        return DB::transaction(function () use ($itemId, $branchId, $adjustmentType, $adjustmentQuantity) {
            $adjustmentStock = $adjustmentQuantity;

            $batchDetails = [];

            $batches = $this->getBatch($itemId, $branchId);

            if ($batches->isNotEmpty()) {
                foreach ($batches as $batch) {
                    if ($adjustmentStock <= 0) {
                        break;
                    }

                    $batchDetails[] = $this->processBatchAdjustment($batch, $adjustmentType, $adjustmentStock);

                    $adjustmentStock -= in_array($adjustmentType, [StockAdjustmentDetail::TYPE_INCREASED, StockAdjustmentDetail::TYPE_BALANCED]) ? $adjustmentStock : min($adjustmentStock, $batch->stock);
                }
            } else {
                if ($adjustmentType === StockAdjustmentDetail::TYPE_DECREASED) {
                    throw new \Exception('Cannot decrease stock: no batches exist for this item in this branch.');
                } else {
                    $newBatch = $this->addBatch([
                        'sku' => SKUCode::generateSKU($itemId, $branchId),
                        'branch_id' => $branchId,
                        'item_id' => $itemId,
                        'cogs' => 0,
                        'stock' => $adjustmentQuantity,
                    ]);

                    $batchDetails[] = [
                        'item_batch_id' => $newBatch->id,
                        'data_quantity' => [
                            'previous_quantity' => 0,
                            'movement_quantity' => $adjustmentQuantity,
                            'after_quantity' => $adjustmentQuantity,
                        ]
                    ];
                }
            }

            return $batchDetails;
        });
    }

    private function processBatchAdjustment($batch, $adjustmentType, $adjustmentStock): array
    {
        $previousQuantity = $this->sumStock($batch->item_id, $batch->branch_id);

        $movementQuantity = match ($adjustmentType) {
            StockAdjustmentDetail::TYPE_DECREASED => min($adjustmentStock, $batch->stock),
            default => $adjustmentStock,
        };

        $batch->stock = match ($adjustmentType) {
            StockAdjustmentDetail::TYPE_INCREASED => $batch->stock + $movementQuantity,
            StockAdjustmentDetail::TYPE_DECREASED => $batch->stock - $movementQuantity,
            default => $batch->stock,
        };

        $afterQuantity = match ($adjustmentType) {
            StockAdjustmentDetail::TYPE_INCREASED => $previousQuantity + $movementQuantity,
            StockAdjustmentDetail::TYPE_DECREASED => $previousQuantity - $movementQuantity,
            default => $previousQuantity,
        };

        $batch->save();

        return [
            'item_batch_id' => $batch->id,
            'data_quantity' => [
                'previous_quantity' => $previousQuantity,
                'movement_quantity' => $movementQuantity,
                'after_quantity' => $afterQuantity,
            ]
        ];
    }
}
