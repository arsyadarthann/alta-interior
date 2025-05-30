<?php

namespace App\Interface;

interface ItemInterface
{
    public function getAllOnlyItem();
    public function getAll($sourceId = null, $sourceType = null);
    public function getAllPaginate($filter, $sourceId = null, $sourceType = null);
    public function getAllByBranch($branchId = null);
    public function getAllPaginateByBranch($filter, $branchId = null);
    public function getAllByWarehouse($warehouseId = null);
    public function getAllPaginateByWarehouse($filter, $warehouseId = null);
    public function getById(int $id);
    public function store(array $data);
    public function update(int $id, array $data);
    public function destroy(int $id);
    public function getPaginateBatch(int $itemId, int $sourceAbleId, string $sourceAbleType, bool $withWhereStockGreaterThanZero = true);
    public function getBatch(int $itemId, int $sourceAbleId, string $sourceAbleType, bool $withWhereStockGreaterThanZero = true);
    public function sumStock(int $itemId, int $sourceId, string $sourceType);
    public function sumStockByBranch(int $itemId, int $branchId);
    public function sumStockByWarehouse(int $itemId, int $warehouseId);
}
