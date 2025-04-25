<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SalesOrderDetail extends Model
{
    use HasFactory;

    protected $table = 'sales_order_details';

    protected $fillable = [
        'sales_order_id',
        'item_id',
        'item_source_able_id',
        'item_source_able_type',
        'quantity',
        'unit_price',
        'total_price'
    ];

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id', 'id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id', 'id');
    }

    public function item_source_able(): MorphTo
    {
        return $this->morphTo();
    }

    public function waybillDetails(): HasMany
    {
        return $this->hasMany(WaybillDetail::class, 'sales_order_detail_id', 'id');
    }

}
