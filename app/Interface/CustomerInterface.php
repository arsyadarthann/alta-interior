<?php

namespace App\Interface;

interface CustomerInterface
{
    public function getAll($filter);
    public function getAllNoPaginate();
    public function getById(int $id);
    public function getCustomerPricesById(int $id);
    public function editById(int $id);
    public function showById(int $id);
    public function store(array $data);
    public function update(int $id, array $data);
    public function destroy(int $id);
}
