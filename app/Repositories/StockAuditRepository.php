<?php

namespace App\Repositories;

use App\Helpers\TransactionCode;
use App\Interface\StockAuditInterface;
use App\Models\Branch;
use App\Models\StockAudit;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class StockAuditRepository implements StockAuditInterface
{
    const array GENERAL_RELATIONSHIPS = [
        'source_able:id,name', 'user:id,name',
    ];

    const sourceAbleTypeMap = ['branch' => Branch::class, 'warehouse' => Warehouse::class];

    public function __construct(private StockAudit $stockAudit) {}

    public function getAll($filter, $sourceId = null, $sourceType = null)
    {
        $query = $this->stockAudit
            ->with(self::GENERAL_RELATIONSHIPS)
            ->when($sourceId && $sourceType, function($query) use ($sourceId, $sourceType) {
                return $query->where('source_able_id', $sourceId)
                    ->where('source_able_type', $sourceType);
            })
            ->orderByDesc('id')->orderByDesc('date');

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
        return $this->getAll($filter, $branchId, Branch::class);
    }

    public function getAllByWarehouse($filter, $warehouseId)
    {
        return $this->getAll($filter, $warehouseId, Warehouse::class);
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
                'source_able_id' => $data['source_able_id'],
                'source_able_type' => self::sourceAbleTypeMap[$data['source_able_type']],
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

            TransactionCode::confirmTransactionCode('Stock Audit', $data['code'], self::sourceAbleTypeMap[$data['source_able_type']], $data['source_able_id']);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $stockAudit = $this->getById($id);
            $stockAudit->update([
                'code' => $data['code'],
                'date' => $data['date'],
                'source_able_id' => $data['source_able_id'],
                'source_able_type' => self::sourceAbleTypeMap[$data['source_able_type']],
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
            TransactionCode::cancelTransactionCode('Stock Audit', $code, $stockAudit->source_able_id, $stockAudit->source_able_type);
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
