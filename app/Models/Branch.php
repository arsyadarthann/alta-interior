<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'branches';

    protected $fillable = [
        'name',
        'initial',
        'contact',
        'address',
    ];

    public function transactionSequences(): HasMany
    {
        return $this->hasMany(TransactionSequence::class, 'branch_id', 'id');
    }

    public function itemBatches(): HasMany
    {
        return $this->hasMany(ItemBatch::class, 'branch_id', 'id');
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'branch_id', 'id');
    }

    public function goodsReceipts(): HasMany
    {
        return $this->hasMany(GoodsReceipt::class, 'branch_id', 'id');
    }

    public function stockTransfersFrom(): HasMany
    {
        return $this->hasMany(StockTransfer::class, 'from_branch_id', 'id');
    }

    public function stockTransfersTo(): HasMany
    {
        return $this->hasMany(StockTransfer::class, 'to_branch_id', 'id');
    }

    public function stockAudits(): HasMany
    {
        return $this->hasMany(StockAudit::class, 'branch_id', 'id');
    }

    public function stockAdjustments(): HasMany
    {
        return $this->hasMany(StockAdjustment::class, 'branch_id', 'id');
    }
}
