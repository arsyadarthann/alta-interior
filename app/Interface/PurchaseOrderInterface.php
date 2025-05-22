<?php

namespace App\Interface;

interface PurchaseOrderInterface
{
    public function getAll($filter);
    public function getById(int $id);
    public function store(array $data);
    public function update(int $id, array $data);
    public function destroy(int $id);
}
