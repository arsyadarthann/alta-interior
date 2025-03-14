<?php

namespace App\Interface;

interface ItemInterface
{
    public function getAll($branchId = null);
    public function getById(int $id);
    public function store(array $data);
    public function update(int $id, array $data);
    public function destroy(int $id);

    public function sumStock(int $itemId, int $branchId);
}
