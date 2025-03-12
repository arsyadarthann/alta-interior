<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesOrder extends Model
{
    use HasFactory;

    protected $table = 'sales_orders';

    protected $fillable = [
        'code',
        'date',
        'user_id',
        'branch_id',
        'customer_id',
        'customer_name',
        'status'
    ];

    public const string STATUS_PENDING = 'pending';
    public const string STATUS_PROCESSED = 'processed';
    public const string STATUS_COMPLETED = 'completed';
    public const string STATUS_CANCELLED = 'cancelled';

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

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isProcessed(): bool
    {
        return $this->status === self::STATUS_PROCESSED;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function salesOrderDetails(): HasMany
    {
        return $this->hasMany(SalesOrderDetail::class, 'sales_order_id', 'id');
    }

    public function waybills(): HasMany
    {
        return $this->hasMany(Waybill::class, 'sales_order_id', 'id');
    }

}
