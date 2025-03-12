<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockAudit extends Model
{
    use HasFactory;

    protected $table = 'stock_audits';

    protected $fillable = [
        'code',
        'date',
        'branch_id',
        'user_id',
        'is_locked'
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function stockAuditDetails(): HasMany
    {
        return $this->hasMany(StockAuditDetail::class, 'stock_audit_id', 'id');
    }
}
