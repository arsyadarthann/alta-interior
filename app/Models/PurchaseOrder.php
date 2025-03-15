<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $table = 'purchase_orders';

    protected $fillable = [
        'code',
        'date',
        'branch_id',
        'supplier_id',
        'expected_delivery_date',
        'status',
        'total_amount',
        'tax_rate_id',
        'tax_amount',
        'grand_total',
    ];

    protected $casts = [
        'date' => 'date',
        'expected_delivery_date' => 'date',
    ];

    public const string STATUS_PENDING = 'pending';
    public const string STATUS_PARTIALLY_RECEIVED = 'partially_received';
    public const string STATUS_RECEIVED = 'received';

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class, 'tax_rate_id', 'id');
    }

    public function purchaseOrderDetails(): HasMany
    {
        return $this->hasMany(PurchaseOrderDetail::class, 'purchase_order_id', 'id');
    }

    public function goodsReceipts(): BelongsToMany
    {
        return $this->belongsToMany(GoodsReceipt::class, 'goods_receipt_purchase_order', 'purchase_order_id', 'goods_receipt_id')->withTimestamps();
    }

}
