<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
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

    public function transactionSequences(): MorphMany
    {
        return $this->morphMany(TransactionSequence::class, 'source_able');
    }

    public function itemBatches(): MorphMany
    {
        return $this->morphMany(ItemBatch::class, 'source_able');
    }

    public function purchaseInvoicePayments(): HasMany
    {
        return $this->hasMany(PurchaseInvoicePayment::class, 'branch_id', 'id');
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

    public function stockAudits(): MorphMany
    {
        return $this->morphMany(StockAudit::class, 'source_able');
    }

    public function stockAdjustments(): MorphMany
    {
        return $this->morphMany(StockAdjustment::class, 'source_able');
    }

    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class, 'branch_id', 'id');
    }

    public function salesOrderDetailsAsItemSource(): HasMany
    {
        return $this->hasMany(SalesOrderDetail::class, 'item_from_branch_id', 'id');
    }

    public function waybills(): HasMany
    {
        return $this->hasMany(Waybill::class, 'branch_id', 'id');
    }

    public function salesInvoicePayments(): HasMany
    {
        return $this->hasMany(SalesInvoicePayment::class, 'branch_id', 'id');
    }

}
