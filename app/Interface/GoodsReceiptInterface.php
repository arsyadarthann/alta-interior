<?php

namespace App\Interface;

interface GoodsReceiptInterface
{
    public function getAll($filter);
    public function getById(int $id);
    public function getUnreceivedPurchaseOrderDetails($supplierId);
    public function store(array $data);
}
