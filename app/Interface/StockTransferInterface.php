<?php

namespace App\Interface;

interface StockTransferInterface
{
    public function getAll();
    public function getById(int $id);
    public function store(array $data);
}
