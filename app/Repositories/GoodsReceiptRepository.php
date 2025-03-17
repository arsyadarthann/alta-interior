<?php

namespace App\Repositories;

use App\Helpers\SKUCode;
use App\Interface\GoodsReceiptInterface;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptDetail;
use App\Models\GoodsReceiptPurchaseOrder;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderDetail;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class GoodsReceiptRepository implements GoodsReceiptInterface
{
    public function __construct(private GoodsReceipt $goodsReceipt, private GoodsReceiptDetail $goodsReceiptDetail, private GoodsReceiptPurchaseOrder $goodsReceiptPurchaseOrder, private PurchaseOrder $purchaseOrder, private PurchaseOrderDetail $purchaseOrderDetail) {}

    public function getAll()
    {
        return $this->goodsReceipt->with('supplier')
            ->orderBy('id')->orderByDesc('date')->Paginate(10);
    }

    public function getById(int $id)
    {
        return $this->goodsReceipt->with(['supplier', 'goodsReceiptDetails.purchaseOrderDetail.item.itemUnit', 'goodsReceiptDetails.goodsReceiptPurchaseOrder.purchaseOrder:id,code'])->find($id);
    }

    public function getUnreceivedPurchaseOrderDetails($supplierId)
    {
        return $this->purchaseOrderDetail
            ->select([
                'purchase_order_details.id as purchase_order_detail_id',
                'purchase_orders.id as purchase_order_id',
                'purchase_orders.code as purchase_order_code',
                'purchase_order_details.item_id',
                'items.name as item_name',
                'items.code as item_code',
                'item_units.abbreviation as item_abbreviation',
                'purchase_order_details.quantity as ordered_quantity',
                'purchase_order_details.unit_price', // Added unit price
                'purchase_order_details.total_price', // Added total price
                DB::raw('COALESCE(SUM(goods_receipt_details.received_quantity), 0) as received_quantity'),
                DB::raw('purchase_order_details.quantity - COALESCE(SUM(goods_receipt_details.received_quantity), 0) as remaining_quantity')
            ])
            ->join('purchase_orders', 'purchase_order_details.purchase_order_id', '=', 'purchase_orders.id')
            ->join('items', 'purchase_order_details.item_id', '=', 'items.id')
            ->join('item_units', 'items.item_unit_id', '=', 'item_units.id')
            ->leftJoin('goods_receipt_details', 'purchase_order_details.id', '=', 'goods_receipt_details.purchase_order_detail_id')
            ->where([
                ['purchase_orders.supplier_id', $supplierId],
                ['purchase_orders.status', '!=', 'received'],
            ])
            ->groupBy([
                'purchase_order_details.id',
                'purchase_orders.id',
                'purchase_orders.code',
                'purchase_order_details.item_id',
                'items.name',
                'items.code', // Added item code to group by
                'item_units.abbreviation',
                'purchase_order_details.quantity',
                'purchase_order_details.unit_price', // Added to group by
                'purchase_order_details.total_price', // Added to group by
            ])
            ->havingRaw('COALESCE(SUM(goods_receipt_details.received_quantity), 0) < purchase_order_details.quantity')
            ->get();

    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $goodsReceipt = $this->goodsReceipt->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'supplier_id' => $data['supplier_id'],
                'received_by' => $data['received_by'],
            ]);

            foreach ($data['goods_receipt_purchase_order'] as $goodsReceiptPurchaseOrder) {
                $goodsReceipt->purchaseOrders()->attach($goodsReceiptPurchaseOrder['purchase_order_id']);

                $pivotId = $this->goodsReceiptPurchaseOrder
                    ->where('goods_receipt_id', $goodsReceipt->id)
                    ->where('purchase_order_id', $goodsReceiptPurchaseOrder['purchase_order_id'])
                    ->value('id');

                $purchaseOrder = $this->purchaseOrder->with('purchaseOrderDetails.item')->find($goodsReceiptPurchaseOrder['purchase_order_id']);
                foreach ($goodsReceiptPurchaseOrder['goods_receipt_details'] as $goodsReceiptDetail) {
                    $purchaseOrderDetail = $purchaseOrder->purchaseOrderDetails->firstWhere('id', $goodsReceiptDetail['purchase_order_detail_id']);

                    $newGoodsReceipDetail = $this->goodsReceiptDetail->create([
                        'goods_receipt_purchase_order_id' => $pivotId,
                        'purchase_order_detail_id' => $purchaseOrderDetail->id,
                        'received_quantity' => $goodsReceiptDetail['received_quantity'],
                        'price_per_unit' => $purchaseOrderDetail->unit_price,
                        'total_price' => $purchaseOrderDetail->unit_price * $goodsReceiptDetail['received_quantity'],
                        'cogs' => $purchaseOrderDetail->unit_price,
                    ]);

                    $item = $purchaseOrderDetail->item;

                    $previousQuantity = app(ItemRepository::class)->sumStockByWarehouse($item->id, Warehouse::first()->id);

                    $newBatch = app(ItemRepository::class)->addBatch([
                        'sku' => SKUCode::generateSKU($item->id, Warehouse::first()->id, Warehouse::class),
                        'source_able_id' => Warehouse::first()->id,
                        'source_able_type' => Warehouse::class,
                        'item_id' => $item->id,
                        'stock' => $goodsReceiptDetail['received_quantity'],
                        'cogs' => $purchaseOrderDetail->unit_price,
                    ]);

                    $dataQuantity = [
                        'previous_quantity' => $previousQuantity,
                        'movement_quantity' => $goodsReceiptDetail['received_quantity'],
                        'after_quantity' => $previousQuantity + $goodsReceiptDetail['received_quantity'],
                    ];

                    app(StockMovementRepository::class)->createStockMovement($newBatch->id, Warehouse::first()->id, Warehouse::class, StockMovement::TYPE_IN, $dataQuantity, $newGoodsReceipDetail);
                }

                $this->updatePurchaseOrderStatus($goodsReceiptPurchaseOrder['purchase_order_id']);
            }
        });
    }

    private function updatePurchaseOrderStatus(int $purchaseOrderId)
    {
        $purchaseOrderDetails = $this->purchaseOrderDetail
            ->with('goodsReceiptDetails')
            ->where('purchase_order_id', $purchaseOrderId)
            ->get();

        $allCompleted = true;
        $anyReceived = false;

        foreach ($purchaseOrderDetails as $purchaseOrderDetail) {
            $totalReceivedQuantity = $purchaseOrderDetail->goodsReceiptDetails->sum('received_quantity');

            if ($totalReceivedQuantity == 0) {
                $allCompleted = false;
            } elseif ($totalReceivedQuantity < $purchaseOrderDetail->quantity) {
                $allCompleted = false;
                $anyReceived = true;
            } elseif ($totalReceivedQuantity >= $purchaseOrderDetail->quantity) {
                $anyReceived = true;
            }

        }

        $status = 'pending';
        if ($allCompleted) {
            $status = 'received';
        } elseif ($anyReceived) {
            $status = 'partially_received';
        }

        $purchaseOrder = $purchaseOrderDetails->first()?->purchaseOrder;

        if ($purchaseOrder) {
            $purchaseOrder->update([
                'status' => $status,
            ]);
        }
    }
}
