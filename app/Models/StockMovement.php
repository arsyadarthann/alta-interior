<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockMovement extends Model
{
    use HasFactory;

    protected $table = 'stock_movements';

    protected $fillable = [
        'source_able_id',
        'source_able_type',
        'item_batch_id',
        'type',
        'previous_quantity',
        'movement_quantity',
        'after_quantity',
        'reference_able_id',
        'reference_able_type',
    ];

    public const string TYPE_IN = 'in';
    public const string TYPE_OUT = 'out';
    public const string TYPE_INCREASED = 'increased';
    public const string TYPE_DECREASED = 'decreased';
    public const string TYPE_BALANCED = 'balanced';

    public function source_able():MorphTo
    {
        return $this->morphTo();
    }

    public function itemBatch(): BelongsTo
    {
        return $this->belongsTo(ItemBatch::class, 'item_batch_id', 'id');
    }

    public function referenceable(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'reference_able_type', 'reference_able_id');
    }
}
