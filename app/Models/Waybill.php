<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Waybill extends Model
{
    use HasFactory;

    protected $table = 'waybills';

    protected $fillable = [
        'code',
        'date',
        'user_id',
        'branch_id',
        'sales_order_id',
        'status'
    ];

    public const string STATUS_NOT_INVOICED = 'not_invoiced';
    public const string STATUS_INVOICED = 'invoiced';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'id');
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id', 'id');
    }

    public function isNotInvoiced(): bool
    {
        return $this->status === self::STATUS_NOT_INVOICED;
    }

    public function isInvoiced(): bool
    {
        return $this->status === self::STATUS_INVOICED;
    }

    public function waybillDetails(): HasMany
    {
        return $this->hasMany(WaybillDetail::class, 'waybill_id', 'id');
    }

    public function salesInvoiceDetails(): HasMany
    {
        return $this->hasMany(SalesInvoiceDetail::class, 'waybill_id', 'id');
    }

}
