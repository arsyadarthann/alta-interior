<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\StockAdjustmentInterface;
use App\Models\StockAdjustment;
use Illuminate\Support\Facades\DB;

class StockAdjustmentRepository implements StockAdjustmentInterface
{
    const GENERAL_RELATIONSHIPS = [
        'branch:id,name', 'user:id,name'
    ];

    public function __construct(private StockAdjustment $stockAdjustment) {}

    public function getAll($branchId = null)
    {
        return $this->stockAdjustment
            ->with(self::GENERAL_RELATIONSHIPS)
            ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
            ->orderByDesc('code')->get();
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
                'branch_id' => $data['branch_id'],
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

                $adjustments = app(ItemRepository::class)->adjustBatch($stockAdjustmentDetail['item_id'], $data['branch_id'], $stockAdjustmentDetail['type'], $stockAdjustmentDetail['adjustment_quantity']);

                foreach ($adjustments as $adjustment) {
                    app(StockMovementRepository::class)->createStockMovement($adjustment['item_batch_id'], $data['branch_id'], $stockAdjustmentDetail['type'], $adjustment['data_quantity'], $adjustmentDetail);
                }
            }

            TransactionCode::confirmTransactionCode('Stock Adjustment', $data['code'], $data['branch_id']);
        });
    }
}
