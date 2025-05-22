<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\StockAdjustmentInterface;
use App\Models\Branch;
use App\Models\StockAdjustment;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class StockAdjustmentRepository implements StockAdjustmentInterface
{
    const GENERAL_RELATIONSHIPS = [
        'source_able:id,name', 'user:id,name'
    ];

    const sourceAbleTypeMap = ['branch' => Branch::class, 'warehouse' => Warehouse::class];

    public function __construct(private StockAdjustment $stockAdjustment) {}

    public function getAll($filter, $sourceId = null, $sourceType = null)
    {
        $query = $this->stockAdjustment
            ->with(self::GENERAL_RELATIONSHIPS)
            ->when($sourceId && $sourceType, function($query) use ($sourceId, $sourceType) {
                return $query->where('source_able_id', $sourceId)
                    ->where('source_able_type', $sourceType);
            })
            ->orderByDesc('code');

        if (!empty($filter['search'])) {
            $searchTerm = strtolower($filter['search']);
            $query->where(function ($query) use ($searchTerm) {
                $query->whereRaw("LOWER(code) LIKE '%{$searchTerm}%'")
                    ->orWhereHas('user', function($q) use ($searchTerm) {
                        $q->whereRaw("LOWER(name) LIKE '%{$searchTerm}%'");
                    });
            });
        }

        return $query->paginate(10)->withQueryString();
    }

    public function getAllByBranch($filter, $branchId)
    {
        return $this->getAll($branchId, Branch::class);
    }

    public function getAllByWarehouse($filter, $warehouseId)
    {
        return $this->getAll($warehouseId, Warehouse::class);
    }

    public function getById(int $id)
    {
        return $this->stockAdjustment->with([
            ...self::GENERAL_RELATIONSHIPS, 'stockAdjustmentDetails.item.itemUnit'
        ])->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $stockAdjustment = $this->stockAdjustment->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'source_able_id' => $data['source_able_id'],
                'source_able_type' => self::sourceAbleTypeMap[$data['source_able_type']],
                'user_id' => request()->user()->id,
            ]);

            foreach ($data['stock_adjustment_details'] as $stockAdjustmentDetail) {
                $adjustmentDetail = $stockAdjustment->stockAdjustmentDetails()->create([
                    'item_id' => $stockAdjustmentDetail['item_id'],
                    'type' => $stockAdjustmentDetail['type'],
                    'before_adjustment_quantity' => $stockAdjustmentDetail['before_adjustment_quantity'],
                    'adjustment_quantity' => $stockAdjustmentDetail['adjustment_quantity'],
                    'after_adjustment_quantity' => $stockAdjustmentDetail['after_adjustment_quantity'],
                    'reason' => $stockAdjustmentDetail['reason'],
                ]);

                $adjustments = app(ItemRepository::class)->adjustBatch($stockAdjustmentDetail['item_id'], $data['source_able_id'], self::sourceAbleTypeMap[$data['source_able_type']], $stockAdjustmentDetail['type'], $stockAdjustmentDetail['adjustment_quantity']);

                foreach ($adjustments as $adjustment) {
                    app(StockMovementRepository::class)->createStockMovement($adjustment['item_batch_id'], $data['source_able_id'], self::sourceAbleTypeMap[$data['source_able_type']], $stockAdjustmentDetail['type'], $adjustment['data_quantity'], $adjustmentDetail);
                }
            }

            TransactionCode::confirmTransactionCode('Stock Adjustment', $data['code'], self::sourceAbleTypeMap[$data['source_able_type']], $data['source_able_id']);
        });
    }
}
