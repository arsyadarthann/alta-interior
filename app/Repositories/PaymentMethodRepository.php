<?php

namespace App\Repositories;

use App\Interface\PaymentMethodInterface;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\DB;

class PaymentMethodRepository implements PaymentMethodInterface
{
    public function __construct(private PaymentMethod $paymentMethod) {}

    public function getAll()
    {
        return $this->paymentMethod->orderBy('id')->get();
    }

    public function getById(int $id)
    {
        return $this->paymentMethod->find($id);
    }

    public function store(array $data)
    {
        return DB::transaction(function () use ($data) {
            $this->paymentMethod->create([
                'name' => $data['name'],
                'charge_percentage' => $data['charge_percentage'],
                'account_number' => $data['account_number'] ?? null,
                'account_name' => $data['account_name'] ?? null,
            ]);
        });
    }

    public function update(int $id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $paymentMethod = $this->getById($id);
            $paymentMethod->update([
                'name' => $data['name'],
                'charge_percentage' => $data['charge_percentage'],
                'account_number' => $data['account_number'] ?? null,
                'account_name' => $data['account_name'] ?? null,
            ]);
        });
    }

    public function destroy(int $id)
    {
        return DB::transaction(function () use ($id) {
            $paymentMethod = $this->getById($id);
            $paymentMethod->delete();
        });
    }
}
