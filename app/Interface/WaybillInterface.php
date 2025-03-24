<?php

namespace App\Interface;

interface WaybillInterface
{
    public function getAll($branch_id = null);
    public function getById($id);
    public function getSalesOrderWaybillDetails($id);
    public function store(array $data);
}
