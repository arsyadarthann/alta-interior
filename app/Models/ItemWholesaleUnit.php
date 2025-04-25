<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ItemWholesaleUnit extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'item_wholesale_units';

    protected $fillable = [
        'name',
        'abbreviation',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'item_wholesale_unit_id', 'id');
    }
}
