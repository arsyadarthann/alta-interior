<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesInvoice extends Model
{
    use HasFactory;

    protected $table = 'sales_invoices';

    protected $fillable = [
        'code',
        'date',
        'due_date',
        'user_id',
        'branch_id',
        'customer_id',
        'customer_name',
        'total_amount',
        'discount_type',
        'discount_percentage',
        'discount_amount',
        'tax_rate_id',
        'tax_amount',
        'grand_total',
        'payment_method_id',
        'paid_status',
        'paid_amount',
        'remaining_amount'
    ];

    public const string DISCOUNT_TYPE_PERCENTAGE = 'percentage';
    public const string DISCOUNT_TYPE_AMOUNT = 'amount';

    public const string STATUS_UNPAID = 'unpaid';
    public const string STATUS_PARTIALLY_PAID = 'partially_paid';
    public const string STATUS_PAID = 'paid';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class, 'tax_rate_id', 'id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id', 'id');
    }

    public function isUnpaid(): bool
    {
        return $this->paid_status === self::STATUS_UNPAID;
    }

    public function isPartiallyPaid(): bool
    {
        return $this->paid_status === self::STATUS_PARTIALLY_PAID;
    }

    public function isPaid(): bool
    {
        return $this->paid_status === self::STATUS_PAID;
    }

    public function salesInvoiceDetails(): HasMany
    {
        return $this->hasMany(SalesInvoiceDetail::class, 'sales_invoice_id', 'id');
    }

    public function salesInvoicePayments(): HasMany
    {
        return $this->hasMany(SalesInvoicePayment::class, 'sales_invoice_id', 'id');
    }

}
