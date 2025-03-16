<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockTransfer extends Model
{
    use HasFactory;

    protected $table = 'stock_transfers';

    protected $fillable = [
        'code',
        'date',
        'source_able_id',
        'source_able_type',
        'destination_able_id',
        'destination_able_type',
        'user_id',
    ];

    public function source_able(): MorphTo
    {
        return $this->morphTo();
    }

    public function destination_able(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function stockTransferDetails(): HasMany
    {
        return $this->hasMany(StockTransferDetail::class, 'stock_transfer_id', 'id');
    }
}
