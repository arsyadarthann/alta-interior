<?php

namespace App\Interface;

interface StockAuditInterface
{
    public function getAll($sourceId = null, $sourceType = null);
    public function getAllByBranch($branchId);
    public function getAllByWarehouse($warehouseId);
    public function getById(int $id);
    public function store(array $data);
    public function update(int $id, array $data);
    public function destroy(int $id);
    public function lock(int $id);
}
