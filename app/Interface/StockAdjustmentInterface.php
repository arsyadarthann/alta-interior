<?php

namespace App\Interface;

interface StockAdjustmentInterface
{
    public function getAll($branchId = null);
    public function getById(int $id);
    public function store(array $data);
}
