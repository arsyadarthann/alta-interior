<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\PurchaseOrderInterface;
use App\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;

class PurchaseOrderRepository implements PurchaseOrderInterface
{
    const GENERAL_RELATIONSHIPS = [
        'supplier'
    ];

    public function __construct(private PurchaseOrder $purchaseOrder) {}

    public function getAll($filter)
    {
        $query = $this->purchaseOrder
            ->with(self::GENERAL_RELATIONSHIPS)
            ->orderBy('code', 'desc');

        if (!empty($filter['search'])) {
            $searchTerm = strtolower($filter['search']);
            $query->where(function ($query) use ($searchTerm) {
                $query->whereRaw("LOWER(code) LIKE '%{$searchTerm}%'")
                    ->orWhereHas('supplier', function($q) use ($searchTerm) {
                        $q->whereRaw("LOWER(name) LIKE '%{$searchTerm}%'");
                    });
            });
        }

        return $query->paginate(10)->withQueryString();
    }

    public function getById(int $id)
    {
        return $this->purchaseOrder
            ->with([...self::GENERAL_RELATIONSHIPS, 'purchaseOrderDetails.item.itemUnit', 'purchaseOrderDetails.item.itemWholesaleUnit', 'goodsReceipts.goodsReceiptDetails'])
            ->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $purchaseOrder = $this->purchaseOrder->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'supplier_id' => $data['supplier_id'],
                'expected_delivery_date' => $data['expected_delivery_date'],
            ]);

            foreach ($data['purchase_order_details'] as $purchaseOrderDetail) {
                $purchaseOrder->purchaseOrderDetails()->create([
                    'item_id' => $purchaseOrderDetail['item_id'],
                    'quantity' => $purchaseOrderDetail['quantity'],
                ]);
            }

            TransactionCode::confirmTransactionCode('Purchase Order', $data['code']);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $purchaseOrder = $this->getById($id);
            $purchaseOrder->update([
                'code' => $data['code'],
                'date' => $data['date'],
                'supplier_id' => $data['supplier_id'],
                'expected_delivery_date' => $data['expected_delivery_date'],
            ]);

            $submittedIds = collect($data['purchase_order_details'])->pluck('id')->filter()->toArray();

            $purchaseOrder->purchaseOrderDetails()->whereNotIn('id', $submittedIds)->delete();

            foreach ($data['purchase_order_details'] as $purchaseOrderDetail) {
                $purchaseOrder->purchaseOrderDetails()->updateOrCreate([
                    'id' => $purchaseOrderDetail['id'] ?? null,
                ], [
                    'item_id' => $purchaseOrderDetail['item_id'],
                    'quantity' => $purchaseOrderDetail['quantity'],
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
