<?php

namespace App\Interface;

interface SalesOrderInterface
{
    public function getAll($filter, $branch_id = null);
    public function getById($id);
    public function getByBranchId($branch_id);
    public function store(array $data);
    public function update($id, array $data);
    public function delete($id);
}
