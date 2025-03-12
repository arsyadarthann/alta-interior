<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ItemCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'item_categories';

    protected $fillable = [
        'name',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'item_category_id', 'id');
    }
}
