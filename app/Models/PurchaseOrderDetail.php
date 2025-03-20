<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrderDetail extends Model
{
    use HasFactory;

    protected $table = 'purchase_order_details';

    protected $fillable = [
        'purchase_order_id',
        'item_id',
        'quantity',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id', 'id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id', 'id');
    }

    public function goodsReceiptDetails(): HasMany
    {
        return $this->hasMany(GoodsReceiptDetail::class, 'purchase_order_detail_id', 'id');
    }
}
