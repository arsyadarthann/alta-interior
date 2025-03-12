<?php

namespace App\Trait;

use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Collection;

/**
 * @mixin Model
 */

trait PolymorphicStockMovements
{
    /**
     * @return MorphMany
     */

    public function stockMovements(): MorphMany
    {
        return $this->morphMany(StockMovement::class, 'reference_able', 'reference_able_type', 'reference_able_id');
    }

    /**
     * Ge stock_movements details with reusable logic.
     *
     * @param array $columns
     * @return Collection
     */

    public function getStockMovements(array $columns = ['*']): Collection
    {
        return $this->stockMovements()->with('itemBatch')->select($columns)->get();
    }
}
