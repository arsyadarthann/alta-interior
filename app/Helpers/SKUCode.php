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
    public static function generateSKU($itemId, $sourceAbleId, $sourceAbleType) : ?string
    {
        $item = Item::find($itemId);

        if (!$item || empty($item->code)) {
            throw new InvalidArgumentException('code is required for this item');
        }

        $itemCode = $item->code;

        $todayDate = now()->format('Ymd');

        $lastBatch = ItemBatch::where('item_id', $itemId)
            ->where('source_able_id', $sourceAbleId)
            ->where('source_able_type', $sourceAbleType)
            ->whereDate('created_at', now()->toDateString())
            ->orderBy('id', 'desc')
            ->first();

        $nextBatchNumber = $lastBatch ? ((int)substr($lastBatch->sku, -4) + 1) : 1;

        $batchCode = str_pad($nextBatchNumber, 4, '0', STR_PAD_LEFT);

        return "{$itemCode}-{$todayDate}-{$batchCode}";
    }
}
