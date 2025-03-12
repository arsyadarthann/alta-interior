<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GoodsReceiptPurchaseOrder extends Model
{
    use HasFactory;

    protected $table = 'goods_receipt_purchase_order';

    protected $fillable = [
        'goods_receipt_id',
        'purchase_order_id'
    ];

    public function goodsReceipt(): BelongsTo
    {
        return $this->belongsTo(GoodsReceipt::class, 'goods_receipt_id', 'id');
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id', 'id');
    }

    public function goodsReceiptDetails(): HasMany
    {
        return $this->hasMany(GoodsReceiptDetail::class, 'goods_receipt_purchase_order_id', 'id');
    }

}
