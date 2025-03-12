<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class GoodsReceipt extends Model
{
    use HasFactory;

    protected $table = 'goods_receipts';

    protected $fillable = [
        'code',
        'date',
        'branch_id',
        'supplier_id',
        'received_by',
        'shipping_cost'
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }

    public function purchaseOrders(): BelongsToMany
    {
        return $this->belongsToMany(PurchaseOrder::class, 'goods_receipt_purchase_order', 'goods_receipt_id', 'purchase_order_id')->withTimestamps();
    }
}
