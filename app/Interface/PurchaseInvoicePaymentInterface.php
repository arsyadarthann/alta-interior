<?php

namespace App\Interface;

interface PurchaseInvoicePaymentInterface
{
    public function getAll();
    public function getById(int $id);
    public function store(array $data);
}
