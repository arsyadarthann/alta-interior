<?php

namespace App\Interface;

interface WaybillInterface
{
    public function getAll($filter, $branch_id = null);
    public function getById($id);
    public function getSalesOrderWaybillDetails($id);
    public function getWaybillNotInvoiced($branch_id);
    public function store(array $data);
}
