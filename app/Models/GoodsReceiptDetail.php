<?php

namespace App\Models;

use App\Trait\PolymorphicStockMovements;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceiptDetail extends Model
{
    use HasFactory, PolymorphicStockMovements;

    protected $table = 'goods_receipt_details';

    protected $fillable = [
        'goods_receipt_purchase_order_id',
        'purchase_order_detail_id',
        'received_quantity',
        'shipping_cost',
        'price_per_unit',
        'total_price',
        'cogs'
    ];

    public function goodsReceiptPurchaseOrder(): BelongsTo
    {
        return $this->belongsTo(GoodsReceiptPurchaseOrder::class, 'goods_receipt_purchase_order_id', 'id');
    }

    public function purchaseOrderDetail(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderDetail::class, 'purchase_order_detail_id', 'id');
    }

}
