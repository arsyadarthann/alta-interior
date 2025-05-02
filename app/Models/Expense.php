<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Expense extends Model
{
    protected $table = 'expenses';

    protected $fillable = [
        'code',
        'date',
        'source_able_id',
        'source_able_type',
        'total_amount',
        'is_locked',
        'user_id'
    ];

    public function source_able(): BelongsTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function expenseDetails(): HasMany
    {
        return $this->hasMany(ExpenseDetail::class, 'expense_id', 'id');
    }
}
