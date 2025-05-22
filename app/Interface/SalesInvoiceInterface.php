<?php

namespace App\Interface;

interface SalesInvoiceInterface
{
    public function getAll($filter, $branchId = null);
    public function getById(int $id);
    public function store(array $data);
    public function getNotPaidSalesInvoiceDetails($branchId);
    public function update(array $data, int $id);
    public function delete(int $id);
}
