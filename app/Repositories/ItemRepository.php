<?php

namespace App\Repositories;

use App\Helpers\SKUCode;
use App\Interface\ItemInterface;
use App\Models\Branch;
use App\Models\Item;
use App\Models\ItemBatch;
use App\Models\StockAdjustmentDetail;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class ItemRepository implements ItemInterface
{
    public function __construct(private Item $item, private ItemBatch $itemBatch) {}

    public function getAll($sourceId = null, $sourceType = null)
    {
        $query = $this->item->with(['itemCategory:id,name', 'itemUnit:id,name,abbreviation']);

        $query->selectRaw('items.*, COALESCE((
        SELECT SUM(stock)
        FROM item_batches
        WHERE item_batches.item_id = items.id' .
            ($sourceId ? ' AND item_batches.source_able_id = ' . $sourceId .
                ' AND item_batches.source_able_type = \'' . $sourceType . '\'' : '') .
            '), 0) as stock');

        return $query->orderBy('id')->get();
    }

    public function getAllPaginate($sourceId = null, $sourceType = null)
    {
        $query = $this->item->with(['itemCategory:id,name', 'itemUnit:id,name,abbreviation']);

        $query->selectRaw('items.*, COALESCE((
        SELECT SUM(stock)
        FROM item_batches
        WHERE item_batches.item_id = items.id' .
            ($sourceId ? ' AND item_batches.source_able_id = ' . $sourceId .
                ' AND item_batches.source_able_type = \'' . $sourceType . '\'' : '') .
            '), 0) as stock');

        return $query->orderBy('id')->paginate(10);
    }

    public function getAllByBranch($branchId = null)
    {
        return $this->getAll($branchId, Branch::class);
    }

    public function getAllPaginateByBranch($branchId = null)
    {
        return $this->getAllPaginate($branchId, Branch::class);
    }

    public function getAllByWarehouse($warehouseId = null)
    {
        return $this->getAll($warehouseId, Warehouse::class);
    }

    public function getAllPaginateByWarehouse($warehouseId = null)
    {
        return $this->getAllPaginate($warehouseId, Warehouse::class);
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

    public function sumStock(int $itemId, int $sourceId, string $sourceType)
    {
        return $this->itemBatch
            ->where('item_id', $itemId)
            ->where('source_able_id', $sourceId)
            ->where('source_able_type', $sourceType)
            ->sum('stock');
    }


    public function sumStockByBranch(int $itemId, int $branchId)
    {
        return $this->sumStock($itemId, $branchId, Branch::class);
    }

    public function sumStockByWarehouse(int $itemId, int $warehouseId)
    {
        return $this->sumStock($itemId, $warehouseId, Warehouse::class);
    }

    public function getPaginateBatch(int $itemId, int $sourceAbleId, string $sourceAbleType, bool $withWhereStockGreaterThanZero = true)
    {
        $mappedType = match ($sourceAbleType) {
            'Branch' => Branch::class,
            'Warehouse' => Warehouse::class,
            default => $sourceAbleType
        };

        return $this->itemBatch->with([
            'source_able:id,name', 'item.itemCategory', 'item.itemUnit'
        ])
            ->where('item_id', $itemId)
            ->where('source_able_id', $sourceAbleId)
            ->where('source_able_type', $mappedType)
            ->when($withWhereStockGreaterThanZero, fn($query) => $query->where('stock', '>', 0))
            ->orderBy('received_at')
            ->paginate(10);
    }

    public function getBatch(int $itemId, int $sourceAbleId, string $sourceAbleType, bool $withWhereStockGreaterThanZero = true)
    {
        // Map the string type to the actual class name if needed
        $mappedType = match ($sourceAbleType) {
            'Branch' => Branch::class,
            'Warehouse' => Warehouse::class,
            default => $sourceAbleType
        };

        return $this->itemBatch->with([
            'source_able:id,name', 'item.itemCategory', 'item.itemUnit'
        ])
            ->where('item_id', $itemId)
            ->where('source_able_id', $sourceAbleId)
            ->where('source_able_type', $mappedType)
            ->when($withWhereStockGreaterThanZero, fn($query) => $query->where('stock', '>', 0))
            ->orderBy('received_at')
            ->get();
    }

    public function addBatch(array $data)
    {
        return DB::transaction(function () use ($data) {
            $newBatch = $this->itemBatch->create([
                'sku' => $data['sku'],
                'source_able_id' => $data['source_able_id'],
                'source_able_type' => $data['source_able_type'],
                'item_id' => $data['item_id'],
                'received_at' => now(),
                'cogs' => $data['cogs'],
                'stock' => $data['stock'],
            ]);

            return $newBatch;
        });
    }

    public function reduceBatch(int $itemId, int $sourceAbleId, string $sourceAbleType, float $usedQuantity)
    {
        return DB::transaction(function () use ($itemId, $sourceAbleId, $sourceAbleType, $usedQuantity) {
            $usedStock = $usedQuantity;

            $batchDetails = [];

            $batches = $this->getBatch($itemId, $sourceAbleId, $sourceAbleType);

            foreach ($batches as $batch) {
                $previousQty = $this->sumStock($itemId, $sourceAbleId, $sourceAbleType);

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

    public function adjustBatch(int $itemId, int $sourceAbleId, string $sourceAbleType, string $adjustmentType, float $adjustmentQuantity)
    {
        return DB::transaction(function () use ($itemId, $sourceAbleId, $sourceAbleType, $adjustmentType, $adjustmentQuantity) {
            $adjustmentStock = $adjustmentQuantity;

            $batchDetails = [];

            $batches = $this->getBatch($itemId, $sourceAbleId, $sourceAbleType);

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
                        'sku' => SKUCode::generateSKU($itemId, $sourceAbleId, $sourceAbleType),
                        'source_able_id' => $sourceAbleId,
                        'source_able_type' => $sourceAbleType,
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

    private function addStockBatch(int $itemBatchId, int $sourceAbleId, $sourceAbleType, float $addedQuantity)
    {
        return DB::transaction(function () use ($itemBatchId, $sourceAbleId, $sourceAbleType, $addedQuantity) {
            $sourceBatch = $this->itemBatch->find($itemBatchId);

            $previousQty = $this->itemBatch
                ->where('item_id', $sourceBatch->item_id)
                ->where('source_able_id', $sourceAbleId)
                ->where('source_able_type', $sourceAbleType)
                ->sum('stock');

            $existingBatch = $this->itemBatch
                ->where('item_id', $sourceBatch->item_id)
                ->where('source_able_id', $sourceAbleId)
                ->where('source_able_type', $sourceAbleType)
                ->where('sku', $sourceBatch->sku)
                ->first();

            if ($existingBatch) {
                $existingBatch->stock += $addedQuantity;
                $existingBatch->save();

                return [
                    'item_batch_id' => $existingBatch->id,
                    'data_quantity' => [
                        'previous_quantity' => $previousQty,
                        'movement_quantity' => $addedQuantity,
                        'after_quantity' => $previousQty + $addedQuantity,
                    ]
                ];
            }

            $newBatch = $this->itemBatch->create([
                'sku' => $sourceBatch['sku'],
                'source_able_id' => $sourceAbleId,
                'source_able_type' => $sourceAbleType,
                'item_id' => $sourceBatch->item_id,
                'received_at' => $sourceBatch->received_at,
                'stock' => $addedQuantity,
                'cogs' => $sourceBatch->cogs,
            ]);

            return [
                'item_batch_id' => $newBatch->id,
                'data_quantity' => [
                    'previous_quantity' => $previousQty,
                    'movement_quantity' => $addedQuantity,
                    'after_quantity' => $previousQty + $addedQuantity,
                ]
            ];
        });
    }

    public function transferBatch(int $itemId, int $sourceAbleId, string $sourceAbleType, int $destinationAbleId, string $destinationAbleType, float $transferQuantity, $stockTransferDetail)
    {
        return DB::transaction(function () use ($itemId, $sourceAbleId, $sourceAbleType, $destinationAbleId, $destinationAbleType, $transferQuantity, $stockTransferDetail) {
            $reduceStockBatches = $this->reduceBatch($itemId, $sourceAbleId, $sourceAbleType, $transferQuantity);

            foreach ($reduceStockBatches as $batch) {
                app(StockMovementRepository::class)->createStockMovement($batch['item_batch_id'], $sourceAbleId, $sourceAbleType, StockAdjustmentDetail::TYPE_DECREASED, $batch['data_quantity'], $stockTransferDetail);

                $addStockBatch = $this->addStockBatch($batch['item_batch_id'], $destinationAbleId, $destinationAbleType, $batch['data_quantity']['movement_quantity']);

                app(StockMovementRepository::class)->createStockMovement($addStockBatch['item_batch_id'], $destinationAbleId, $destinationAbleType, StockAdjustmentDetail::TYPE_INCREASED, $addStockBatch['data_quantity'], $stockTransferDetail);
            }
        });
    }

    private function processBatchAdjustment($batch, $adjustmentType, $adjustmentStock): array
    {
        $previousQuantity = $this->sumStock($batch->item_id, $batch->source_able_id, $batch->source_able_type);

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
