<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseInvoiceDetail extends Model
{
    use HasFactory;

    protected $table = 'purchase_invoice_details';

    protected $fillable = [
        'purchase_invoice_goods_receipt_id',
        'goods_receipt_detail_id',
        'quantity',
        'unit_price',
        'total_price',
    ];

    public function purchaseInvoiceGoodsReceipt(): BelongsTo
    {
        return $this->belongsTo(PurchaseInvoiceGoodsReceipt::class, 'purchase_invoice_goods_receipt_id', 'id');
    }

    public function goodsReceiptDetail(): BelongsTo
    {
        return $this->belongsTo(GoodsReceiptDetail::class, 'goods_receipt_detail_id', 'id');
    }
}
