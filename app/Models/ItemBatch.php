<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ItemBatch extends Model
{
    use HasFactory;

    protected $table = 'item_batches';

    protected $fillable = [
        'sku',
        'source_able_id',
        'source_able_type',
        'item_id',
        'received_at',
        'cogs',
        'stock'
    ];

    public function source_able(): MorphTo
    {
        return $this->morphTo();
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id', 'id');
    }
}
