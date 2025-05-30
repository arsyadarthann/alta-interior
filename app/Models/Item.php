<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'items';

    protected $fillable = [
        'name',
        'code',
        'item_category_id',
        'item_wholesale_unit_id',
        'item_unit_id',
        'wholesale_unit_conversion',
        'price'
    ];

    public function itemCategory(): BelongsTo
    {
        return $this->belongsTo(ItemCategory::class, 'item_category_id', 'id');
    }

    public function itemWholesaleUnit(): BelongsTo
    {
        return $this->belongsTo(ItemWholesaleUnit::class, 'item_wholesale_unit_id', 'id');
    }

    public function itemUnit(): BelongsTo
    {
        return $this->belongsTo(ItemUnit::class, 'item_unit_id', 'id');
    }

    public function itemBatches(): HasMany
    {
        return $this->hasMany(ItemBatch::class, 'item_id', 'id');
    }

    public function customerPrices(): HasMany
    {
        return $this->hasMany(CustomerPrice::class, 'item_id', 'id');
    }

    public function purchaseOrderDetails(): HasMany
    {
        return $this->hasMany(PurchaseOrderDetail::class, 'item_id', 'id');
    }

    public function stockTransferDetails(): HasMany
    {
        return $this->hasMany(StockTransferDetail::class, 'item_id', 'id');
    }

    public function stockAuditDetails(): HasMany
    {
        return $this->hasMany(StockAuditDetail::class, 'item_id', 'id');
    }

    public function stockAdjustmentDetails(): HasMany
    {
        return $this->hasMany(StockAdjustmentDetail::class, 'item_id', 'id');
    }

    public function salesOrderDetails(): HasMany
    {
        return $this->hasMany(SalesOrderDetail::class, 'item_id', 'id');
    }

}
