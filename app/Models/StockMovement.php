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
        'branch_id',
        'item_id',
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

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'id');
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
