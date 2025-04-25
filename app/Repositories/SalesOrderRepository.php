<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\SalesOrderInterface;
use App\Models\Branch;
use App\Models\SalesOrder;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class SalesOrderRepository implements SalesOrderInterface
{
    const GENERAL_RELATIONSHIPS = [
        'user:id,name', 'branch:id,name', 'customer:id,name'
    ];

    const ITEM_SOURCE_ABLE_MAP = [
        'branch' => Branch::class, 'warehouse' => Warehouse::class,
    ];

    public function __construct(private SalesOrder $salesOrder) {}

    public function getAll($branch_id = null)
    {
        return $this->salesOrder
            ->with(self::GENERAL_RELATIONSHIPS)
            ->when($branch_id, fn ($query) => $query->where('branch_id', $branch_id))
            ->orderBy('id', 'desc')
            ->orderBy('code', 'desc')
            ->paginate(10);
    }

    public function getById($id)
    {
        return $this->salesOrder->with([...self::GENERAL_RELATIONSHIPS, 'salesOrderDetails.item_source_able', 'salesOrderDetails.item.itemUnit', 'waybills.user'])->find($id);
    }

    public function getByBranchId($branch_id)
    {
        return $this->salesOrder
            ->with(self::GENERAL_RELATIONSHIPS)
            ->where('branch_id', $branch_id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->orderBy('id', 'desc')
            ->orderBy('code', 'desc')
            ->get();
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $salesOrder = $this->salesOrder->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'user_id' => request()->user()->id,
                'branch_id' => $data['branch_id'],
                'customer_id' => $data['customer_id'] ?? null,
                'customer_name' => $data['customer_name'] ?? null,
                'total_amount' => $data['total_amount'],
                'tax_rate_id' => $data['tax_rate_id'] ?? null,
                'tax_amount' => $data['tax_amount'],
                'grand_total' => $data['grand_total'],
            ]);

            foreach ($data['sales_order_details'] as $salesOrderDetail) {
                $salesOrder->salesOrderDetails()->create([
                    'item_id' => $salesOrderDetail['item_id'],
                    'item_source_able_id' => $salesOrderDetail['item_source_able_id'],
                    'item_source_able_type' => self::ITEM_SOURCE_ABLE_MAP[$salesOrderDetail['item_source_able_type']],
                    'quantity' => $salesOrderDetail['quantity'],
                    'unit_price' => $salesOrderDetail['unit_price'],
                    'total_price' => $salesOrderDetail['total_price'],
                ]);
            }


            TransactionCode::confirmTransactionCode('Sales Order', $data['code'], Branch::class, $data['branch_id']);
        });
    }

    public function update($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $salesOrder = $this->getById($id);
            $salesOrder->update([
                'code' => $data['code'],
                'date' => $data['date'],
                'user_id' => request()->user()->id,
                'branch_id' => $data['branch_id'],
                'customer_id' => $data['customer_id'] ?? null,
                'customer_name' => $data['customer_name'] ?? null,
                'total_amount' => $data['total_amount'],
                'tax_rate_id' => $data['tax_rate_id'] ?? null,
                'tax_amount' => $data['tax_amount'],
                'grand_total' => $data['grand_total'],
            ]);

            $submittedIds = collect($data['sales_order_details'])->pluck('id')->filter()->toArray();
            $salesOrder->salesOrderDetails()->whereNotIn('id', $submittedIds)->delete();
            foreach ($data['sales_order_details'] as $salesOrderDetail) {
                $salesOrder->salesOrderDetails()->updateOrCreate([
                    'id' => $salesOrderDetail['id'] ?? null,
                ], [
                    'item_id' => $salesOrderDetail['item_id'],
                    'item_source_able_id' => $salesOrderDetail['item_source_able_id'],
                    'item_source_able_type' => self::ITEM_SOURCE_ABLE_MAP[$salesOrderDetail['item_source_able_type']],
                    'quantity' => $salesOrderDetail['quantity'],
                    'unit_price' => $salesOrderDetail['unit_price'],
                    'total_price' => $salesOrderDetail['total_price'],
                ]);
            }
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {
            $salesOrder = $this->getById($id);
            $code = $salesOrder->code;
            TransactionCode::cancelTransactionCode('Sales Order', $code, $salesOrder->branch_id, Branch::class);
            $salesOrder->salesOrderDetails()->delete();
            $salesOrder->delete();
        });
    }
}
