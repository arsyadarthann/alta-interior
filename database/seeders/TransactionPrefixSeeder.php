<?php

namespace Database\Seeders;

use App\Models\TransactionPrefix;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TransactionPrefixSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        TransactionPrefix::truncate();

        TransactionPrefix::insert([
            [
                'transaction_type' => 'Purchase Order',
                'prefix_code' => 'PO',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'transaction_type' => 'Stock Transfer',
                'prefix_code' => 'ST',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'transaction_type' => 'Stock Adjustment',
                'prefix_code' => 'SAJ',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'transaction_type' => 'Stock Audit',
                'prefix_code' => 'SA',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'transaction_type' => 'Purchase Invoice Payment',
                'prefix_code' => 'PIP',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'transaction_type' => 'Sales Order',
                'prefix_code' => 'SO',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'transaction_type' => 'Waybill',
                'prefix_code' => 'WB',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'transaction_type' => 'Sales Invoice',
                'prefix_code' => 'INV',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'transaction_type' => 'Sales Invoice Payment',
                'prefix_code' => 'SIP',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'transaction_type' => 'Expense',
                'prefix_code' => 'EXP',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
