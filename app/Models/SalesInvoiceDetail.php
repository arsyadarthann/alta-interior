<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesInvoiceDetail extends Model
{
    use HasFactory;

    protected $table = 'sales_invoice_details';

    protected $fillable = [
        'sales_invoice_id',
        'waybill_id'
    ];

    public function salesInvoice(): BelongsTo
    {
        return $this->belongsTo(SalesInvoice::class, 'sales_invoice_id', 'id');
    }

    public function waybill(): BelongsTo
    {
        return $this->belongsTo(Waybill::class, 'waybill_id', 'id');
    }
}
