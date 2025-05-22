<?php

namespace App\Interface;

interface ExpenseInterface
{
    public function getAll($filter, $sourceAbleId = null, $sourceAbleType = null);
    public function getById(int $id);
    public function store(array $data);
    public function update(int $id, array $data);
    public function destroy(int $id);
    public function lockExpense(int $id);
}
