<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\StockAuditInterface;
use App\Models\StockAudit;
use Illuminate\Support\Facades\DB;

class StockAuditRepository implements StockAuditInterface
{
    const array GENERAL_RELATIONSHIPS = [
        'branch:id,name', 'user:id,name',
    ];

    public function __construct(private StockAudit $stockAudit) {}

    public function getAll($branchId = null)
    {
        return $this->stockAudit
            ->with(self::GENERAL_RELATIONSHIPS)
            ->when($branchId, fn($query) => $query->where('branch_id', $branchId))
            ->orderByDesc('id')->orderByDesc('date')->get();
    }

    public function getById(int $id)
    {
        return $this->stockAudit->with([...self::GENERAL_RELATIONSHIPS, 'stockAuditDetails.item.itemUnit'])->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $stockAudit = $this->stockAudit->create([
                'code' => $data['code'],
                'date' => $data['date'],
                'branch_id' => $data['branch_id'],
                'user_id' => request()->user()->id,
            ]);

            foreach ($data['stock_audit_details'] as $stockAuditDetail) {
                $stockAudit->stockAuditDetails()->create([
                    'item_id' => $stockAuditDetail['item_id'],
                    'system_quantity' => $stockAuditDetail['system_quantity'],
                    'physical_quantity' => $stockAuditDetail['physical_quantity'],
                    'discrepancy_quantity' => $stockAuditDetail['discrepancy_quantity'],
                    'reason' => $stockAuditDetail['reason'],
                ]);
            }

            TransactionCode::confirmTransactionCode('Stock Audit', $data['code'], $data['branch_id']);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $stockAudit = $this->getById($id);
            $stockAudit->update([
                'code' => $data['code'],
                'date' => $data['date'],
                'branch_id' => $data['branch_id'],
                'user_id' => request()->user()->id,
            ]);

            $submittedIds = collect($data['stock_audit_details'])->pluck('id')->filter()->toArray();

            $stockAudit->stockAuditDetails()->whereNotIn('id', $submittedIds)->delete();

            foreach ($data['stock_audit_details'] as $stockAuditDetail) {
                $stockAudit->stockAuditDetails()->updateOrCreate([
                    'id' => $stockAuditDetail['id'] ?? null,
                ], [
                    'item_id' => $stockAuditDetail['item_id'],
                    'system_quantity' => $stockAuditDetail['system_quantity'],
                    'physical_quantity' => $stockAuditDetail['physical_quantity'],
                    'discrepancy_quantity' => $stockAuditDetail['discrepancy_quantity'],
                    'reason' => $stockAuditDetail['reason'],
                ]);
            }
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $stockAudit = $this->getById($id);
            $code = $stockAudit->code;
            $stockAudit->stockAuditDetails()->delete();
            $stockAudit->delete();
            TransactionCode::cancelTransactionCode('Stock Audit', $code);
        });
    }

    public function lock(int $id)
    {
        return DB::transaction(function () use ($id) {
            $stockAudit = $this->getById($id);
            $stockAudit->update([
                'is_locked' => true,
            ]);
        });
    }
}
