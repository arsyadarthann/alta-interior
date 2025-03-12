<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemBatch extends Model
{
    use HasFactory;

    protected $table = 'item_batches';

    protected $fillable = [
        'sku',
        'branch_id',
        'item_id',
        'received_at',
        'cogs',
        'stock'
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id', 'id');
    }
}
