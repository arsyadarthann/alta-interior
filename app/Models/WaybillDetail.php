<?php

namespace App\Models;

use App\Trait\PolymorphicStockMovements;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaybillDetail extends Model
{
    use HasFactory, PolymorphicStockMovements;

    protected $table = 'waybill_details';

    protected $fillable = [
        'waybill_id',
        'sales_order_detail_id',
        'quantity',
        'description'
    ];

    public function waybill(): BelongsTo
    {
        return $this->belongsTo(Waybill::class, 'waybill_id', 'id');
    }

    public function salesOrderDetail(): BelongsTo
    {
        return $this->belongsTo(SalesOrderDetail::class, 'sales_order_detail_id', 'id');
    }

}
