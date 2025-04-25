<?php

namespace App\Repositories;

use App\Interface\TaxRateInterface;
use App\Models\TaxRate;
use Illuminate\Support\Facades\DB;

class TaxRateRepository implements TaxRateInterface
{
    public function __construct(private TaxRate $taxRate) {}

    public function getAll()
    {
        return $this->taxRate->orderBy('id')->get();
    }

    public function getById(int $id)
    {
        return $this->taxRate->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->taxRate->create([
                'rate' => $data['rate'],
            ]);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $taxRate = $this->getById($id);
            $taxRate->update([
                'rate' => $data['rate'],
            ]);
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $taxRate = $this->getById($id);
            $taxRate->delete();
        });
    }
}
