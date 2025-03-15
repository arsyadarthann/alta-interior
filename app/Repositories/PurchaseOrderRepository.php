<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\PurchaseOrderInterface;
use App\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;

class PurchaseOrderRepository implements PurchaseOrderInterface
{
    const GENERAL_RELATIONSHIPS = [
        'branch:id,name', 'supplier', 'taxRate:id,rate'
    ];

    public function __construct(private PurchaseOrder $purchaseOrder) {}

    public function getAll($branchId = null)
    {
        return $this->purchaseOrder
            ->with(self::GENERAL_RELATIONSHIPS)
            ->when($branchId, function ($query, $branchId) {
                return $query->where('branch_id', $branchId);
            })
            ->orderBy('code', 'desc')
            ->get();
    }

    public function getById(int $id)
    {
        return $this->purchaseOrder
            ->with([...self::GENERAL_RELATIONSHIPS, 'purchaseOrderDetails.item.itemUnit'])
            ->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $purchaseOrder = $this->purchaseOrder->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'branch_id' => $data['branch_id'],
                'supplier_id' => $data['supplier_id'],
                'expected_delivery_date' => $data['expected_delivery_date'],
                'total_amount' => $data['total_amount'],
                'tax_rate_id' => $data['tax_rate_id'] ?? null,
                'tax_amount' => $data['tax_amount'],
                'grand_total' => $data['grand_total'],
            ]);

            foreach ($data['purchase_order_details'] as $purchaseOrderDetail) {
                $purchaseOrder->purchaseOrderDetails()->create([
                    'item_id' => $purchaseOrderDetail['item_id'],
                    'quantity' => $purchaseOrderDetail['quantity'],
                    'unit_price' => $purchaseOrderDetail['unit_price'],
                    'total_price' => $purchaseOrderDetail['total_price'],
                ]);
            }

            TransactionCode::confirmTransactionCode('Purchase Order', $data['code'], $data['branch_id']);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $purchaseOrder = $this->getById($id);
            $purchaseOrder->update([
                'code' => $data['code'],
                'date' => $data['date'],
                'branch_id' => $data['branch_id'],
                'supplier_id' => $data['supplier_id'],
                'expected_delivery_date' => $data['expected_delivery_date'],
                'total_amount' => $data['total_amount'],
                'tax_rate_id' => $data['tax_rate_id'] ?? null,
                'tax_amount' => $data['tax_amount'],
                'grand_total' => $data['grand_total'],
            ]);

            $submittedIds = collect($data['purchase_order_details'])->pluck('id')->filter()->toArray();

            $purchaseOrder->purchaseOrderDetails()->whereNotIn('id', $submittedIds)->delete();

            foreach ($data['purchase_order_details'] as $purchaseOrderDetail) {
                $purchaseOrder->purchaseOrderDetails()->updateOrCreate([
                    'id' => $purchaseOrderDetail['id'] ?? null,
                ], [
                    'item_id' => $purchaseOrderDetail['item_id'],
                    'quantity' => $purchaseOrderDetail['quantity'],
                    'unit_price' => $purchaseOrderDetail['unit_price'],
                    'total_price' => $purchaseOrderDetail['total_price'],
                ]);
            }
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $purchaseOrder = $this->getById($id);
            $code = $purchaseOrder->code;
            $purchaseOrder->purchaseOrderDetails()->delete();
            $purchaseOrder->delete();
            TransactionCode::cancelTransactionCode('Purchase Order', $code);
        });
    }
}
