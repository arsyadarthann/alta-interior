<?php

namespace App\Repositories;

use App\Interface\ReportInterface;
use App\Models\GoodsReceiptDetail;
use App\Models\SalesOrder;
use App\Models\SalesOrderDetail;
use App\Models\StockAdjustmentDetail;
use App\Models\StockMovement;
use App\Models\StockTransferDetail;
use App\Models\WaybillDetail;
use Carbon\Carbon;

class ReportRepository implements ReportInterface
{
    public function __construct(private SalesOrder $salesOrder, private SalesOrderDetail $salesOrderDetail, private StockMovement $stockMovement) {}

    private function getDateAndSourceAbleFilters(): array
    {
        return [
            'startDate' => Carbon::parse(request()->start_date)->startOfDay(),
            'endDate' => Carbon::parse(request()->end_date)->endOfDay(),
            'source_able_id' => request()->source_able_id ?? null,
            'source_able_type' => request()->source_able_type ?? null,
            'movementType' => request()->type ?? null,
            'itemId' => request()->item_id ?? null,
        ];
    }

    private function formatStockMovements($stockMovements): array
    {
        $data = [
            'source_able_name' => $stockMovements->source_able->name,
            'item_name' => $stockMovements->itemBatch->item->name,
            'item_from' => null,
            'item_unit' => $stockMovements->itemBatch->item->itemUnit->abbreviation,
            'type' => $stockMovements->type,
            'previous_quantity' => $stockMovements->previous_quantity,
            'movement_quantity' => $stockMovements->movement_quantity,
            'after_quantity' => $stockMovements->after_quantity,
            'reference_code' => null,
            'reference_type' => null,
            'reference_by' => null,
            'created_at_date' => $stockMovements->created_at->format('Y-m-d'),
            'created_at_time' => $stockMovements->created_at->format('H:i:s'),
        ];

        switch ($stockMovements->reference_able_type) {
            case GoodsReceiptDetail::class:
                $goodsReceipt = $stockMovements->referenceable->goodsReceiptPurchaseOrder->goodsReceipt;
                $data['item_from'] = 'Warehouse';
                $data['reference_code'] = $goodsReceipt->code;
                $data['reference_type'] = 'Goods Receipt';
                $data['reference_by'] = $goodsReceipt->supplier->name;
                break;
            case StockAdjustmentDetail::class:
                $stockAdjustment = $stockMovements->referenceable->stockAdjustment;
                $data['item_from'] = $stockAdjustment->source_able->name;
                $data['reference_code'] = $stockAdjustment->code;
                $data['reference_type'] = 'Stock Adjustment';
                $data['reference_by'] = $stockAdjustment->user->name;
                break;
            Case StockTransferDetail::class:
                $stockTransfer = $stockMovements->referenceable->stockTransfer;
                $data['item_from'] = $stockTransfer->source_able->name;
                $data['reference_code'] = $stockTransfer->code;
                $data['reference_type'] = 'Stock Transfer';
                $data['reference_by'] = $stockTransfer->user->name;
                break;
            case WaybillDetail::class:
                $waybill = $stockMovements->referenceable->waybill;
                $data['item_from'] = $stockMovements->referenceable->salesOrderDetail->item_source_able->name;
                $data['reference_code'] = $waybill->code;
                $data['reference_type'] = 'Waybill';
                $data['reference_by'] = $waybill->user->name;
                break;
        }

        return $data;
    }

    public function getStockMovements(): array
    {
        $filters = $this->getDateAndSourceAbleFilters();

        $stockMovements = $this->stockMovement
            ->whereBetween('created_at', [$filters['startDate'], $filters['endDate']])
            ->when(isset($filters['itemId']), function ($query) use ($filters) {
                $query->whereHas('itemBatch', function ($query) use ($filters) {
                    $query->where('item_id', $filters['itemId']);
                });
            })
            ->when(isset($filters['movementType']), function ($query) use ($filters) {
                $query->where('type', $filters['movementType']);
            })
            ->when(isset($filters['source_able_id']), function ($query) use ($filters) {
                $query->where('source_able_id', $filters['source_able_id'])
                    ->where('source_able_type', $filters['source_able_type']);
            })
            ->with(['source_able', 'itemBatch.item.itemUnit'])
            ->orderByDesc('id')
            ->get();

        $stockMovements->load([
            'referenceable' => function ($query) {
                $query->when(
                    $query->getModel() instanceof GoodsReceiptDetail,
                    fn($q) => $q->with('goodsReceiptPurchaseOrder.goodsReceipt.supplier')
                );
                $query->when(
                    $query->getModel() instanceof StockAdjustmentDetail,
                    fn($q) => $q->with('stockAdjustment.user', 'stockAdjustment.source_able')
                );
                $query->when(
                    $query->getModel() instanceof StockTransferDetail,
                    fn($q) => $q->with('stockTransfer.user')
                );
                $query->when(
                    $query->getModel() instanceof WaybillDetail,
                    fn($q) => $q->with('waybill.user', 'salesOrderDetail.item.itemUnit', 'salesOrderDetail.item_source_able')
                );
            }
        ]);

        $formattedStockMovements = $stockMovements->map(function ($stockMovement) {
            return $this->formatStockMovements($stockMovement);
        });

        return $formattedStockMovements->toArray();
    }
}
