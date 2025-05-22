<?php

namespace App\Interface;

interface StockTransferInterface
{
    public function getAll($filter);
    public function getById(int $id);
    public function store(array $data);
}
