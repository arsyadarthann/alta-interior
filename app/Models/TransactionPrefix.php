<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransactionPrefix extends Model
{
    use HasFactory;

    protected $table = 'transaction_prefixes';

    protected $fillable = [
        'transaction_type',
        'prefix_code',
    ];

    public function transactionSequences(): HasMany
    {
        return $this->hasMany(TransactionSequence::class, 'transaction_prefix_id', 'id');
    }
}
