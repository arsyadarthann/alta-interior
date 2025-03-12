<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustmentDetail extends Model
{
    use HasFactory;

    protected $table = 'stock_adjustment_details';

    protected $fillable = [
        'stock_adjustment_id',
        'item_id',
        'type',
        'before_adjustment_quantity',
        'adjustment_quantity',
        'after_adjustment_quantity',
        'reason',
    ];

    public const string TYPE_INCREASED = 'increased';

    public const string TYPE_DECREASED = 'decreased';

    public const string TYPE_BALANCED = 'balanced';

    public function stockAdjustment(): BelongsTo
    {
        return $this->belongsTo(StockAdjustment::class, 'stock_adjustment_id', 'id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id', 'id');
    }
}
