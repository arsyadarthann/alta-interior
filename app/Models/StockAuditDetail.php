<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAuditDetail extends Model
{
    use HasFactory;

    protected $table = 'stock_audit_details';

    protected $fillable = [
        'stock_audit_id',
        'item_id',
        'system_quantity',
        'physical_quantity',
        'discrepancy_quantity',
        'reason'
    ];

    public function stockAudit(): BelongsTo
    {
        return $this->belongsTo(StockAudit::class, 'stock_audit_id', 'id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id', 'id');
    }
}
