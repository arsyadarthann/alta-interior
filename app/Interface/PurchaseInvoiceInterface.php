<?php

namespace App\Interface;

interface PurchaseInvoiceInterface
{
    public function getAll();
    public function getById(int $id);
    public function getNotPaid(int $supplierId);
    public function getNotInvoicedGoodsReceipts(int $supplierId);
    public function store(array $data);
    public function update(int $id, array $data);
    public function destroy(int $id);
}
