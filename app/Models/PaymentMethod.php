<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentMethod extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'payment_methods';

    protected $fillable = [
        'name',
        'charge_percentage',
    ];

    public function purchaseInvoicePayments(): HasMany
    {
        return $this->hasMany(PurchaseInvoicePayment::class, 'payment_method_id', 'id');
    }

    public function salesInvoicePayments(): HasMany
    {
        return $this->hasMany(SalesInvoicePayment::class, 'payment_method_id', 'id');
    }
}
