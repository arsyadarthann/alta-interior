<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class GoodsReceipt extends Model
{
    use HasFactory;

    protected $table = 'goods_receipts';

    protected $fillable = [
        'code',
        'date',
        'supplier_id',
        'received_by',
        'status',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }

    public function purchaseOrders(): BelongsToMany
    {
        return $this->belongsToMany(PurchaseOrder::class, 'goods_receipt_purchase_order', 'goods_receipt_id', 'purchase_order_id')->withTimestamps();
    }

    public function goodsReceiptDetails(): HasManyThrough
    {
        return $this->hasManyThrough(
            GoodsReceiptDetail::class,
            GoodsReceiptPurchaseOrder::class,
            'goods_receipt_id',
            'goods_receipt_purchase_order_id',
            'id',
            'id'
        );
    }
}
