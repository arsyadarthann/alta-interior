<?php

namespace App\Repositories;

use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class StockMovementRepository
{
    public function __construct(private StockMovement $stockMovement) {}

    public function createStockMovement(int $itemBatchId, int $branchId, string $type, array $dataQuantity, $reference)
    {
        return DB::transaction(function () use ($itemBatchId, $branchId, $type, $dataQuantity, $reference) {
            $this->stockMovement->create([
                'branch_id' => $branchId,
                'item_batch_id' => $itemBatchId,
                'type' => $type,
                'previous_quantity' => $dataQuantity['previous_quantity'],
                'movement_quantity' => $dataQuantity['movement_quantity'],
                'after_quantity' => $dataQuantity['after_quantity'],
                'reference_able_id' => $reference->id,
                'reference_able_type' => get_class($reference),
            ]);
        });
    }
}
