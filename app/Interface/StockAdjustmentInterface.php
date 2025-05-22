<?php

namespace App\Interface;

interface StockAdjustmentInterface
{
    public function getAll($filter, $sourceId = null, $sourceType = null);
    public function getAllByBranch($filter, $branchId);
    public function getAllByWarehouse($filter, $warehouseId);
    public function getById(int $id);
    public function store(array $data);
}
