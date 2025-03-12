<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SequenceStatus extends Model
{
    use HasFactory;

    protected $table = 'sequence_statuses';

    protected $fillable = [
        'transaction_sequence_id',
        'user_id',
        'sequence_number',
        'status',
        'expires_at'
    ];

    public function transactionSequence(): BelongsTo
    {
        return $this->belongsTo(TransactionSequence::class, 'transaction_sequence_id', 'id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
