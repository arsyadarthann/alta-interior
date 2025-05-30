<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'warehouses';

    protected $fillable = [
        'name',
        'description',
        'is_active'
    ];

    public function transactionSequences(): MorphMany
    {
        return $this->morphMany(TransactionSequence::class, 'source_able');
    }

    public function itemBatches(): MorphMany
    {
        return $this->morphMany(ItemBatch::class, 'source_able');
    }

    public function stockMovements(): MorphMany
    {
        return $this->morphMany(StockMovement::class, 'source_able');
    }

    public function stockTransferSource(): MorphMany
    {
        return $this->morphMany(StockTransfer::class, 'source_able');
    }

    public function stockTransferDestination(): MorphMany
    {
        return $this->morphMany(StockTransfer::class, 'destination_able');
    }

    public function stockAdjustments(): MorphMany
    {
        return $this->morphMany(StockAdjustment::class, 'source_able');
    }

    public function stockAudits(): MorphMany
    {
        return $this->morphMany(StockAudit::class, 'source_able');
    }

    public function salesOrderDetailsAsItemSource(): MorphMany
    {
        return $this->morphMany(SalesOrderDetail::class, 'item_source_able');
    }
}
