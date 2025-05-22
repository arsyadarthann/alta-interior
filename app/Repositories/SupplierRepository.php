<?php

namespace App\Repositories;

use App\Interface\SupplierInterface;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;

class SupplierRepository implements SupplierInterface
{
    public function __construct(private Supplier $supplier) {}

    public function getAll()
    {
        return $this->supplier->all();
    }

    public function getAllPaginate($filter)
    {
        $query = $this->supplier->orderBy('id');

        if (!empty($filter['search'])) {
            $searchTerm = strtolower($filter['search']);
            $query->where(function ($query) use ($searchTerm) {
                $query->whereRaw("LOWER(name) LIKE '%{$searchTerm}%'");
            });
        }

        return $query->paginate(10)->withQueryString();
    }

    public function getById(int $id)
    {
        return $this->supplier->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->supplier->create([
                'name' => $data['name'],
                'contact_name' => $data['contact_name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'address' => $data['address'],
            ]);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $supplier = $this->getById($id);

            $supplier->update([
                'name' => $data['name'],
                'contact_name' => $data['contact_name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'address' => $data['address'],
            ]);
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $supplier = $this->getById($id);
            $supplier->delete();
        });
    }
}
