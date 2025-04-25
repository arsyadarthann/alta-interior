<?php

namespace App\Interface;

interface StockAdjustmentInterface
{
    public function getAll($sourceId = null, $sourceType = null);
    public function getAllByBranch($branchId);
    public function getAllByWarehouse($warehouseId);
    public function getById(int $id);
    public function store(array $data);
}
