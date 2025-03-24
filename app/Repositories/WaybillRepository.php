<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\WaybillInterface;
use App\Models\Branch;
use App\Models\SalesOrder;
use App\Models\SalesOrderDetail;
use App\Models\Waybill;
use App\Models\WaybillDetail;
use Illuminate\Support\Facades\DB;

class WaybillRepository implements WaybillInterface
{
    const GENERAL_RELATIONSHIPS = [
        'user:id,name', 'branch:id,name', 'salesOrder'
    ];

    public function __construct(private Waybill $waybill, private WaybillDetail $waybillDetail, private SalesOrder $salesOrder, private SalesOrderDetail $salesOrderDetail) {}

    public function getAll($branch_id = null)
    {
        return $this->waybill->with(self::GENERAL_RELATIONSHIPS)
            ->when($branch_id, fn($query) => $query->where('branch_id', $branch_id))
            ->orderBy('id', 'desc')
            ->orderBy('code', 'desc')
            ->paginate(10);
    }

    public function getById($id)
    {
        return $this->waybill->with([
            ...self::GENERAL_RELATIONSHIPS,
            'salesOrder.customer',
            'waybillDetails.salesOrderDetail.item_source_able',
            'waybillDetails.salesOrderDetail.item.itemUnit',
            ])->find($id);
    }

    public function getSalesOrderWaybillDetails($id)
    {
        $salesOrder = $this->salesOrder->find($id);

        $result = [];

        foreach ($salesOrder->salesOrderDetails as $salesOrderDetail) {
            $orderedQuantity = $salesOrderDetail->quantity;

            $shippedQuantity = $this->waybillDetail->where('sales_order_detail_id', $salesOrderDetail->id)->sum('quantity');

            $pendingQuantity = $orderedQuantity - $shippedQuantity;

            $item = $salesOrderDetail->item;

            $result[] = [
                'sales_order_detail_id' => $salesOrderDetail->id,
                'item_id' => $item->id,
                'item_name' => $item->name,
                'item_unit' => $item->itemUnit->abbreviation,
                'ordered_quantity' => $orderedQuantity,
                'shipped_quantity' => $shippedQuantity,
                'pending_quantity' => $pendingQuantity,
            ];
        }

        return $result;
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $waybill = $this->waybill->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'user_id' => request()->user()->id,
                'branch_id' => request()->user()->branch_id,
                'sales_order_id' => $data['sales_order_id'],
            ]);

            foreach ($data['waybill_details'] as $waybillDetail) {
                $wbDetail = $waybill->waybillDetails()->create([
                    'sales_order_detail_id' => $waybillDetail['sales_order_detail_id'],
                    'quantity' => $waybillDetail['quantity'],
                    'description' => $waybillDetail['description']
                ]);

                $item = $this->salesOrderDetail->find($waybillDetail['sales_order_detail_id'])->item;

                $dataQuantity = app(ItemRepository::class)->reduceBatch($item->id, request()->user()->branch_id, 'Branch', $waybillDetail['quantity']);

                foreach ($dataQuantity as $dataQuantityItem) {
                    app(StockMovementRepository::class)->createStockMovement($dataQuantityItem['item_batch_id'], request()->user()->branch_id, Branch::class, 'out', $dataQuantityItem['data_quantity'], $wbDetail);
                }
            }

            $salesOrder = $this->salesOrder->find($data['sales_order_id']);
            $salesOrderDetails = $salesOrder->salesOrderDetails;
            $allDetailsCompleted = true;

            foreach ($salesOrderDetails as $salesOrderDetail) {
                $orderedQuantity = $salesOrderDetail->quantity;
                $shippedQuantity = $this->waybillDetail->where('sales_order_detail_id', $salesOrderDetail->id)->sum('quantity');

                if ($shippedQuantity < $orderedQuantity) {
                    $allDetailsCompleted = false;
                    break;
                }
            }

            $salesOrder->update([
                'status' => $allDetailsCompleted ? 'completed' : 'processed'
            ]);

            transactionCode::confirmTransactionCode('Waybill', $data['code'], Branch::class, request()->user()->branch_id) ;
        });
    }
}
