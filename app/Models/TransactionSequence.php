<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class TransactionSequence extends Model
{
    use HasFactory;

    protected $table = 'transaction_sequences';

    protected $fillable = [
        'transaction_prefix_id',
        'source_able_id',
        'source_able_type',
        'month',
        'year',
        'sequence',
    ];

    public function transactionPrefix(): BelongsTo
    {
        return $this->belongsTo(TransactionPrefix::class, 'transaction_prefix_id', 'id');
    }

    public function source_able(): MorphTo
    {
        return $this->morphTo();
    }

    public function sequenceStatuses(): HasMany
    {
        return $this->hasMany(SequenceStatus::class, 'transaction_sequence_id', 'id');
    }
}
