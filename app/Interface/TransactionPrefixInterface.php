<?php

namespace App\Interface;

interface TransactionPrefixInterface
{
    public function getAll();
    public function update(array $data);
}
