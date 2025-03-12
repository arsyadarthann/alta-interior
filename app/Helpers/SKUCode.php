<?php

namespace App\Helpers;

use App\Models\Branch;
use App\Models\Item;
use App\Models\ItemBatch;
use InvalidArgumentException;

class SKUCode
{
    /**
     *  Generate SKU for item batches with auto batch iteration.
     *
     *  Format: Code Item-Initial Branch-YYYYMMDD-XXXX
     * @param $itemId
     * @param $branchId
     * @return string|null
     * @throws InvalidArgumentException
     */
    public static function generateSKU($itemId, $branchId) : ?string
    {
        $item = Item::find($itemId);

        if (!$item || empty($item->code)) {
            throw new InvalidArgumentException('code is required for this item');
        }

        $itemCode = $item->code;

        $branch = Branch::find($branchId);

        if (!$branch || empty($branch->initial)) {
            throw new InvalidArgumentException('Initial code is required for this branch');
        }

        $branchInitial = $branch->initial;

        $todayDate = now()->format('Ymd');

        $lastBatch = ItemBatch::where('item_id', $itemId)
            ->where('branch_id', $branchId)
            ->whereDate('created_at', now()->toDateString())
            ->orderBy('id', 'desc')
            ->first();

        $nextBatchNumber = $lastBatch ? ((int)substr($lastBatch->sku, -4) + 1) : 1;

        $batchCode = str_pad($nextBatchNumber, 4, '0', STR_PAD_LEFT);

        return "{$itemCode}-{$branchInitial}-{$todayDate}-{$batchCode}";
    }
}
