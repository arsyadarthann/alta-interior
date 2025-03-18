<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class PurchaseInvoice extends Model
{
    use HasFactory;

    protected $table = 'purchase_invoices';

    protected $fillable = [
        'code',
        'date',
        'due_date',
        'supplier_id',
        'total_amount',
        'tax_rate_id',
        'tax_amount',
        'grand_total',
        'status',
        'remaining_amount'
    ];

    public const string STATUS_UNPAID = 'unpaid';
    public const string STATUS_PARTIALLY_PAID = 'partially_paid';
    public const string STATUS_PAID = 'paid';

    protected $attributes = [
        'status' => self::STATUS_UNPAID
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class, 'tax_rate_id', 'id');
    }

    public function isUnpaid(): bool
    {
        return $this->status === self::STATUS_UNPAID;
    }

    public function isPartiallyPaid(): bool
    {
        return $this->status === self::STATUS_PARTIALLY_PAID;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function goodsReceipts(): BelongsToMany
    {
        return $this->belongsToMany(GoodsReceipt::class, 'purchase_invoice_goods_receipt', 'purchase_invoice_id', 'goods_receipt_id')->withTimestamps();
    }

    public function purchaseInvoiceDetails(): HasManyThrough
    {
        return $this->hasManyThrough(
            PurchaseInvoiceDetail::class,
            PurchaseInvoiceGoodsReceipt::class,
            'purchase_invoice_id',
            'purchase_invoice_goods_receipt_id',
            'id',
            'id'
        );
    }

    public function purchaseInvoicePayments(): HasMany
    {
        return $this->hasMany(PurchaseInvoicePayment::class, 'purchase_invoice_id', 'id');
    }

}
