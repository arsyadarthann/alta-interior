<?php

namespace App\Repositories;

use App\Interface\TransactionPrefixInterface;
use App\Models\TransactionPrefix;
use Illuminate\Support\Facades\DB;

class TransactionPrefixRepository implements TransactionPrefixInterface
{
    public function __construct(private TransactionPrefix $transactionPrefix) {}

    public function getAll()
    {
        return $this->transactionPrefix->orderBy('id')->get();
    }

    public function update(array $data)
    {
        return DB::transaction(function () use ($data) {
            foreach ($data['prefixes'] as $prefix) {
                $transactionPrefix = $this->transactionPrefix->find($prefix['id']);
                $transactionPrefix->update([
                    'prefix_code' => $prefix['prefix_code'],
                ]);
            }
        });
    }
}
