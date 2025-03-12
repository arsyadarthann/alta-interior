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
}
