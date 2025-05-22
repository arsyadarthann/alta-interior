<?php

namespace App\Interface;

interface SupplierInterface
{
    public function getAll();
    public function getAllPaginate($filter);
    public function getById(int $id);
    public function store(array $data);
    public function update(int $id, array $data);
    public function destroy(int $id);
}
